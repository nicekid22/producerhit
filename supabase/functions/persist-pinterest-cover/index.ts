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

const BUCKET = "loop-covers";
const POOL_SIZE = 24;
const MAX_IMAGE_BYTES = 1_500_000;
const RETENTION_DAYS = PINTEREST_DEDUP_RETENTION_DAYS;

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

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

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

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Mélange déterministe du pool — pas « toujours la 1ère » du JSON Pinterest. */
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

function parseStemsUrl(stemsUrl: unknown): Record<string, unknown> | null {
  if (!stemsUrl || typeof stemsUrl !== "object") return null;
  return stemsUrl as Record<string, unknown>;
}

function mergeCoverIntoStems(stemsUrl: unknown, coverUrl: string): Record<string, unknown> | null {
  const trimmed = coverUrl.trim();
  if (!trimmed.startsWith("http")) return null;
  const base = parseStemsUrl(stemsUrl) ?? {};
  const existingAce =
    base.ace && typeof base.ace === "object" && base.ace !== null ? (base.ace as Record<string, unknown>) : {};
  return {
    ...base,
    ace: {
      ...existingAce,
      coverUrl: trimmed,
      coverKind: "image",
      coverSource: "pinterest",
    },
  };
}

function coverStoragePaths(userId: string, loopId: string): string[] {
  return ["jpg", "jpeg", "webp", "png", "mp4"].map((ext) => `${userId}/covers/${loopId}.${ext}`);
}

function contentTypeForBytes(bytes: Uint8Array, fallback: string): string {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes[0] === 0x52 && bytes[1] === 0x49) return "image/webp";
  return fallback;
}

function extForContentType(ct: string): string {
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  return "jpg";
}

type AdminClient = ReturnType<typeof createClient>;

