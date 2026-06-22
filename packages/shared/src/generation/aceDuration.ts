const DURATION_MIN_SEC = 10;
const DURATION_MAX_SEC = 120;

/** Durée envoyée à ACE — null = laisser le modèle décider (instrumental type beat). */
export function computeAceRequestedDurationSec(input: {
  instrumental: boolean;
  durationRaw: number | null;
  autoDurationFallbackSec?: number | null;
}): number | null {
  const clamp = (v: number) => Math.min(Math.max(v, DURATION_MIN_SEC), DURATION_MAX_SEC);
  if (input.durationRaw != null && input.durationRaw > 0) return clamp(input.durationRaw);
  if (!input.instrumental) {
    const fallback = input.autoDurationFallbackSec ?? null;
    return fallback != null ? clamp(fallback) : null;
  }
  return null;
}

/** Durée ACE (s) estimée à partir des paroles manuelles — aligné web aceDuration.ts */
export function estimateSongDurationFromLyrics(lyrics: string): number {
  const text = lyrics.trim();
  if (!text) return 60;
  const words = text.split(/\s+/).filter(Boolean).length;
  const lines = text.split(/\n/).filter((l) => l.trim().length > 0).length;
  const fromWords = words * 2.4;
  const fromLines = lines * 3.5;
  return Math.min(240, Math.max(45, Math.round(Math.max(fromWords, fromLines) + 15)));
}
