/**
 * Cadence YouTube globale — 7 comptes × (5 Shorts + 2 long) = 49 vidéos / jour UTC.
 */
import { COMMUNITY_YOUTUBE_ACCOUNT_IDS } from "./communityYoutubeAccounts.mjs";

export const REMIX_YOUTUBE_ACCOUNT_IDS = ["remix1", "remix2"];

export const ALL_YOUTUBE_ACCOUNT_IDS = [...COMMUNITY_YOUTUBE_ACCOUNT_IDS, ...REMIX_YOUTUBE_ACCOUNT_IDS];

export const SHORTS_PER_ACCOUNT_PER_DAY = 5;
export const LONGS_PER_ACCOUNT_PER_DAY = 2;
export const VIDEOS_PER_ACCOUNT_PER_DAY = SHORTS_PER_ACCOUNT_PER_DAY + LONGS_PER_ACCOUNT_PER_DAY;

export const TOTAL_DAILY_YOUTUBE_VIDEOS = ALL_YOUTUBE_ACCOUNT_IDS.length * VIDEOS_PER_ACCOUNT_PER_DAY;

/** Shorts = 45 s max (shelf Shorts). */
export function communityShortSec() {
  const raw = Number(process.env.YOUTUBE_PREVIEW_SEC ?? "45");
  return Math.max(15, Math.min(59, Number.isFinite(raw) ? Math.floor(raw) : 45));
}

export function slotKind(slotIndex) {
  return slotIndex < SHORTS_PER_ACCOUNT_PER_DAY ? "short" : "long";
}

export function slotLabel(account, slotIndex) {
  const kind = slotKind(slotIndex);
  return `${account}_${kind}_${slotIndex}`;
}

export function contentSourceForAccount(account) {
  return REMIX_YOUTUBE_ACCOUNT_IDS.includes(account) ? "trend_remix" : "community";
}

export function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
