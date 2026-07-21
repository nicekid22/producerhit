// voice-profile/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fbGetProfile } from "../_shared/firestoreServer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getUserId(authHeader: string): Promise<string | null> {
  const token = authHeader.replace("Bearer ", "").trim();
  const firebaseApiKey = Deno.env.get("FIREBASE_API_KEY") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  if (firebaseApiKey && token.startsWith("eyJ")) {
    try {
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      });
      if (res.ok) {
        const j = (await res.json()) as { users?: Array<{ localId?: string }> };
        const uid = j.users?.[0]?.localId ?? null;
        if (uid) return uid;
      }
    } catch { /* fall through */ }
  }
  if (supabaseUrl && anonKey) {
    const sc = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await sc.auth.getUser();
    return user?.id ?? null;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  try {
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const userId = await getUserId(authHeader);
    if (!userId) return json({ error: "unauthorized" }, 401);

    const body = (await req.json().catch(() => ({}))) as {
      action?: string; name?: string; storagePath?: string; sampleSec?: number | null; id?: string;
    };
    const action = String(body.action ?? "list");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const sc = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });

    if (action === "list") {
      const { data, error } = await sc.from("voice_profiles")
        .select("id, name, storage_path, sample_sec, created_at")
        .eq("user_id", userId).order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ profiles: data ?? [] });
    }

    if (action === "delete") {
      const id = String(body.id ?? "").trim();
      if (!id) return json({ error: "missing_id" }, 400);
      const admin = createClient(supabaseUrl, serviceKey);
      const { data: row } = await sc.from("voice_profiles").select("storage_path").eq("id", id).eq("user_id", userId).maybeSingle();
      if (!row?.storage_path) return json({ error: "not_found" }, 404);
      await sc.from("voice_profiles").delete().eq("id", id).eq("user_id", userId);
      void admin.storage.from("voice-profiles").remove([row.storage_path]);
      return json({ ok: true });
    }

    if (action === "save") {
      const fbProfile = await fbGetProfile(userId);
      const plan = fbProfile?.plan ?? "free";
      const maxProfiles = plan === "studio" || plan === "plus" ? 10 : plan === "pro" ? 2 : 1;

      const storagePath = String(body.storagePath ?? "").trim();
      if (!storagePath.startsWith(`${userId}/`)) return json({ error: "invalid_path" }, 400);
      const admin = createClient(supabaseUrl, serviceKey);

      const { count } = await sc.from("voice_profiles").select("id", { count: "exact", head: true }).eq("user_id", userId);
      if ((count ?? 0) >= maxProfiles) return json({ error: "profile_limit_reached", limit: maxProfiles, plan }, 402);

      const { data: fileData, error: dlErr } = await admin.storage.from("voice-profiles").download(storagePath);
      if (dlErr || !fileData) return json({ error: "file_not_found" }, 404);
      if (fileData.size < 800) return json({ error: "audio_too_short" }, 400);

      const sampleSec = typeof body.sampleSec === "number" && Number.isFinite(body.sampleSec) ? body.sampleSec : null;
      const { data: inserted, error: insErr } = await sc.from("voice_profiles").insert({
        user_id: userId,
        name: String(body.name ?? "Ma voix").trim().slice(0, 80) || "Ma voix",
        storage_path: storagePath,
        sample_sec: sampleSec,
      }).select("id, name, storage_path, sample_sec, created_at").single();
      if (insErr) return json({ error: insErr.message }, 500);
      return json({ profile: inserted });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    console.error("voice-profile", e);
    return json({ error: "server_error" }, 500);
  }
});