/**
 * Chaîne YouTube préférée par série virale — différenciation marketing.
 * Chaque format a sa "maison" pour que l'algo reconnaisse la série.
 */

export const SERIES_YOUTUBE_CHANNEL = {
  comment_to_song: "producerhitai",
  absurd_to_song: "beatmakerunion",
  guess_prompt: "lowdey",
};

/** Fallback si la chaîne cible n'est pas OAuth-ready — jamais vibez/market (réservées communauté). */
export const SERIES_CHANNEL_FALLBACK = {
  comment_to_song: ["producerhitai", "beatmakerunion", "lowdey"],
  absurd_to_song: ["beatmakerunion", "lowdey", "producerhitai"],
  guess_prompt: ["lowdey", "producerhitai", "beatmakerunion"],
};

/** Chaînes « musique communautaire » — loops publiques user, pas séries virales. */
export const COMMUNITY_YOUTUBE_CHANNELS = ["vibez", "market"];

/** Routage community : vibes/songs → vibez, beats → market. */
export function preferredCommunityYouTubeAccount(trackKind) {
  if (trackKind === "type_beat" || trackKind === "instrumental") return "market";
  return "vibez";
}

export function resolveYouTubePreferredAccount({ viralMeta, trackKind }) {
  if (viralMeta?.preferredAccount) return viralMeta.preferredAccount;
  if (viralMeta?.series) return preferredYouTubeAccountForSeries(viralMeta.series);
  return preferredCommunityYouTubeAccount(trackKind);
}

export const CHANNEL_BRAND = {
  vibez: { label: "Producer Vibez", vibe: "mood / vibes" },
  market: { label: "Producer Market", vibe: "beats & type beats" },
  lowdey: { label: "Lowdey", vibe: "guess the prompt / mystery" },
  producerhitai: { label: "ProducerHit AI", vibe: "comment → song / social" },
  beatmakerunion: { label: "Beatmaker Union", vibe: "absurd → banger" },
};

export function preferredYouTubeAccountForSeries(seriesId) {
  return SERIES_YOUTUBE_CHANNEL[seriesId] ?? "vibez";
}

export function fallbackYouTubeAccountsForSeries(seriesId) {
  return SERIES_CHANNEL_FALLBACK[seriesId] ?? ["vibez", "market", "lowdey"];
}
