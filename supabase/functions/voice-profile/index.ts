import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user?.id) return json({ error: "unauthorized" }, 401);

    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      name?: string;
      storagePath?: string;
      sampleSec?: number | null;
      id?: string;
    };
    const action = String(body.action ?? "list");

    if (action === "list") {
      const { data, error } = await userClient
        .from("voice_profiles")
        .select("id, name, storage_path, sample_sec, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ profiles: data ?? [] });
    }

    if (action === "delete") {
      const id = String(body.id ?? "").trim();
      if (!id) return json({ error: "missing_id" }, 400);
      const admin = createClient(supabaseUrl, serviceKey);
      const { data: row } = await userClient
        .from("voice_profiles")
        .select("storage_path")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!row?.storage_path) return json({ error: "not_found" }, 404);
      await userClient.from("voice_profiles").delete().eq("id", id).eq("user_id", user.id);
      void admin.storage.from("voice-profiles").remove([row.storage_path]);
      return json({ ok: true });
    }

    if (action === "save") {
      const storagePath = String(body.storagePath ?? "").trim();
      const name = String(body.name ?? "Ma voix").trim().slice(0, 80) || "Ma voix";
      if (!storagePath.startsWith(`${user.id}/`)) return json({ error: "invalid_path" }, 400);

      const { data: planRow } = await userClient.from("profiles").select("plan").eq("id", user.id).maybeSingle();
      const plan = typeof planRow?.plan === "string" ? planRow.plan : "free";
      const maxProfiles =
        plan === "studio" || plan === "plus" ? 10 : plan === "pro" ? 2 : 1;

      const { count } = await userClient
        .from("voice_profiles")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if ((count ?? 0) >= maxProfiles) {
        return json({ error: "profile_limit_reached", limit: maxProfiles, plan }, 402);
      }

      const admin = createClient(supabaseUrl, serviceKey);
      const { data: fileData, error: dlErr } = await admin.storage.from("voice-profiles").download(storagePath);
      if (dlErr || !fileData) return json({ error: "file_not_found" }, 404);
      if (fileData.size < 800) return json({ error: "audio_too_short" }, 400);

      const sampleSec =
        typeof body.sampleSec === "number" && Number.isFinite(body.sampleSec) ? body.sampleSec : null;

      const { data: inserted, error: insErr } = await userClient
        .from("voice_profiles")
        .insert({
          user_id: user.id,
          name,
          storage_path: storagePath,
          sample_sec: sampleSec,
        })
        .select("id, name, storage_path, sample_sec, created_at")
        .single();
      if (insErr) return json({ error: insErr.message }, 500);
      return json({ profile: inserted });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    console.error("voice-profile", e);
    return json({ error: "server_error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
