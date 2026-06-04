const DURATION_MIN_SEC = 10;
const DURATION_MAX_SEC = 120;

function parseOptionalDurationSec(raw: string | undefined): number | null {
  if (raw === "" || raw == null) return null;
  if (raw === "0" || raw.toLowerCase() === "off" || raw.toLowerCase() === "auto") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < DURATION_MIN_SEC) return null;
  return Math.min(n, DURATION_MAX_SEC);
}

/**
 * Rollback si ACE sans `duration` pose problème : VITE_ACE_SONG_AUTO_DURATION_SEC=90
 * Edge : ACE_SONG_AUTO_DURATION_SEC=90
 */
export function aceSongAutoDurationFallbackSec(): number | null {
  return parseOptionalDurationSec(import.meta.env.VITE_ACE_SONG_AUTO_DURATION_SEC as string | undefined);
}

/** Durée envoyée à ACE — null = laisser le modèle décider (mode Auto UI). */
export function computeAceRequestedDurationSec(input: {
  instrumental: boolean;
  durationRaw: number | null;
  /** Edge : lire ACE_SONG_AUTO_DURATION_SEC ; client : aceSongAutoDurationFallbackSec() */
  autoDurationFallbackSec?: number | null;
}): number | null {
  const clamp = (v: number) => Math.min(Math.max(v, DURATION_MIN_SEC), DURATION_MAX_SEC);
  if (input.durationRaw != null && input.durationRaw > 0) return clamp(input.durationRaw);
  if (!input.instrumental) {
    const fallback = input.autoDurationFallbackSec ?? aceSongAutoDurationFallbackSec();
    return fallback != null ? clamp(fallback) : null;
  }
  return null;
}

/** Estimation barre de % — plus courte si durée non imposée. */
export function estimateGenerationDurationMs(mode: "song" | "beat", durationSec?: number | null): number {
  const raw = import.meta.env.VITE_GEN_ESTIMATE_MS;
  if (raw !== "" && raw != null) {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 15_000) return Math.min(n, 180_000);
  }
  if (mode === "beat") return 72_000;
  if (typeof durationSec === "number" && durationSec > 0) {
    return Math.min(180_000, Math.max(35_000, durationSec * 900 + 20_000));
  }
  return 72_000;
}
