import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const BUCKET = "loop-audio";
const DEFAULT_RETENTION_DAYS = 7;
const DEFAULT_BATCH = 80;

function retentionDays(): number {
  const raw = Number(Deno.env.get("LOOP_AUDIO_RETENTION_DAYS") ?? DEFAULT_RETENTION_DAYS);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_RETENTION_DAYS;
}

function isAuthorized(req: Request): boolean {
  const cronSecret = (Deno.env.get("CRON_SECRET") ?? "").trim();
  if (cronSecret) {
    const header = req.headers.get("x-cron-secret")?.trim();
    if (header === cronSecret) return true;
  }
  const auth = req.headers.get("authorization") ?? "";
  const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  if (serviceKey && auth === `Bearer ${serviceKey}`) return true;
  return false;
}

function parseStoragePath(audioUrl: string): string | null {
  const marker = "/loop-audio/";
  const idx = audioUrl.indexOf(marker);
  if (idx < 0) return null;
  const path = audioUrl.slice(idx + marker.length).split("?")[0]?.trim();
  if (!path || !path.includes("/")) return null;
  return path;
}

function storagePathsForLoop(userId: string, loopId: string): string[] {
  return ["mp3", "wav", "m4a", "ogg", "webm"].map((ext) => `${userId}/${loopId}.${ext}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const days = retentionDays();
  const batch = DEFAULT_BATCH;

  const { data: rows, error: listErr } = await sb.rpc("list_expired_loop_audio_rows", {
    p_retention_days: days,
    p_limit: batch,
  });

  if (listErr) {
    return new Response(JSON.stringify({ error: listErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const expired = (rows ?? []) as Array<{
    loop_id: string;
    user_id: string;
    audio_url: string | null;
    created_at: string;
  }>;

  const pathsToRemove = new Set<string>();
  const loopIds: string[] = [];

  for (const row of expired) {
    loopIds.push(row.loop_id);
    const url = typeof row.audio_url === "string" ? row.audio_url.trim() : "";
    const parsed = url ? parseStoragePath(url) : null;
    if (parsed) pathsToRemove.add(parsed);
    for (const p of storagePathsForLoop(row.user_id, row.loop_id)) {
      pathsToRemove.add(p);
    }
  }

  let storageRemoved = 0;
  const pathList = [...pathsToRemove];
  if (pathList.length) {
    const chunkSize = 50;
    for (let i = 0; i < pathList.length; i += chunkSize) {
      const chunk = pathList.slice(i, i + chunkSize);
      const { data, error } = await sb.storage.from(BUCKET).remove(chunk);
      if (error) {
        console.warn("[purge-loop-audio] storage remove:", error.message);
      } else {
        storageRemoved += data?.length ?? chunk.length;
      }
    }
  }

  let dbUpdated = 0;
  if (loopIds.length) {
    const { data, error } = await sb
      .from("loops")
      .update({
        audio_url: null,
        provider_audio_inline: null,
        is_public: false,
      })
      .in("id", loopIds)
      .select("id");
    if (error) {
      return new Response(JSON.stringify({ error: error.message, storageRemoved, loopIds }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    dbUpdated = data?.length ?? 0;
  }

  return new Response(
    JSON.stringify({
      ok: true,
      retentionDays: days,
      scanned: expired.length,
      storagePathsRemoved: storageRemoved,
      loopsUpdated: dbUpdated,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
