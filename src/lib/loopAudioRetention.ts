/** Rétention audio hébergé (Supabase Storage). Plus = permanent. Rollback : VITE_LOOP_AUDIO_RETENTION_DAYS=0. */

import { hasPermanentHostedAudio, normalizePlanId } from "@/lib/planEntitlements";
import type { AppLocale } from "@/i18n/config";
import { isPublicAceStreamUrl } from "@/lib/publicAcePlayback";
import { isSupabaseLoopAudioUrl } from "@/lib/storageAudio";

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRING_WINDOW_MS = 2 * DAY_MS;
const MIN_EXPIRING_WINDOW_MS = 6 * 60 * 60 * 1000;

function expiringWindowMs(maxAgeMs: number): number {
  if (!Number.isFinite(maxAgeMs) || maxAgeMs <= 0) return EXPIRING_WINDOW_MS;
  return Math.min(EXPIRING_WINDOW_MS, Math.max(MIN_EXPIRING_WINDOW_MS, Math.floor(maxAgeMs / 2)));
}

const legacyEnvDays = Number(import.meta.env.VITE_LOOP_AUDIO_RETENTION_DAYS);

function readEnvDays(key: string, fallback: number): number {
  const raw = Number((import.meta.env as Record<string, string | undefined>)[key]);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}

export const LOOP_AUDIO_RETENTION_DAYS_FREE = readEnvDays("VITE_LOOP_AUDIO_RETENTION_DAYS_FREE", 1);
export const LOOP_AUDIO_RETENTION_DAYS_PRO = readEnvDays("VITE_LOOP_AUDIO_RETENTION_DAYS_PRO", 3);
export const LOOP_AUDIO_RETENTION_DAYS_STUDIO = readEnvDays("VITE_LOOP_AUDIO_RETENTION_DAYS_STUDIO", 7);

/** Plus haute rétention standard (Studio) — compat scripts / comparatif. */
export const LOOP_AUDIO_RETENTION_DAYS = LOOP_AUDIO_RETENTION_DAYS_STUDIO;

/** @deprecated use getLoopAudioRetentionDays(plan) */
export const LOOP_AUDIO_RETENTION_MS = LOOP_AUDIO_RETENTION_DAYS_STUDIO * DAY_MS;

export type LoopAudioRetentionContext = {
  plan?: string | null;
  /** Défini après downgrade Plus — date limite globale pour l’audio hébergé. */
  hostedAudioExpiresAt?: string | null;
};

export type LoopAudioRetentionState = "active" | "expiring" | "expired";

export function isLoopAudioRetentionDisabled(): boolean {
  return Number.isFinite(legacyEnvDays) && legacyEnvDays === 0;
}

export function getLoopAudioRetentionDays(plan?: string | null): number {
  if (Number.isFinite(legacyEnvDays) && legacyEnvDays > 0) return Math.floor(legacyEnvDays);
  const id = normalizePlanId(plan);
  if (id === "studio") return LOOP_AUDIO_RETENTION_DAYS_STUDIO;
  if (id === "pro") return LOOP_AUDIO_RETENTION_DAYS_PRO;
  return LOOP_AUDIO_RETENTION_DAYS_FREE;
}

