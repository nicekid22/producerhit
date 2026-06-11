import { estimateGenerationDurationMs as estimateFromAceDuration } from "@/lib/aceDuration";

/** Durée typique attendue (pas un vrai % serveur ACE). */
export function estimateGenerationDurationMs(
  mode: "song" | "beat",
  durationSec?: number | null,
  lyricsText?: string | null,
): number {
  return estimateFromAceDuration(mode, durationSec, lyricsText);
}

/**
 * Progression simulée — ACE ne renvoie pas de % réel.
 * Phase 1 : 0→88 % sur la durée estimée. Phase 2 : lente montée 88→99 % si ça dépasse
 * (évite l’effet « bloqué à 94 % » sur la 2e version, souvent plus longue).
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

export function formatGenerationProgressLabel(
  locale: "fr" | "en",
  percent: number,
  base?: string,
): string {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  const core = locale === "fr" ? `Génération… ${p} %` : `Generating… ${p}%`;
  return base ? `${base} · ${p}%` : core;
}
