/** Fenêtre de disponibilité audio ACE (sans Storage Supabase). Rollback : VITE_LOOP_AUDIO_RETENTION_DAYS=0 pour masquer les badges. */

const envDays = Number(import.meta.env.VITE_LOOP_AUDIO_RETENTION_DAYS);
export const LOOP_AUDIO_RETENTION_DAYS =
  Number.isFinite(envDays) && envDays > 0 ? Math.floor(envDays) : 7;

export const LOOP_AUDIO_RETENTION_MS = LOOP_AUDIO_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export type LoopAudioRetentionState = "active" | "expiring" | "expired";

export function getLoopAudioRetentionState(createdAt: string, nowMs = Date.now()): LoopAudioRetentionState {
  if (LOOP_AUDIO_RETENTION_DAYS <= 0) return "active";
  const createdMs = Date.parse(createdAt);
  if (!Number.isFinite(createdMs)) return "active";
  const ageMs = nowMs - createdMs;
  if (ageMs >= LOOP_AUDIO_RETENTION_MS) return "expired";
  if (ageMs >= LOOP_AUDIO_RETENTION_MS - 2 * 24 * 60 * 60 * 1000) return "expiring";
  return "active";
}

export function getLoopAudioRetentionBadge(createdAt: string, locale: "fr" | "en"): string | null {
  const state = getLoopAudioRetentionState(createdAt);
  if (state === "expired") {
    return locale === "fr" ? "Audio expiré (7j)" : "Audio expired (7d)";
  }
  if (state === "expiring") {
    return locale === "fr" ? "Expire bientôt" : "Expiring soon";
  }
  return null;
}

export function loopAudioRetentionHint(locale: "fr" | "en"): string {
  const days = LOOP_AUDIO_RETENTION_DAYS;
  return locale === "fr"
    ? `Les générations restent écoutables ${days} jours via nos serveurs partenaires. Au-delà, régénérez une variation.`
    : `Generations stay playable for ${days} days via our partner servers. After that, regenerate a variation.`;
}
