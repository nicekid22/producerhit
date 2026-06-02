/** Rétention audio hébergé (Supabase Storage loop-audio). Rollback : VITE_LOOP_AUDIO_RETENTION_DAYS=0 masque badges. */

import { isPublicAceStreamUrl } from "@/lib/publicAcePlayback";
import { isSupabaseLoopAudioUrl } from "@/lib/storageAudio";

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

/** Audio hébergé chez nous (Storage ou flux Edge inline) — soumis à la rétention 7j. */
export function isHostedLoopAudioUrl(audioUrl: unknown): boolean {
  return isSupabaseLoopAudioUrl(audioUrl) || isPublicAceStreamUrl(audioUrl);
}

export function isLoopAudioPlayableByAge(createdAt: string | null | undefined, audioUrl: unknown): boolean {
  if (!createdAt || LOOP_AUDIO_RETENTION_DAYS <= 0) return true;
  if (!isHostedLoopAudioUrl(audioUrl)) return true;
  return getLoopAudioRetentionState(createdAt) !== "expired";
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
    ? `Tes exports audio sont hébergés ${days} jours sur nos serveurs, puis supprimés automatiquement pour libérer l’espace. Régénère une variation pour réécouter.`
    : `Your audio exports are hosted for ${days} days on our servers, then removed automatically to free space. Regenerate a variation to listen again.`;
}

export function loopAudioRetentionShortHint(locale: "fr" | "en"): string {
  const days = LOOP_AUDIO_RETENTION_DAYS;
  return locale === "fr"
    ? `Audio disponible ${days} jours — suppression automatique ensuite.`
    : `Audio available for ${days} days — then removed automatically.`;
}
