import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COVER_STYLE_SUFFIX =
  "abstract glass object on solid black background, prismatic highlights, editorial portrait ambiance";

function buildPollinationsFallbackUrl(query: string, seed: number, layout: string): string {
  const trimmed = query.trim().slice(0, 120) || "music mood";
  const prompt = `${trimmed}. ${COVER_STYLE_SUFFIX}`;
  const w = layout === "square" ? 1080 : 1080;
  const h = layout === "square" ? 1080 : 1920;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&seed=${seed}&nologo=true`;
}

async function searchPexels(
  query: string,
  seed: number,
  layout: string,
  apiKey: string,
): Promise<{ imageUrl: string; source: string } | null> {
  const page = (Math.abs(seed) % 8) + 1;
  const orientation = layout === "square" ? "square" : "portrait";
  const params = new URLSearchParams({
    query: query.slice(0, 80),
    per_page: "15",
    page: String(page),
    orientation,
  });
  const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: apiKey },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    photos?: Array<{ src?: { large2x?: string; large?: string; portrait?: string } }>;
  };
  const photos = json.photos?.filter((p) => p.src?.large2x || p.src?.large || p.src?.portrait) ?? [];
  if (!photos.length) return null;
  const pick = photos[Math.abs(seed + page) % photos.length]!;
  const src = pick.src ?? {};
  const imageUrl = (layout === "square" ? src.large2x || src.large : src.portrait || src.large2x || src.large) ?? "";
  if (!imageUrl.startsWith("http")) return null;
  return { imageUrl, source: "pexels" };
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
    if (!supabaseUrl || !anonKey) {
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
      query?: unknown;
      seed?: unknown;
      layout?: unknown;
      idempotencyKey?: unknown;
    };

    const loopId = typeof body.loopId === "string" ? body.loopId.trim() : "";
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const seedRaw = typeof body.seed === "number" ? body.seed : Number(body.seed);
    const seed = Number.isFinite(seedRaw) ? Math.floor(seedRaw) : 0;
    const layout = body.layout === "square" ? "square" : "story";
    const idempotencyRaw = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
    const usageKey =
      idempotencyRaw.length >= 8 && idempotencyRaw.length <= 120
        ? `mood-image:${user.id}:${idempotencyRaw}`
        : `mood-image:${user.id}:${loopId}:${crypto.randomUUID()}`;

    if (!loopId || query.length < 2) {
      return new Response(JSON.stringify({ error: "loopId and query required" }), {
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
        JSON.stringify({ error: "no_credits", used: check?.used, limit: check?.limit }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const pexelsKey = Deno.env.get("PEXELS_API_KEY") ?? "";
    let imageUrl = "";
    let source = "pollinations";

    if (pexelsKey) {
      const pexels = await searchPexels(query, seed, layout, pexelsKey);
      if (pexels) {
        imageUrl = pexels.imageUrl;
        source = pexels.source;
      }
    }

    if (!imageUrl) {
      imageUrl = buildPollinationsFallbackUrl(query, seed, layout);
      source = "pollinations";
    }

    const { data: usedAfter, error: bumpErr } = await authed.rpc("bump_loops_usage_idempotent", {
      p_key: usageKey,
    });
    if (bumpErr) console.warn("fetch-mood-image: bump failed", bumpErr.message);

    return new Response(
      JSON.stringify({
        imageUrl,
        source,
        query,
        layout,
        used: typeof usedAfter === "number" ? usedAfter : check.used,
        limit: check.limit,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("fetch-mood-image error:", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
