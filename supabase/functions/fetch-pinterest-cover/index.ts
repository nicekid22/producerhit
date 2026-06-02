import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

type PinImages = Record<string, { url?: string } | undefined>;

function pickPinImageUrl(images: PinImages | undefined): string | null {
  if (!images || typeof images !== "object") return null;
  for (const key of ["736x", "564x", "474x", "orig", "236x", "170x"]) {
    const url = images[key]?.url;
    if (typeof url === "string" && url.startsWith("http")) return url;
  }
  return null;
}

function collectPinUrls(payload: unknown, out: string[]): void {
  if (!payload || typeof payload !== "object") return;
  const obj = payload as Record<string, unknown>;

  if (obj.images && typeof obj.images === "object") {
    const url = pickPinImageUrl(obj.images as PinImages);
    if (url) out.push(url);
  }

  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) collectPinUrls(item, out);
    } else if (value && typeof value === "object") {
      collectPinUrls(value, out);
    }
  }
}

function extractPinimgFromHtml(html: string): string[] {
  const re = /https:\/\/i\.pinimg\.com\/[a-z0-9/._-]+\.(?:jpg|jpeg|png|webp)/gi;
  const found = html.match(re) ?? [];
  return [...new Set(found)];
}

async function searchViaResourceApi(query: string, limit = 24): Promise<string[]> {
  const q = query.trim().slice(0, 80) || "streetwear girl";
  const sourcePath = `/search/pins/?q=${encodeURIComponent(q)}`;
  const data = JSON.stringify({
    options: {
      query: q,
      scope: "pins",
      page_size: 25,
      bookmarks: [null],
    },
    context: {},
  });
  const url =
    `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=${encodeURIComponent(sourcePath)}&data=${encodeURIComponent(data)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "en-US,en;q=0.9",
      "X-Requested-With": "XMLHttpRequest",
      "X-Pinterest-PWS-Handler": "www/search/pins.js",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) return [];

  const json = (await res.json()) as {
    resource_response?: { data?: { results?: unknown[] } };
  };
  const results = json.resource_response?.data?.results ?? [];
  const urls: string[] = [];
  for (const row of results) {
    collectPinUrls(row, urls);
    if (urls.length >= limit) break;
  }

  return [...new Set(urls.filter((u) => u.includes("pinimg.com")))].slice(0, limit);
}

async function searchViaHtml(query: string, limit = 24): Promise<string[]> {
  const q = encodeURIComponent(query.trim() || "streetwear girl");
  const res = await fetch(`https://www.pinterest.com/search/pins/?q=${q}`, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return [];
  const html = await res.text();
  return extractPinimgFromHtml(html).slice(0, limit);
}

async function searchPinterestImageUrls(query: string, limit = 24): Promise<string[]> {
  const fromApi = await searchViaResourceApi(query, limit);
  if (fromApi.length >= 2) return fromApi;
  const fromHtml = await searchViaHtml(query, limit);
  if (fromHtml.length) return fromHtml;
  return fromApi;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => ({}))) as {
      query?: unknown;
      seed?: unknown;
      count?: unknown;
    };
    const query = typeof body.query === "string" ? body.query.trim() : "streetwear girl";
    const seedRaw = typeof body.seed === "number" ? body.seed : Number(body.seed);
    const seed = Number.isFinite(seedRaw) ? Math.floor(seedRaw) : 0;
    const countRaw = typeof body.count === "number" ? body.count : Number(body.count);
    const count = Number.isFinite(countRaw) ? Math.min(24, Math.max(1, Math.floor(countRaw))) : 1;

    const urls = await searchPinterestImageUrls(query);
    if (!urls.length) {
      return new Response(JSON.stringify({ error: "pinterest_no_results", query }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageUrls: string[] = [];
    const start = Math.abs(seed) % Math.max(1, urls.length);
    for (let i = 0; i < count && imageUrls.length < urls.length; i++) {
      const idx = (start + i * 7 + Math.floor(i / urls.length) * 11) % urls.length;
      const pick = urls[idx]!;
      if (!imageUrls.includes(pick)) imageUrls.push(pick);
    }
    if (!imageUrls.length) imageUrls.push(urls[start]!);

    return new Response(
      JSON.stringify({
        imageUrl: imageUrls[0],
        imageUrls,
        query,
        source: "pinterest",
        poolSize: urls.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("fetch-pinterest-cover:", e);
    return new Response(JSON.stringify({ error: "pinterest_search_failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
