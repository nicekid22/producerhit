// ensure-profile/index.ts
//
// Called by the web/mobile frontend after a Firebase user logs in.
// Verifies the Firebase ID token via Identity Toolkit, then upserts a profile
// document in Firestore (primary source of truth). Optionally mirrors to
// Supabase `public.profiles` for backwards compatibility with billing Edge
// Functions that still read from there. Idempotent — safe to call on every login.

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

/** Get a Firestore access token using the service account credentials. */
async function getFirestoreToken(firestoreJson: string): Promise<string | null> {
  try {
    const creds = JSON.parse(firestoreJson);
    const { client_email, private_key } = creds;
    if (!client_email || !private_key) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    const exp = nowSec + 3600;
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const claim = btoa(JSON.stringify({
      iss: client_email,
      sub: client_email,
      aud: "https://oauth2.googleapis.com/token",
      iat: nowSec,
      exp,
      scope: "https://www.googleapis.com/auth/datastore",
    })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

    const signingInput = header + "." + claim;
    const keyData = private_key
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\n/g, "");
    const raw = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
    const binaryKey = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      encoder.encode(signingInput),
    );
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const signedJwt = signingInput + "." + sigB64;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: signedJwt,
      }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string };
    return tokenData.access_token ?? null;
  } catch {
    return null;
  }
}

function toFirestoreValue(v: unknown): unknown {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: v } : { doubleValue: v };
  if (typeof v === "string") return { stringValue: v };
  return { stringValue: String(v) };
}

async function firestoreGetProfile(projectId: string, accessToken: string, uid: string): Promise<Record<string, unknown> | null> {
  const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/profiles/${encodeURIComponent(uid)}`;
  const res = await fetch(docUrl, {
    headers: { Authorization: "Bearer " + accessToken },
  });
  if (!res.ok) return null;
  const doc = await res.json() as { fields?: Record<string, unknown> };
  if (!doc.fields) return null;
  // Unwrap Firestore field format
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    const fv = v as Record<string, unknown>;
    if ("stringValue" in fv) out[k] = fv.stringValue;
    else if ("integerValue" in fv) out[k] = Number(fv.integerValue);
    else if ("doubleValue" in fv) out[k] = Number(fv.doubleValue);
    else if ("booleanValue" in fv) out[k] = fv.booleanValue;
    else if ("nullValue" in fv) out[k] = null;
  }
  return out;
}

async function firestoreCreateProfile(
  projectId: string,
  accessToken: string,
  uid: string,
  email: string | null,
): Promise<boolean> {
  const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/profiles/${encodeURIComponent(uid)}`;
  const fields: Record<string, unknown> = {
    id: { stringValue: uid },
    email: email ? { stringValue: email } : { nullValue: null },
    plan: { stringValue: "free" },
    loops_used_this_month: { integerValue: 0 },
    referral_code: { stringValue: referralCode() },
  };
  const res = await fetch(docUrl, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });
  return res.ok || res.status === 409;
}

async function firestoreUpsertProfile(
  projectId: string,
  accessToken: string,
  uid: string,
  fields: Record<string, unknown>,
): Promise<boolean> {
  const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/profiles/${encodeURIComponent(uid)}`;
  const fsFields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    fsFields[k] = toFirestoreValue(v);
  }
  const res = await fetch(docUrl, {
    method: "PATCH",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: fsFields }),
  });
  return res.ok;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").trim();
  const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  const firebaseApiKey = (Deno.env.get("FIREBASE_API_KEY") ?? "").trim();
  const firestoreJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON") ?? "";

  if (!firebaseApiKey) return json({ error: "Firebase not configured" }, 500);
  if (!firestoreJson) return json({ error: "Firestore not configured" }, 500);

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return json({ error: "Authentication required" }, 401);

  const verified = await verifyFirebaseIdToken(token, firebaseApiKey);
  if (!verified) return json({ error: "Invalid Firebase token" }, 401);

  const { uid, email } = verified;

  // Get Firestore access token
  const accessToken = await getFirestoreToken(firestoreJson);
  if (!accessToken) return json({ error: "Failed to get Firestore access token" }, 500);

  // Parse project ID from service account JSON
  const creds = JSON.parse(firestoreJson);
  const projectId = creds.project_id;
  if (!projectId) return json({ error: "Missing project_id in service account" }, 500);

  // 1) Check if profile exists in Firestore
  const existingProfile = await firestoreGetProfile(projectId, accessToken, uid);

  if (existingProfile) {
    // Profile exists in Firestore — that's the source of truth. Done.
    return json({ ok: true, status: "exists", id: uid });
  }

  // 2) Profile doesn't exist in Firestore — check Supabase for legacy data
  if (supabaseUrl && serviceKey) {
    try {
      const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(uid)}&select=plan,loops_used_this_month,referral_bonus,level_bonus,daily_bonus_month,purchased_bonus,referral_code,email`;
      const rowRes = await fetch(url, {
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      if (rowRes.ok) {
        const rows = (await rowRes.json()) as Array<Record<string, unknown>>;
        const row = rows?.[0];
        if (row) {
          // Migrate Supabase profile to Firestore
          await firestoreUpsertProfile(projectId, accessToken, uid, row);
          return json({ ok: true, status: "migrated", id: uid });
        }
      }
    } catch (e) {
      console.error("ensure-profile: Supabase lookup failed:", e);
    }
  }

  // 3) No profile anywhere — create fresh in Firestore
  const created = await firestoreCreateProfile(projectId, accessToken, uid, email ?? null);
  if (!created) return json({ ok: false, error: "Failed to create profile in Firestore" }, 500);

  // 4) Best-effort: also create in Supabase for billing compatibility
  if (supabaseUrl && serviceKey) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/profiles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          "Content-Type": "application/json",
          Prefer: "return=minimal,resolution=ignore-duplicates",
        },
        body: JSON.stringify({
          id: uid,
          email: email ?? null,
          plan: "free",
          loops_used_this_month: 0,
          referral_code: referralCode(),
        }),
      });
    } catch (e) {
      console.error("ensure-profile: Supabase insert failed (best-effort):", e);
    }
  }

  return json({ ok: true, status: "created", id: uid });
});
