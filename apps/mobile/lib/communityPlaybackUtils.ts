import { extractAceTaskId, isHttpAudioUrl } from "@producerhit/shared";

export type PublicPlaybackRow = {
  audio_url: string | null;
  stems_url: unknown;
};

export function parseStemsUrl(stemsUrl: unknown): Record<string, unknown> | null {
  if (!stemsUrl) return null;
  if (typeof stemsUrl === "object") return stemsUrl as Record<string, unknown>;
  if (typeof stemsUrl === "string") {
    try {
      const parsed = JSON.parse(stemsUrl) as unknown;
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function pickHttpAudioUrl(audioUrl: unknown, stemsUrl: unknown): string | null {
  const direct = typeof audioUrl === "string" ? audioUrl.trim() : "";
  if (isHttpAudioUrl(direct) && !direct.startsWith("blob:")) return direct;

  const stems = parseStemsUrl(stemsUrl);
  const ace = stems?.ace && typeof stems.ace === "object" ? (stems.ace as Record<string, unknown>) : null;
  const fromAce = typeof ace?.httpAudioUrl === "string" ? ace.httpAudioUrl.trim() : "";
  if (isHttpAudioUrl(fromAce)) return fromAce;
  return null;
}

export function isPlayableCommunityRow(row: PublicPlaybackRow): boolean {
  if (pickHttpAudioUrl(row.audio_url, row.stems_url)) return true;
  return extractAceTaskId(row.stems_url).length > 0;
}