async function downloadPinimgBytes(sourceUrl: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const imgRes = await fetch(sourceUrl, {
    headers: { "User-Agent": UA, Accept: "image/*" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!imgRes.ok) return null;
  const bytes = new Uint8Array(await imgRes.arrayBuffer());
  if (!bytes.byteLength || bytes.byteLength > MAX_IMAGE_BYTES) return null;
  const contentType = contentTypeForBytes(bytes, imgRes.headers.get("content-type") ?? "image/jpeg");
  return { bytes, contentType };
}

async function uploadCoverAndUpdateLoop(
  admin: AdminClient,
  userId: string,
  loopId: string,
  stemsUrl: unknown,
  bytes: Uint8Array,
  contentType: string,
  sourceUrl: string,
  sourceHash: string,
  options?: { fileVariant?: string; shortCache?: boolean },
): Promise<{ coverUrl: string } | { error: string; status: number }> {
  const ext = extForContentType(contentType);
  const variant =
    typeof options?.fileVariant === "string" && options.fileVariant.trim()
      ? options.fileVariant.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24)
      : "";
  const storagePath = variant
    ? `${userId}/covers/${loopId}-${variant}.${ext}`
    : `${userId}/covers/${loopId}.${ext}`;

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, bytes, {
    contentType,
    upsert: true,
    cacheControl: options?.shortCache ? "300" : "604800",
  });

  if (uploadError) {
    console.warn("persist-pinterest-cover upload:", uploadError.message);
    return { error: "storage_upload_failed", status: 500 };
  }

  const { data: publicUrl } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
  const coverUrl = publicUrl?.publicUrl?.trim();
  if (!coverUrl) return { error: "public_url_failed", status: 500 };

  const nextStems = mergeCoverIntoStems(stemsUrl, coverUrl);
  if (!nextStems) return { error: "stems_merge_failed", status: 500 };

  const { error: updateErr } = await admin
    .from("loops")
    .update({ stems_url: nextStems, cover_url: coverUrl })
    .eq("id", loopId)
    .eq("user_id", userId);

  if (updateErr) return { error: updateErr.message, status: 500 };

  await admin.from("used_pinterest_covers").upsert(
    {
      user_id: userId,
      url_hash: sourceHash,
      source_url: sourceUrl,
      loop_id: loopId,
    },
    { onConflict: "user_id,url_hash" },
  );

  void admin.rpc("prune_used_pinterest_covers", { p_retention_days: RETENTION_DAYS });

  return { coverUrl };
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
      query?: unknown;
      seed?: unknown;
      forceRefresh?: unknown;
      idempotencyKey?: unknown;
    };

    const loopId = typeof body.loopId === "string" ? body.loopId.trim() : "";
    const query = typeof body.query === "string" ? body.query.trim().slice(0, 100) : "";
    const seedRaw = typeof body.seed === "number" ? body.seed : Number(body.seed);
    const seed = Number.isFinite(seedRaw) ? Math.floor(seedRaw) : 0;
    const forceRefresh = body.forceRefresh === true;
    const idempotencyRaw = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
    const usageKey =
      idempotencyRaw.length >= 8 && idempotencyRaw.length <= 120
        ? `cover-reroll:${user.id}:${idempotencyRaw}`
        : "";

    if (forceRefresh && !usageKey) {
      return new Response(JSON.stringify({ error: "idempotency_key_required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (forceRefresh) {
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
    }

    if (!loopId || !query) {
      return new Response(JSON.stringify({ error: "loopId and query required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data: loopRow, error: loopErr } = await admin
      .from("loops")
      .select("id, stems_url, cover_url")
      .eq("id", loopId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (loopErr || !loopRow) {
      return new Response(JSON.stringify({ error: "loop_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stems = parseStemsUrl(loopRow.stems_url);
    const ace = stems?.ace && typeof stems.ace === "object" ? (stems.ace as Record<string, unknown>) : null;
    const colCover = typeof (loopRow as { cover_url?: string }).cover_url === "string"
      ? (loopRow as { cover_url: string }).cover_url.trim()
      : "";
    const aceCover = typeof ace?.coverUrl === "string" ? ace.coverUrl.trim() : "";
    const existingCover = colCover.startsWith("http") ? colCover : aceCover;
    if (
      !forceRefresh &&
      (existingCover.includes("/loop-covers/") ||
        (existingCover.includes("supabase.co/storage") && existingCover.includes("loop-covers")))
    ) {
      return new Response(
        JSON.stringify({
          coverUrl: existingCover,
          coverKind: "image",
          skipped: true,
          reason: "already_persisted",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!forceRefresh && existingCover.includes("pinimg.com")) {
      const sourceUrl = existingCover;
      const sourceHash = await sha256Hex(normalizePinimgUrl(sourceUrl));
      const downloaded = await downloadPinimgBytes(sourceUrl);
      if (!downloaded) {
        return new Response(JSON.stringify({ error: "pinterest_download_failed" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const upgraded = await uploadCoverAndUpdateLoop(
        admin,
        user.id,
        loopId,
        loopRow.stems_url,
        downloaded.bytes,
        downloaded.contentType,
        sourceUrl,
        sourceHash,
      );
      if ("error" in upgraded) {
        return new Response(JSON.stringify({ error: upgraded.error }), {
          status: upgraded.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({
          coverUrl: upgraded.coverUrl,
          coverKind: "image",
          upgradedFrom: "pinimg",
          source: "pinterest",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const usedHashes = await loadGlobalUsedUrlHashes(admin, RETENTION_DAYS);

    if (forceRefresh) {
      if (existingCover.includes("pinimg.com")) {
        usedHashes.add(await sha256Hex(normalizePinimgUrl(existingCover)));
      }
      const { data: loopUsed } = await admin
        .from("used_pinterest_covers")
        .select("url_hash")
        .eq("loop_id", loopId)
        .eq("user_id", user.id);
      for (const row of loopUsed ?? []) {
        const h = typeof row.url_hash === "string" ? row.url_hash.trim() : "";
        if (h) usedHashes.add(h);
      }
    }

    const pool = await searchPinterestImageUrls(query);
    if (!pool.length) {
      return new Response(JSON.stringify({ error: "pinterest_no_results", query }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const shuffleSeed = forceRefresh
      ? hashString(`${loopId}:${query}:${seed}:${idempotencyRaw}`)
      : hashString(`${loopId}:${query}:${seed}`);
    const order = shuffledIndices(pool.length, shuffleSeed);
    let sourceUrl: string | null = null;
    let sourceHash: string | null = null;
    let pickIndex = 0;

    for (const idx of order) {
      const candidate = pool[idx]!;
      const h = await sha256Hex(normalizePinimgUrl(candidate));
      if (usedHashes.has(h)) continue;
      sourceUrl = candidate;
      sourceHash = h;
      pickIndex = idx;
      break;
    }

    if (!sourceUrl || !sourceHash) {
      return new Response(JSON.stringify({ error: "pinterest_all_used", query, poolSize: pool.length }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const downloaded = await downloadPinimgBytes(sourceUrl);
    if (!downloaded) {
      return new Response(JSON.stringify({ error: "pinterest_download_failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileVariant = forceRefresh ? sourceHash.slice(0, 16) : undefined;
    const saved = await uploadCoverAndUpdateLoop(
      admin,
      user.id,
      loopId,
      loopRow.stems_url,
      downloaded.bytes,
      downloaded.contentType,
      sourceUrl,
      sourceHash,
      forceRefresh ? { fileVariant, shortCache: true } : undefined,
    );

    if ("error" in saved) {
      return new Response(JSON.stringify({ error: saved.error }), {
        status: saved.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const coverUrl = saved.coverUrl;

    if (forceRefresh && usageKey) {
      const { error: bumpErr } = await authed.rpc("bump_loops_usage_idempotent", { p_key: usageKey });
      if (bumpErr) console.warn("persist-pinterest-cover: bump failed", bumpErr.message);
    }

    return new Response(
      JSON.stringify({
        coverUrl,
        coverKind: "image",
        query,
        poolSize: pool.length,
        pickIndex: pickIndex >= 0 ? pickIndex : 0,
        source: "pinterest",
        refreshed: forceRefresh,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("persist-pinterest-cover:", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
