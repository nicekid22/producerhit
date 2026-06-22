import { estimateSongDurationFromLyrics } from "./aceDuration";

/** Durée typique attendue (pas un vrai % serveur ACE). */
export function estimateGenerationDurationMs(
  mode: "song" | "beat",
  durationSec?: number | null,
  lyricsText?: string | null,
): number {
  if (mode === "beat") return 72_000;
  const resolvedDurationSec =
    typeof durationSec === "number" && durationSec > 0
      ? durationSec
      : lyricsText?.trim()
        ? estimateSongDurationFromLyrics(lyricsText)
        : null;
  if (typeof resolvedDurationSec === "number" && resolvedDurationSec > 0) {
    return Math.min(240_000, Math.max(55_000, resolvedDurationSec * 1_100 + 50_000));
  }
  return 95_000;
}

/**
 * Progression simulée — ACE ne renvoie pas de % réel.
 * Phase 1 : 0→88 % sur la durée estimée. Phase 2 : montée lente 88→99 % si dépassement.
 */
export function simulatedGenerationPercent(elapsedMs: number, expectedMs: number): number {
  if (expectedMs <= 0) return 0;
  const elapsed = Math.max(0, elapsedMs);
  if (elapsed <= expectedMs) {
    const t = elapsed / expectedMs;
    const eased = 1 - Math.pow(1 - t, 1.65);
    return Math.min(88, Math.round(eased * 88));
  }
  const overtimeMs = elapsed - expectedMs;
  const creepHorizonMs = expectedMs * 0.9;
  const creep = 88 + 11 * (1 - Math.exp(-overtimeMs / creepHorizonMs));
  return Math.min(99, Math.round(creep));
}
