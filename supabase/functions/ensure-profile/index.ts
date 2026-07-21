// ensure-profile/index.ts
//
// Called by the web/mobile frontend after a Firebase user logs in.
// Verifies the Firebase ID token via Identity Toolkit, then upserts a row
// into `public.profiles` (Supabase) using the service role key so RLS is
// bypassed. Idempotent — safe to call on every login.
//
// This dual-write keeps the existing Stripe / Apple IAP / distribution
// Edge Functions working unchanged: they all read/write `public.profiles`
// by `id`, so once a Firebase user has a row here, billing works.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifyFirebaseIdToken(
  token: string,
  apiKey: string,
): Promise<{ uid: string; email?: string } | null> {
  if (!token.startsWith("eyJ")) return null;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      users?: Array<{ localId?: string; email?: string }>;
    };
    const u = json.users?.[0];
    if (!u?.localId) return null;
    return { uid: u.localId, email: u.email };
  } catch {
    return null;
  }
}

function referralCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").trim();
  const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  const firebaseApiKey = (Deno.env.get("FIREBASE_API_KEY") ?? "").trim();

  if (!supabaseUrl || !serviceKey) return json({ error: "Server not configured" }, 500);
  if (!firebaseApiKey) return json({ error: "Firebase not configured" }, 500);

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return json({ error: "Authentication required" }, 401);

  const verified = await verifyFirebaseIdToken(token, firebaseApiKey);
  if (!verified) return json({ error: "Invalid Firebase token" }, 401);

  const { uid, email } = verified;

  // Upsert profile — only fills in fields that are missing, never overwrites
  // existing plan / billing / usage state.
  const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(uid)}`;
  const selectRes = await fetch(url, {
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  let exists = false;
  if (selectRes.ok) {
    const rows = (await selectRes.json()) as unknown[];
    exists = Array.isArray(rows) && rows.length > 0;
  }

  if (exists) {
    return json({ ok: true, status: "exists", id: uid });
  }

  // Insert minimal profile row. All columns have defaults except id.
  // Pick only columns known to exist on the table.
  const insertBody = JSON.stringify({
    id: uid,
    email: email ?? null,
    plan: "free",
    loops_used_this_month: 0,
    referral_code: referralCode(),
  });

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
      Prefer: "return=minimal,resolution=ignore-duplicates",
    },
    body: insertBody,
  });

  if (!insertRes.ok) {
    const text = await insertRes.text().catch(() => "");
    // 409 conflict = already exists, treat as ok
    if (insertRes.status === 409) return json({ ok: true, status: "exists", id: uid });
    return json({ ok: false, error: text || `Insert failed (${insertRes.status})` }, 500);
  }

  return json({ ok: true, status: "created", id: uid });
});
