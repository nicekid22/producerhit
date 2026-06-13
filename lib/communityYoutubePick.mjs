/**
 * Sélection loops community publiques (lyrics, hors viral / trend remix).
 */
import { createClient } from "@supabase/supabase-js";
import { extractTrendRemixMeta, extractViralMeta, inferTrackKind } from "./youtubeSocial.mjs";
import {
  COMMUNITY_ACCOUNT_FOCUS,
  COMMUNITY_SHORTS_PER_ACCOUNT_PER_DAY,
  COMMUNITY_YOUTUBE_ACCOUNT_IDS,
} from "./communityYoutubeAccounts.mjs";
import { inventTitleFromLyrics, loopHasUsableLyrics, extractAceLyrics } from "./communityYoutubeTitle.mjs";
import { pickCommunityCta } from "./communityYoutubeCta.mjs";

function hashId(id) {
  let h = 2166136261;
  const s = String(id ?? "x");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const BEAT_GENRE_RE =
  /\b(trap|drill|hip hop|hip-hop|boom bap|phonk|grime|jersey|detroit|cloud rap|hardcore rap|hyphy|plugg|pluggnb)\b/i;

export function isEligibleCommunityLoop(loop) {
  if (!loop?.id || !loop?.audio_url || loop.is_public !== true) return false;
  if (!loopHasUsableLyrics(loop.stems_url)) return false;
  if (extractTrendRemixMeta(loop.stems_url)) return false;
  if (extractViralMeta(loop.stems_url)) return false;
  return true;
}

/** Affichage song vs type beat (community = surtout des chansons en DB). */
export function communityDisplayKind(loop, account, slot = 0) {
  const base = inferTrackKind(loop.stems_url, loop.name ?? "");
  const focus = COMMUNITY_ACCOUNT_FOCUS[String(account ?? "").toLowerCase()] ?? "song";
  const genre = String(loop.genre ?? loop.name ?? "");

  if (focus === "type_beat") {
    if (base === "type_beat" || base === "instrumental") return base;
    if (BEAT_GENRE_RE.test(genre)) return "type_beat";
    return hashId(`${loop.id}:${account}:${slot}`) % 3 !== 0 ? "type_beat" : "song";
  }
  if (focus === "mixed") {
    return hashId(`${loop.id}:${account}:${slot}`) % 2 === 0 ? "type_beat" : "song";
  }
  return base === "instrumental" ? "instrumental" : "song";
}

function scoreLoop(loop, account, slot, excludeIds) {
  if (excludeIds.has(loop.id)) return -1;
  if (!isEligibleCommunityLoop(loop)) return -1;
  const kind = communityDisplayKind(loop, account, slot);
  const focus = COMMUNITY_ACCOUNT_FOCUS[account] ?? "song";
  let score = hashId(`${loop.id}:${account}`) % 1000;
  if (focus === "type_beat" && kind === "type_beat") score += 500;
  if (focus === "song" && kind === "song") score += 500;
  if (focus === "mixed") score += 200;
  return score;
}

export function pickCommunityLoop(candidates, { account, slot = 0, excludeIds = new Set() } = {}) {
  const ranked = (candidates ?? [])
    .map((loop) => ({ loop, score: scoreLoop(loop, account, slot, excludeIds) }))
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.loop ?? null;
}

export function buildCommunityPreviewPlan(candidates, { accounts = COMMUNITY_YOUTUBE_ACCOUNT_IDS, perAccount = COMMUNITY_SHORTS_PER_ACCOUNT_PER_DAY } = {}) {
  const used = new Set();
  const plan = [];

  for (const account of accounts) {
    for (let slot = 0; slot < perAccount; slot += 1) {
      const loop = pickCommunityLoop(candidates, { account, slot, excludeIds: used });
      if (!loop) break;
      used.add(loop.id);
      const kind = communityDisplayKind(loop, account, slot);
      const lyrics = extractAceLyrics(loop.stems_url);
      const displayTitle = inventTitleFromLyrics(lyrics, {
        loopId: loop.id,
        genre: loop.genre,
        fallbackName: loop.name,
      });
      const cta = pickCommunityCta({ loopId: loop.id, account, kind, slot });
      plan.push({
        account,
        slot,
        loop,
        kind,
        displayTitle,
        cta,
        theme: null,
      });
    }
  }
  return plan;
}

export async function fetchCommunityLoopCandidates(db, { limit = 250 } = {}) {
  const client =
    db ??
    createClient(
      (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim(),
      { auth: { persistSession: false } },
    );

  const { data, error } = await client
    .from("loops")
    .select("id,name,genre,audio_url,cover_url,is_public,stems_url,user_id,created_at,bpm,key")
    .eq("is_public", true)
    .not("audio_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).filter(isEligibleCommunityLoop);
}

export async function buildCommunityPreviewPlanFromDb(db, opts = {}) {
  const candidates = await fetchCommunityLoopCandidates(db, opts);
  const plan = buildCommunityPreviewPlan(candidates, opts);
  const { communityThemeForAccount } = await import("./communityYoutubeAccounts.mjs");
  for (const row of plan) {
    row.theme = communityThemeForAccount(row.account);
  }
  return plan;
}
