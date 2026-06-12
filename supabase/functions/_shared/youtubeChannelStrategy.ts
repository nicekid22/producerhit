/**
 * YouTube multi-channel routing — viral series vs community music promo.
 */

export type YouTubeChannelId = "vibez" | "market" | "lowdey" | "producerhitai" | "beatmakerunion";

export const SERIES_YOUTUBE_CHANNEL: Record<string, YouTubeChannelId> = {
  comment_to_song: "producerhitai",
  absurd_to_song: "beatmakerunion",
  guess_prompt: "lowdey",
};

export const COMMUNITY_YOUTUBE_CHANNELS: YouTubeChannelId[] = ["vibez", "market"];

export function preferredYouTubeAccountForSeries(seriesId: string): YouTubeChannelId {
  return SERIES_YOUTUBE_CHANNEL[seriesId] ?? "producerhitai";
}

export function preferredCommunityYouTubeAccount(trackKind: string): YouTubeChannelId {
  if (trackKind === "type_beat" || trackKind === "instrumental") return "market";
  return "vibez";
}

export function resolveYouTubePreferredAccount(input: {
  viralMeta?: { series?: string; preferredAccount?: string } | null;
  trackKind: string;
}): string {
  if (input.viralMeta?.preferredAccount?.trim()) return input.viralMeta.preferredAccount.trim().toLowerCase();
  if (input.viralMeta?.series) return preferredYouTubeAccountForSeries(input.viralMeta.series);
  return preferredCommunityYouTubeAccount(input.trackKind);
}
