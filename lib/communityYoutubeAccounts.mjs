/**
 * Community YouTube — 5 chaînes (hors remix trend), thèmes Prism / Warm Glass.
 */
import { normalizePlayerTheme } from "./youtubePlayerThemes.mjs";

export const COMMUNITY_YOUTUBE_ACCOUNT_IDS = [
  "vibez",
  "market",
  "lowdey",
  "producerhitai",
  "beatmakerunion",
];

/** 5 Shorts + 2 long / jour / compte community */
export const COMMUNITY_SHORTS_PER_ACCOUNT_PER_DAY = 5;
export const COMMUNITY_LONGS_PER_ACCOUNT_PER_DAY = 2;

export const COMMUNITY_ACCOUNT_THEME = {
  vibez: "prism",
  market: "warm-glass",
  lowdey: "prism",
  producerhitai: "warm-glass",
  beatmakerunion: "warm-glass",
};

/** Préférence éditoriale (affichage titre / CTA) — pas le genre ACE brut. */
export const COMMUNITY_ACCOUNT_FOCUS = {
  vibez: "song",
  market: "type_beat",
  lowdey: "mixed",
  producerhitai: "song",
  beatmakerunion: "type_beat",
};

export function communityThemeForAccount(accountId) {
  const id = String(accountId ?? "").trim().toLowerCase();
  const env = (process.env.YOUTUBE_PLAYER_THEME ?? process.env.YOUTUBE_PLAYER_VARIANT ?? "").trim();
  if (env) return normalizePlayerTheme(env);
  return COMMUNITY_ACCOUNT_THEME[id] ?? "prism";
}

export function isCommunityYoutubeAccount(accountId) {
  return COMMUNITY_YOUTUBE_ACCOUNT_IDS.includes(String(accountId ?? "").trim().toLowerCase());
}
