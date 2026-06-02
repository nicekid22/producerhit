import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COVER_ART_STYLE_SUFFIX =
  "A single, abstract object with a glass surface floating against a solid black background. Irregular organic shape, glass-like finish, prismatic light leaks, clean modern aesthetic";

const COVER_VIDEO_ANIMATIONS = [
  "seamless perfect loop, slowly rotating 360 degrees, first and last frame identical",
  "seamless loop, gently floating up and down, cyclic motion that repeats smoothly",
  "seamless loop, drifting horizontally with subtle parallax, motion cycles back to start",
  "seamless loop, slow cinematic zoom in and out, breathing motion that repeats",
  "seamless loop, orbiting camera around the subject, full cycle returns to start frame",
  "seamless loop, slowly tilting and swaying like zero gravity, smooth cyclic motion",
] as const;

function pickAnimation(seed: number): string {
  const idx = Math.abs(seed) % COVER_VIDEO_ANIMATIONS.length;
  return COVER_VIDEO_ANIMATIONS[idx];
}

/** 6–8 s loop covers — stable per seed. */
function pickVideoDurationSec(seed: number): number {
  return 6 + (Math.abs(seed) % 3);
}

function buildCoverVideoPrompt(basePrompt: string, seed: number): string {
  const trimmed = basePrompt.trim().slice(0, 140) || "dreamy beat";
  const animation = pickAnimation(seed);
  const loopHint = "seamless infinite loop clip, motion must cycle smoothly so the end matches the start";
  return `${trimmed}. ${animation}. ${loopHint}. ${COVER_ART_STYLE_SUFFIX}`;
}

function buildPollinationsImageUrl(basePrompt: string, seed: number): string {
  const prompt = `${basePrompt.trim().slice(0, 160) || "dreamy beat"} ${COVER_ART_STYLE_SUFFIX}`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&seed=${seed}&nologo=true`;
}

async function tryGenerateVideo(
  prompt: string,
  seed: number,
  durationSec: number,
  apiKey: string,
): Promise<Uint8Array | null> {
  const params = new URLSearchParams({
    model: "ltx-2",
    duration: String(durationSec),
    aspectRatio: "1:1",
    audio: "false",
    seed: String(seed),
  });
  const url = `https://gen.pollinations.ai/video/${encodeURIComponent(prompt)}?${params.toString()}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 150_000);
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn("generate-cover-media: video HTTP", res.status, await res.text().catch(() => ""));
      return null;
    }
    const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
    if (!contentType.includes("video")) {
      console.warn("generate-cover-media: unexpected content-type", contentType);
      return null;
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength < 8_000) return null;
    return buf;
  } catch (e) {
    console.warn("generate-cover-media: video fetch failed", e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
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
      seed?: unknown;
      preferVideo?: unknown;
    };

    const loopId = typeof body.loopId === "string" ? body.loopId.trim() : "";
    const coverPrompt = typeof body.coverPrompt === "string" ? body.coverPrompt.trim() : "";
    const seedRaw = typeof body.seed === "number" ? body.seed : Number(body.seed);
    const seed = Number.isFinite(seedRaw) ? Math.floor(seedRaw) : 0;
    const preferVideo = body.preferVideo !== false;

    if (!loopId || !coverPrompt) {
      return new Response(JSON.stringify({ error: "loopId and coverPrompt required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageUrl = buildPollinationsImageUrl(coverPrompt, seed);

    if (!preferVideo || !pollinationsKey) {
      return new Response(JSON.stringify({ coverUrl: imageUrl, coverKind: "image" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const videoPrompt = buildCoverVideoPrompt(coverPrompt, seed);
    const durationSec = pickVideoDurationSec(seed);
    const videoBytes = await tryGenerateVideo(videoPrompt, seed, durationSec, pollinationsKey);

    if (!videoBytes) {
      return new Response(JSON.stringify({ coverUrl: imageUrl, coverKind: "image", fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const storagePath = `${user.id}/covers/${loopId}.mp4`;
    const { error: uploadError } = await admin.storage.from("loop-covers").upload(storagePath, videoBytes, {
      contentType: "video/mp4",
      upsert: true,
      cacheControl: "31536000",
    });

    if (uploadError) {
      console.warn("generate-cover-media: upload failed", uploadError.message);
      return new Response(JSON.stringify({ coverUrl: imageUrl, coverKind: "image", fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrl } = admin.storage.from("loop-covers").getPublicUrl(storagePath);
    const coverUrl = publicUrl?.publicUrl?.trim();
    if (!coverUrl) {
      return new Response(JSON.stringify({ coverUrl: imageUrl, coverKind: "image", fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ coverUrl, coverKind: "video" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-cover-media error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
