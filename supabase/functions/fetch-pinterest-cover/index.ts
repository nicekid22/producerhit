import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  loadGlobalUsedUrlHashes,
  PINTEREST_DEDUP_RETENTION_DAYS,
} from "../_shared/pinterestDedup.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const POOL_SIZE = 24;
const RETENTION_DAYS = PINTEREST_DEDUP_RETENTION_DAYS;

type PinImages = Record<string, { url?: string } | undefined>;

function normalizePinimgUrl(url: string): string {
  const t = url.trim();
  try {
    const u = new URL(t);
    if (!u.hostname.includes("pinimg.com")) return t;
    const path = u.pathname.replace(/\/\d+x\//i, "/");
    return `${u.protocol}//${u.hostname}${path}`;
  } catch {
    return t;
  }
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function shuffledIndices(length: number, seed: number): number[] {
  const idx = Array.from({ length }, (_, i) => i);
  let s = seed >>> 0;
  for (let i = length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = idx[i]!;
    idx[i] = idx[j]!;
    idx[j] = tmp;
  }
  return idx;
}

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

async function searchViaResourceApi(query: string, limit = POOL_SIZE): Promise<string[]> {
  const q = query.trim().slice(0, 100) || "streetwear aesthetic";
  const sourcePath = `/search/pins/?q=${encodeURIComponent(q)}`;
  const data = JSON.stringify({
    options: { query: q, scope: "pins", page_size: 25, bookmarks: [null] },
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
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) return [];

  const json = (await res.json()) as { resource_response?: { data?: { results?: unknown[] } } };
  const results = json.resource_response?.data?.results ?? [];
  const urls: string[] = [];
  for (const row of results) {
    collectPinUrls(row, urls);
    if (urls.length >= limit) break;
  }

  return [...new Set(urls.filter((u) => u.includes("pinimg.com")))].slice(0, limit);
}

async function searchViaHtml(query: string, limit = POOL_SIZE): Promise<string[]> {
  const q = encodeURIComponent(query.trim() || "streetwear aesthetic");
  const res = await fetch(`https://www.pinterest.com/search/pins/?q=${q}`, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) return [];
  return extractPinimgFromHtml(await res.text()).slice(0, limit);
}

async function searchPinterestImageUrls(query: string): Promise<string[]> {
  const fromApi = await searchViaResourceApi(query, POOL_SIZE);
  if (fromApi.length >= 2) return fromApi;
  const fromHtml = await searchViaHtml(query, POOL_SIZE);
  return fromHtml.length ? fromHtml : fromApi;
}

async function pickUnusedUrl(
  pool: string[],
  usedHashes: Set<string>,
  seedKey: string,
): Promise<{ url: string; hash: string } | null> {
  const order = shuffledIndices(pool.length, hashString(seedKey));
  for (const idx of order) {
    const candidate = pool[idx]!;
    const h = await sha256Hex(normalizePinimgUrl(candidate));
    if (usedHashes.has(h)) continue;
    return { url: candidate, hash: h };
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => ({}))) as {
      query?: unknown;
      seed?: unknown;
      count?: unknown;
      loopId?: unknown;
    };
    const query = typeof body.query === "string" ? body.query.trim() : "streetwear girl";
    const seedRaw = typeof body.seed === "number" ? body.seed : Number(body.seed);
    const seed = Number.isFinite(seedRaw) ? Math.floor(seedRaw) : 0;
    const countRaw = typeof body.count === "number" ? body.count : Number(body.count);
    const count = Number.isFinite(countRaw) ? Math.min(24, Math.max(1, Math.floor(countRaw))) : 1;
    const loopId = typeof body.loopId === "string" ? body.loopId.trim() : "";

    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "").trim() : "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    let userId: string | null = null;
    let admin: ReturnType<typeof createClient> | null = null;

    if (token && supabaseUrl && anonKey && serviceKey) {
      const authed = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
      const {
        data: { user },
      } = await authed.auth.getUser(token);
      if (user) {
        userId = user.id;
        admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
      }
    }

    const urls = await searchPinterestImageUrls(query);
    if (!urls.length) {
      return new Response(JSON.stringify({ error: "pinterest_no_results", query }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const usedHashes = admin ? await loadGlobalUsedUrlHashes(admin, RETENTION_DAYS) : new Set<string>();
    const imageUrls: string[] = [];
    const pickedHashes: string[] = [];

    for (let i = 0; i < count; i++) {
      const pick = await pickUnusedUrl(urls, usedHashes, `${loopId || query}:${seed}:${i}`);
      if (!pick) break;
      imageUrls.push(pick.url);
      pickedHashes.push(pick.hash);
      usedHashes.add(pick.hash);
    }

    if (!imageUrls.length) {
      return new Response(JSON.stringify({ error: "pinterest_all_used", query, poolSize: urls.length }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (userId && admin && loopId) {
      for (let i = 0; i < imageUrls.length; i++) {
        await admin.from("used_pinterest_covers").upsert(
          {
            user_id: userId,
            url_hash: pickedHashes[i]!,
            source_url: imageUrls[i]!,
            loop_id: loopId,
          },
          { onConflict: "user_id,url_hash" },
        );
      }
      void admin.rpc("prune_used_pinterest_covers", { p_retention_days: RETENTION_DAYS });
    }

    return new Response(
      JSON.stringify({
        imageUrl: imageUrls[0],
        imageUrls,
        query,
        source: "pinterest",
        poolSize: urls.length,
        dedup: Boolean(userId),
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
