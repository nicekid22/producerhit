/** Rétention audio hébergé (Supabase Storage). Plus = permanent. Rollback : VITE_LOOP_AUDIO_RETENTION_DAYS=0. */

import { hasPermanentHostedAudio } from "@/lib/planEntitlements";
import { isPublicAceStreamUrl } from "@/lib/publicAcePlayback";
import { isSupabaseLoopAudioUrl } from "@/lib/storageAudio";

const envDays = Number(import.meta.env.VITE_LOOP_AUDIO_RETENTION_DAYS);
export const LOOP_AUDIO_RETENTION_DAYS =
  Number.isFinite(envDays) && envDays > 0 ? Math.floor(envDays) : 7;

export const LOOP_AUDIO_RETENTION_MS = LOOP_AUDIO_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export type LoopAudioRetentionContext = {
  plan?: string | null;
  /** Défini après downgrade Plus — date limite globale pour l’audio hébergé. */
  hostedAudioExpiresAt?: string | null;
};

export type LoopAudioRetentionState = "active" | "expiring" | "expired";

function parseMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

export function getLoopAudioRetentionState(
  createdAt: string,
  ctx?: LoopAudioRetentionContext,
  nowMs = Date.now(),
): LoopAudioRetentionState {
  if (LOOP_AUDIO_RETENTION_DAYS <= 0) return "active";
  if (hasPermanentHostedAudio(ctx?.plan)) return "active";

  const downgradeDeadline = parseMs(ctx?.hostedAudioExpiresAt);
  if (downgradeDeadline !== null) {
    if (nowMs >= downgradeDeadline) return "expired";
    if (downgradeDeadline - nowMs <= 2 * 24 * 60 * 60 * 1000) return "expiring";
    return "active";
  }

  const createdMs = Date.parse(createdAt);
  if (!Number.isFinite(createdMs)) return "active";
  const ageMs = nowMs - createdMs;
  if (ageMs >= LOOP_AUDIO_RETENTION_MS) return "expired";
  if (ageMs >= LOOP_AUDIO_RETENTION_MS - 2 * 24 * 60 * 60 * 1000) return "expiring";
  return "active";
}

export function isHostedLoopAudioUrl(audioUrl: unknown): boolean {
  return isSupabaseLoopAudioUrl(audioUrl) || isPublicAceStreamUrl(audioUrl);
}

export function isLoopAudioPlayableByAge(
  createdAt: string | null | undefined,
  audioUrl: unknown,
  ctx?: LoopAudioRetentionContext,
): boolean {
  if (!createdAt || LOOP_AUDIO_RETENTION_DAYS <= 0) return true;
  if (!isHostedLoopAudioUrl(audioUrl)) return true;
  if (hasPermanentHostedAudio(ctx?.plan)) return true;
  return getLoopAudioRetentionState(createdAt, ctx) !== "expired";
}

/** Jours restants avant suppression (0 = expiré). */
export function getDaysUntilAudioExpiry(
  createdAt: string,
  ctx?: LoopAudioRetentionContext,
  nowMs = Date.now(),
): number {
  if (LOOP_AUDIO_RETENTION_DAYS <= 0) return LOOP_AUDIO_RETENTION_DAYS;
  if (hasPermanentHostedAudio(ctx?.plan)) return LOOP_AUDIO_RETENTION_DAYS;

  const downgradeDeadline = parseMs(ctx?.hostedAudioExpiresAt);
  if (downgradeDeadline !== null) {
    const leftMs = downgradeDeadline - nowMs;
    if (leftMs <= 0) return 0;
    return Math.ceil(leftMs / (24 * 60 * 60 * 1000));
  }

  const createdMs = Date.parse(createdAt);
  if (!Number.isFinite(createdMs)) return LOOP_AUDIO_RETENTION_DAYS;
  const leftMs = createdMs + LOOP_AUDIO_RETENTION_MS - nowMs;
  if (leftMs <= 0) return 0;
  return Math.ceil(leftMs / (24 * 60 * 60 * 1000));
}

/** Libellé discret pour cartes Dashboard. */
export function getLoopAudioRetentionCardLabel(
  createdAt: string,
  locale: "fr" | "en",
  ctx?: LoopAudioRetentionContext,
): string | null {
  if (LOOP_AUDIO_RETENTION_DAYS <= 0) return null;
  if (hasPermanentHostedAudio(ctx?.plan)) return null;

  const days = getDaysUntilAudioExpiry(createdAt, ctx);
  if (days === 0) return locale === "fr" ? "Expiré" : "Expired";
  if (locale === "fr") return days === 1 ? "Expire dans 1 jour" : `Expire dans ${days} jours`;
  return days === 1 ? "Expires in 1 day" : `Expires in ${days} days`;
}

/** Texte tarifs / aide. */
export function plusPermanentAudioBenefit(locale: "fr" | "en"): string {
  return locale === "fr"
    ? "Audio hébergés sans expiration"
    : "Hosted audio links never expire";
}

export function standardAudioRetentionNote(locale: "fr" | "en"): string {
  const days = LOOP_AUDIO_RETENTION_DAYS;
  return locale === "fr"
    ? `Audio hébergé ${days} jours`
    : `Hosted audio for ${days} days`;
}
