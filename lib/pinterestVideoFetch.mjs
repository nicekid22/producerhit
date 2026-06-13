/**
 * Pinterest background video — MP4 depuis recherche pins vidéo (landscape YouTube test).
 */
import { promises as fs } from "node:fs";
import { join } from "node:path";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const POOL_SIZE = 24;
const MAX_VIDEO_BYTES = 28_000_000;

function hashString(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffledIndices(length, seed) {
  const idx = Array.from({ length }, (_, i) => i);
  let s = seed >>> 0;
  for (let i = length - 1; i > 0; i -= 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = idx[i];
    idx[i] = idx[j];
    idx[j] = tmp;
  }
  return idx;
}

function collectVideoMp4Urls(payload, out) {
  if (!payload || typeof payload !== "object") return;
  const obj = payload;

  if (obj.videos && typeof obj.videos === "object") {
    const list = obj.videos.video_list ?? obj.videos;
    if (list && typeof list === "object") {
      for (const entry of Object.values(list)) {
        if (entry && typeof entry === "object" && typeof entry.url === "string") {
          out.push(entry.url);
        }
      }
    }
  }

  if (typeof obj.url === "string" && obj.url.includes(".mp4")) {
    out.push(obj.url);
  }

  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) collectVideoMp4Urls(item, out);
    } else if (value && typeof value === "object") {
      collectVideoMp4Urls(value, out);
    }
  }
}

/** Préfère le MP4 720p complet (évite les segments expMp4 _t1/_t2). */
export function rankPinterestMp4Urls(urls) {
  const unique = [...new Set(urls.filter((u) => typeof u === "string" && u.includes(".mp4")))];
  const full720 = unique.filter((u) => u.includes("/720p/") && !/_t\d\.mp4/i.test(u));
  const pool = full720.length ? full720 : unique.filter((u) => !/_t\d\.mp4/i.test(u));
  const finalPool = pool.length ? pool : unique;
  return finalPool.sort((a, b) => scoreMp4Url(b) - scoreMp4Url(a));
}

function scoreMp4Url(url) {
  let score = 0;
  if (url.includes("/720p/")) score += 100;
  if (url.includes("v1.pinimg.com") || url.includes("v.pinimg.com")) score += 20;
  if (/_t\d\.mp4/i.test(url)) score -= 80;
  if (url.includes("expMp4")) score -= 40;
  return score;
}

async function searchViaResourceApi(query, limit = POOL_SIZE) {
  const q = query.trim().slice(0, 100) || "cinematic aesthetic video";
  const sourcePath = `/search/pins/?q=${encodeURIComponent(q)}`;
  const data = JSON.stringify({
    options: { query: q, scope: "pins", page_size: 25, bookmarks: [null], filters: "videos" },
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
    signal: AbortSignal.timeout(14_000),
  });
  if (!res.ok) return [];

  const json = await res.json();
  const results = json.resource_response?.data?.results ?? [];
  const raw = [];
  for (const row of results) {
    collectVideoMp4Urls(row, raw);
    if (raw.length >= limit * 3) break;
  }
  return rankPinterestMp4Urls(raw).slice(0, limit);
}

export async function searchPinterestVideoUrls(query) {
  return searchViaResourceApi(query, POOL_SIZE);
}

export function buildLandscapePinterestVideoQuery(loop, themeId = "prism") {
  const genre = String(loop?.genre ?? "music").trim();
  const mood = String(loop?.mood ?? "aesthetic").trim();
  const name = String(loop?.name ?? "").trim().slice(0, 40);
  const themeHint =
    themeId === "warm-glass" ? "warm golden hour cinematic" : themeId === "prism" ? "neon prism cinematic" : "cinematic mood";
  const parts = [`${genre} ${mood} aesthetic video`, themeHint, name ? `${name} vibe` : "", "night drive loop"].filter(Boolean);
  return parts.join(" ").slice(0, 100);
}

async function downloadMp4(url, outPath) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "video/mp4,video/*,*/*" },
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) return false;
  const ct = (res.headers.get("content-type") ?? "").toLowerCase();
  if (!ct.includes("video") && !ct.includes("octet-stream")) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.byteLength || buf.byteLength > MAX_VIDEO_BYTES) return false;
  if (buf.byteLength < 8000) return false;
  await fs.writeFile(outPath, buf);
  return true;
}

/**
 * Télécharge une vidéo Pinterest MP4 pour fond landscape.
 * @returns {{ path: string, sourceUrl: string, query: string }}
 */
export async function fetchPinterestBackgroundVideo({ query, seed = 0, workDir }) {
  const urls = await searchPinterestVideoUrls(query);
  if (!urls.length) throw new Error("pinterest_video_no_results");

  const order = shuffledIndices(urls.length, hashString(`${query}:${seed}`));
  const outPath = join(workDir, "pinterest-bg.mp4");

  for (const idx of order) {
    const sourceUrl = urls[idx];
    const ok = await downloadMp4(sourceUrl, outPath);
    if (ok) return { path: outPath, sourceUrl, query };
  }

  throw new Error("pinterest_video_download_failed");
}

/** Activé par défaut — COMMUNITY_LANDSCAPE_PINTEREST_VIDEO=0 pour désactiver. */
export function communityLandscapePinterestVideoEnabled() {
  const raw = String(process.env.COMMUNITY_LANDSCAPE_PINTEREST_VIDEO ?? "1").trim().toLowerCase();
  return raw !== "0" && raw !== "false" && raw !== "off";
}

/** Fond vidéo Pinterest pour long landscape — null = fallback image statique. */
export async function resolveCommunityLandscapePinterestVideo({ loop, themeId, workDir, log = null }) {
  if (!communityLandscapePinterestVideoEnabled()) return null;
  const query = buildLandscapePinterestVideoQuery(loop, themeId);
  try {
    const pin = await fetchPinterestBackgroundVideo({ query, seed: loop.id, workDir });
    if (typeof log === "function") log(`   🎞 Pinterest video bg (${query.slice(0, 48)}…)`);
    return pin.path;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (typeof log === "function") log(`   ⚠ Pinterest video bg unavailable (${msg}) — static fallback`);
    return null;
  }
}
