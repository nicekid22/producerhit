import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SOCIAL_VIDEO_SEC = 6;

const VHS_STYLE_SUFFIX =
  "retro VHS aesthetic, analog tape grain, subtle scanlines, chromatic aberration, nostalgic 90s music video mood, cinematic lighting, seamless infinite loop motion";

const SOCIAL_ANIMATIONS = [
  "seamless perfect loop, slowly rotating 360 degrees, first and last frame match",
  "seamless loop, gently floating up and down, cyclic motion repeats smoothly",
  "seamless loop, slow orbit camera, full cycle returns to start frame",
  "seamless loop, breathing zoom in and out, motion cycles back to start",
] as const;

function pickAnimation(seed: number): string {
  return SOCIAL_ANIMATIONS[Math.abs(seed) % SOCIAL_ANIMATIONS.length];
}

function buildSocialVideoPrompt(basePrompt: string, seed: number): string {
  const trimmed = basePrompt.trim().slice(0, 160) || "dreamy beat";
  return `${trimmed}. ${pickAnimation(seed)}. ${VHS_STYLE_SUFFIX}`;
}

function aspectForLayout(layout: string): string {
  return layout === "square" ? "1:1" : "9:16";
}

async function tryGenerateVideo(
  prompt: string,
  seed: number,
  aspectRatio: string,
  apiKey: string,
): Promise<{ bytes: Uint8Array | null; failReason?: string }> {
  const params = new URLSearchParams({
    model: "ltx-2",
    duration: String(SOCIAL_VIDEO_SEC),
    aspectRatio,
    audio: "false",
    seed: String(seed),
  });
  const url = `https://gen.pollinations.ai/video/${encodeURIComponent(prompt)}?${params.toString()}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 140_000);
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn("generate-social-video: pollinations", res.status, body.slice(0, 400));
      return { bytes: null, failReason: `pollinations_${res.status}` };
    }
    const ct = (res.headers.get("content-type") ?? "").toLowerCase();
    if (!ct.includes("video")) {
      console.warn("generate-social-video: unexpected content-type", ct);
      return { bytes: null, failReason: "pollinations_not_video" };
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength < 8_000) return { bytes: null, failReason: "pollinations_too_small" };
    return { bytes: buf };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("generate-social-video: fetch failed", msg);
    return { bytes: null, failReason: msg.includes("abort") ? "pollinations_timeout" : "pollinations_fetch" };
  } finally {
    clearTimeout(timer);
  }
}

async function uploadVideo(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  storagePath: string,
  videoBytes: Uint8Array,
): Promise<{ ok: true; videoUrl: string } | { ok: false; message: string }> {
  const { error: uploadError } = await admin.storage.from(bucket).upload(storagePath, videoBytes, {
    contentType: "video/mp4",
    upsert: false,
    cacheControl: "604800",
  });

  if (uploadError) {
    return { ok: false, message: uploadError.message };
  }

  const { data: publicUrl } = admin.storage.from(bucket).getPublicUrl(storagePath);
  const videoUrl = publicUrl?.publicUrl?.trim();
  if (!videoUrl) return { ok: false, message: "missing_public_url" };
  return { ok: true, videoUrl };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const pollinationsKey = Deno.env.get("POLLINATIONS_API_KEY") ?? "";

    if (!supabaseUrl || !anonKey || !serviceKey || !pollinationsKey) {
      return new Response(JSON.stringify({ error: "server_misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authed = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const {
      data: { user },
      error: authError,
    } = await authed.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as {
      loopId?: unknown;
      coverPrompt?: unknown;
      videoPrompt?: unknown;
      seed?: unknown;
      layout?: unknown;
      idempotencyKey?: unknown;
    };

    const loopId = typeof body.loopId === "string" ? body.loopId.trim() : "";
    const coverPrompt = typeof body.coverPrompt === "string" ? body.coverPrompt.trim() : "";
    const videoPromptRaw = typeof body.videoPrompt === "string" ? body.videoPrompt.trim() : "";
    const videoPrompt = videoPromptRaw || coverPrompt;
    const seedRaw = typeof body.seed === "number" ? body.seed : Number(body.seed);
    const seed = Number.isFinite(seedRaw) ? Math.floor(seedRaw) : 0;
    const layout = body.layout === "square" ? "square" : "story";
    const idempotencyRaw = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
    const usageKey =
      idempotencyRaw.length >= 8 && idempotencyRaw.length <= 120
        ? `social-video:${user.id}:${idempotencyRaw}`
        : `social-video:${user.id}:${loopId}:${crypto.randomUUID()}`;

    if (!loopId || !videoPrompt) {
      return new Response(JSON.stringify({ error: "loopId and videoPrompt required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: checkRows, error: checkErr } = await authed.rpc("check_loops_usage_idempotent", {
      p_key: usageKey,
    });
    if (checkErr) throw new Error(checkErr.message);
    const check = Array.isArray(checkRows) ? checkRows[0] : checkRows;
    if (!check?.ok) {
      return new Response(
        JSON.stringify({
          error: "no_credits",
          used: check?.used,
          limit: check?.limit,
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aspectRatio = aspectForLayout(layout);
    const prompt = buildSocialVideoPrompt(videoPrompt, seed);
    const generated = await tryGenerateVideo(prompt, seed, aspectRatio, pollinationsKey);

    if (!generated.bytes) {
      return new Response(
        JSON.stringify({
          error: "video_generation_failed",
          detail: generated.failReason ?? "unknown",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const storagePath = `${user.id}/${loopId}/${Date.now()}.mp4`;
    let uploaded = await uploadVideo(admin, "social-videos", storagePath, generated.bytes);

    if (!uploaded.ok && uploaded.message.toLowerCase().includes("bucket")) {
      uploaded = await uploadVideo(admin, "loop-covers", `social/${storagePath}`, generated.bytes);
    }

    if (!uploaded.ok) {
      console.warn("generate-social-video: upload", uploaded.message);
      return new Response(
        JSON.stringify({ error: "upload_failed", detail: uploaded.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: usedAfter, error: bumpErr } = await authed.rpc("bump_loops_usage_idempotent", {
      p_key: usageKey,
    });
    if (bumpErr) {
      console.warn("generate-social-video: bump failed", bumpErr.message);
    }

    return new Response(
      JSON.stringify({
        videoUrl: uploaded.videoUrl,
        durationSec: SOCIAL_VIDEO_SEC,
        layout,
        used: typeof usedAfter === "number" ? usedAfter : check.used,
        limit: check.limit,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-social-video error:", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