function retentionMs(plan?: string | null): number {
  if (isLoopAudioRetentionDisabled()) return 0;
  if (hasPermanentHostedAudio(plan)) return Number.POSITIVE_INFINITY;
  return getLoopAudioRetentionDays(plan) * DAY_MS;
}

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
  if (isLoopAudioRetentionDisabled()) return "active";
  if (hasPermanentHostedAudio(ctx?.plan)) return "active";

  const downgradeDeadline = parseMs(ctx?.hostedAudioExpiresAt);
  if (downgradeDeadline !== null) {
    if (nowMs >= downgradeDeadline) return "expired";
    if (downgradeDeadline - nowMs <= EXPIRING_WINDOW_MS) return "expiring";
    return "active";
  }

  const maxAgeMs = retentionMs(ctx?.plan);
  if (!Number.isFinite(maxAgeMs)) return "active";

  const createdMs = Date.parse(createdAt);
  if (!Number.isFinite(createdMs)) return "active";
  const ageMs = nowMs - createdMs;
  if (ageMs >= maxAgeMs) return "expired";
  if (ageMs >= maxAgeMs - expiringWindowMs(maxAgeMs)) return "expiring";
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
  if (!createdAt || isLoopAudioRetentionDisabled()) return true;
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
  if (isLoopAudioRetentionDisabled()) return getLoopAudioRetentionDays(ctx?.plan);
  if (hasPermanentHostedAudio(ctx?.plan)) return getLoopAudioRetentionDays(ctx?.plan);

  const downgradeDeadline = parseMs(ctx?.hostedAudioExpiresAt);
  if (downgradeDeadline !== null) {
    const leftMs = downgradeDeadline - nowMs;
    if (leftMs <= 0) return 0;
    return Math.ceil(leftMs / DAY_MS);
  }

  const maxAgeMs = retentionMs(ctx?.plan);
  if (!Number.isFinite(maxAgeMs)) return getLoopAudioRetentionDays(ctx?.plan);

  const createdMs = Date.parse(createdAt);
  if (!Number.isFinite(createdMs)) return getLoopAudioRetentionDays(ctx?.plan);
  const leftMs = createdMs + maxAgeMs - nowMs;
  if (leftMs <= 0) return 0;
  return Math.ceil(leftMs / DAY_MS);
}

/** Libellé discret pour cartes Dashboard. */
export function getLoopAudioRetentionCardLabel(
  createdAt: string,
  locale: AppLocale,
  ctx?: LoopAudioRetentionContext,
): string | null {
  if (isLoopAudioRetentionDisabled()) return null;
  if (hasPermanentHostedAudio(ctx?.plan)) return null;

  const days = getDaysUntilAudioExpiry(createdAt, ctx);
  if (days === 0) return locale === "fr" ? "Expiré" : "Expired";
  if (locale === "fr") return days === 1 ? "Expire dans 1 jour" : `Expire dans ${days} jours`;
  return days === 1 ? "Expires in 1 day" : `Expires in ${days} days`;
}

/** Texte tarifs / aide. */
export function plusPermanentAudioBenefit(locale: AppLocale): string {
  return locale === "fr"
    ? "Audio hébergés sans expiration"
    : "Hosted audio links never expire";
}

export function hostedAudioRetentionDaysLabel(locale: AppLocale, plan?: string | null): string {
  const days = getLoopAudioRetentionDays(plan);
  if (locale === "fr") {
    return days === 1 ? "Audio hébergé 1 jour" : `Audio hébergé ${days} jours`;
  }
  return days === 1 ? "Hosted audio 1 day" : `Hosted audio ${days} days`;
}

export function standardAudioRetentionNote(locale: AppLocale, plan?: string | null): string {
  const days = getLoopAudioRetentionDays(plan);
  if (locale === "fr") {
    return days === 1 ? "Audio hébergé 1 jour" : `Audio hébergé ${days} jours`;
  }
  return days === 1 ? "Hosted audio for 1 day" : `Hosted audio for ${days} days`;
}

export function hostedAudioRetentionSummary(locale: AppLocale): string {
  const isFr = locale === "fr";
  const freeLabel = isFr
    ? LOOP_AUDIO_RETENTION_DAYS_FREE === 1
      ? "1 jour"
      : `${LOOP_AUDIO_RETENTION_DAYS_FREE} jours`
    : LOOP_AUDIO_RETENTION_DAYS_FREE === 1
      ? "1 day"
      : `${LOOP_AUDIO_RETENTION_DAYS_FREE} days`;
  const proDays = LOOP_AUDIO_RETENTION_DAYS_PRO;
  const studioDays = LOOP_AUDIO_RETENTION_DAYS_STUDIO;
  return isFr
    ? `Free : ${freeLabel}. Pro : ${proDays} jours. Studio : ${studioDays} jours. Plus : liens actifs tant que tu es abonné.`
    : `Free: ${freeLabel}. Pro: ${proDays} days. Studio: ${studioDays} days. Plus: links stay active while subscribed.`;
}
