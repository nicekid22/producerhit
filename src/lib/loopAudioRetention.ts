/** Rétention audio hébergé (Supabase Storage). Plus = permanent. Rollback : VITE_LOOP_AUDIO_RETENTION_DAYS=0. */

import { hasPermanentHostedAudio, normalizePlanId } from "@/lib/planEntitlements";
import type { AppLocale } from "@/i18n/config";
import { L, pickL } from "@/i18n/localized";
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
const RETENTION_LABELS = {
  expired: L({
    en: "Expired",
    fr: "Expiré",
    es: "Caducado",
    pt: "Expirado",
    de: "Abgelaufen",
    it: "Scaduto",
    nl: "Verlopen",
    ar: "منتهٍ",
    ja: "期限切れ",
    ko: "만료됨",
    tr: "Süresi doldu",
    hi: "समाप्त",
    zh: "已过期",
    th: "หมดอายุ",
  }),
  expiresInOne: L({
    en: "Expires in 1 day",
    fr: "Expire dans 1 jour",
    es: "Caduca en 1 día",
    pt: "Expira em 1 dia",
    de: "Läuft in 1 Tag ab",
    it: "Scade tra 1 giorno",
    nl: "Verloopt over 1 dag",
    ar: "ينتهي خلال يوم",
    ja: "あと1日で期限切れ",
    ko: "1일 후 만료",
    tr: "1 gün içinde sona erer",
    hi: "1 दिन में समाप्त",
    zh: "1 天后过期",
    th: "หมดอายุใน 1 วัน",
  }),
  expiresInN: L({
    en: "Expires in {{n}} days",
    fr: "Expire dans {{n}} jours",
    es: "Caduca en {{n}} días",
    pt: "Expira em {{n}} dias",
    de: "Läuft in {{n}} Tagen ab",
    it: "Scade tra {{n}} giorni",
    nl: "Verloopt over {{n}} dagen",
    ar: "ينتهي خلال {{n}} أيام",
    ja: "あと{{n}}日で期限切れ",
    ko: "{{n}}일 후 만료",
    tr: "{{n}} gün içinde sona erer",
    hi: "{{n}} दिनों में समाप्त",
    zh: "{{n}} 天后过期",
    th: "หมดอายุใน {{n}} วัน",
  }),
  plusPermanent: L({
    en: "Hosted audio links never expire",
    fr: "Audio hébergés sans expiration",
    es: "Audio alojado sin caducidad",
    pt: "Áudio hospedado sem expiração",
    de: "Gehostetes Audio läuft nie ab",
    it: "Audio ospitato senza scadenza",
    nl: "Gehoste audio verloopt nooit",
    ar: "روابط الصوت المستضافة لا تنتهي",
    ja: "ホスト音声リンクは期限なし",
    ko: "호스팅 오디오 링크 만료 없음",
    tr: "Barındırılan ses linkleri süresiz",
    hi: "होस्टेड ऑडियो लिंक कभी समाप्त नहीं",
    zh: "托管音频链接永不过期",
    th: "ลิงก์เสียงโฮสต์ไม่หมดอายุ",
  }),
  hostedOne: L({
    en: "Hosted audio 1 day",
    fr: "Audio hébergé 1 jour",
    es: "Audio alojado 1 día",
    pt: "Áudio hospedado 1 dia",
    de: "Gehostetes Audio 1 Tag",
    it: "Audio ospitato 1 giorno",
    nl: "Gehoste audio 1 dag",
    ar: "صوت مستضاف يوم واحد",
    ja: "ホスト音声1日",
    ko: "호스팅 오디오 1일",
    tr: "1 günlük barındırılan ses",
    hi: "1 दिन होस्टेड ऑडियो",
    zh: "托管音频 1 天",
    th: "เสียงโฮสต์ 1 วัน",
  }),
  hostedN: L({
    en: "Hosted audio {{n}} days",
    fr: "Audio hébergé {{n}} jours",
    es: "Audio alojado {{n}} días",
    pt: "Áudio hospedado {{n}} dias",
    de: "Gehostetes Audio {{n}} Tage",
    it: "Audio ospitato {{n}} giorni",
    nl: "Gehoste audio {{n}} dagen",
    ar: "صوت مستضاف {{n}} أيام",
    ja: "ホスト音声{{n}}日",
    ko: "호스팅 오디오 {{n}}일",
    tr: "{{n}} günlük barındırılan ses",
    hi: "{{n}} दिन होस्टेड ऑडियो",
    zh: "托管音频 {{n}} 天",
    th: "เสียงโฮสต์ {{n}} วัน",
  }),
  hostedForOne: L({
    en: "Hosted audio for 1 day",
    fr: "Audio hébergé 1 jour",
    es: "Audio alojado durante 1 día",
    pt: "Áudio hospedado por 1 dia",
    de: "Gehostetes Audio für 1 Tag",
    it: "Audio ospitato per 1 giorno",
    nl: "Gehoste audio voor 1 dag",
    ar: "صوت مستضاف ليوم واحد",
    ja: "ホスト音声1日間",
    ko: "호스팅 오디오 1일",
    tr: "1 gün barındırılan ses",
    hi: "1 दिन के लिए होस्टेड ऑडियो",
    zh: "托管音频 1 天",
    th: "เสียงโฮสต์ 1 วัน",
  }),
  hostedForN: L({
    en: "Hosted audio for {{n}} days",
    fr: "Audio hébergé {{n}} jours",
    es: "Audio alojado durante {{n}} días",
    pt: "Áudio hospedado por {{n}} dias",
    de: "Gehostetes Audio für {{n}} Tage",
    it: "Audio ospitato per {{n}} giorni",
    nl: "Gehoste audio voor {{n}} dagen",
    ar: "صوت مستضاف لـ {{n}} أيام",
    ja: "ホスト音声{{n}}日間",
    ko: "호스팅 오디오 {{n}}일",
    tr: "{{n}} gün barındırılan ses",
    hi: "{{n}} दिनों के लिए होस्टेड ऑडियो",
    zh: "托管音频 {{n}} 天",
    th: "เสียงโฮสต์ {{n}} วัน",
  }),
  summary: L({
    en: "Free: {{free}}. Pro: {{pro}} days. Studio: {{studio}} days. Plus: links stay active while subscribed.",
    fr: "Free : {{free}}. Pro : {{pro}} jours. Studio : {{studio}} jours. Plus : liens actifs tant que tu es abonné.",
    es: "Free: {{free}}. Pro: {{pro}} días. Studio: {{studio}} días. Plus: enlaces activos mientras estés suscrito.",
    pt: "Free: {{free}}. Pro: {{pro}} dias. Studio: {{studio}} dias. Plus: links ativos enquanto assinante.",
    de: "Free: {{free}}. Pro: {{pro}} Tage. Studio: {{studio}} Tage. Plus: Links aktiv solange Abo läuft.",
    it: "Free: {{free}}. Pro: {{pro}} giorni. Studio: {{studio}} giorni. Plus: link attivi finché sei abbonato.",
    nl: "Free: {{free}}. Pro: {{pro}} dagen. Studio: {{studio}} dagen. Plus: links actief zolang je abonneert.",
    ar: "Free: {{free}}. Pro: {{pro}} أيام. Studio: {{studio}} أيام. Plus: روابط نشطة طوال الاشتراك.",
    ja: "Free: {{free}}。Pro: {{pro}}日。Studio: {{studio}}日。Plus: サブスク中はリンク有効。",
    ko: "Free: {{free}}. Pro: {{pro}}일. Studio: {{studio}}일. Plus: 구독 중 링크 유지.",
    tr: "Free: {{free}}. Pro: {{pro}} gün. Studio: {{studio}} gün. Plus: abonelikte linkler aktif.",
    hi: "Free: {{free}}. Pro: {{pro}} दिन. Studio: {{studio}} दिन. Plus: सदस्यता में लिंक सक्रिय.",
    zh: "Free：{{free}}。Pro：{{pro}} 天。Studio：{{studio}} 天。Plus：订阅期间链接有效。",
    th: "Free: {{free}} Pro: {{pro}} วัน Studio: {{studio}} วัน Plus: ลิงก์ใช้ได้ตลอดสมัคร",
  }),
  dayOne: L({
    en: "1 day",
    fr: "1 jour",
    es: "1 día",
    pt: "1 dia",
    de: "1 Tag",
    it: "1 giorno",
    nl: "1 dag",
    ar: "يوم واحد",
    ja: "1日",
    ko: "1일",
    tr: "1 gün",
    hi: "1 दिन",
    zh: "1 天",
    th: "1 วัน",
  }),
  daysN: L({
    en: "{{n}} days",
    fr: "{{n}} jours",
    es: "{{n}} días",
    pt: "{{n}} dias",
    de: "{{n}} Tage",
    it: "{{n}} giorni",
    nl: "{{n}} dagen",
    ar: "{{n}} أيام",
    ja: "{{n}}日",
    ko: "{{n}}일",
    tr: "{{n}} gün",
    hi: "{{n}} दिन",
    zh: "{{n}} 天",
    th: "{{n}} วัน",
  }),
};

function formatDaysLabel(locale: AppLocale, days: number): string {
  if (days === 1) return pickL(RETENTION_LABELS.dayOne, locale);
  return pickL(RETENTION_LABELS.daysN, locale).replace("{{n}}", String(days));
}

export function getLoopAudioRetentionCardLabel(
  createdAt: string,
  locale: AppLocale,
  ctx?: LoopAudioRetentionContext,
): string | null {
  if (isLoopAudioRetentionDisabled()) return null;
  if (hasPermanentHostedAudio(ctx?.plan)) return null;

  const days = getDaysUntilAudioExpiry(createdAt, ctx);
  if (days === 0) return pickL(RETENTION_LABELS.expired, locale);
  if (days === 1) return pickL(RETENTION_LABELS.expiresInOne, locale);
  return pickL(RETENTION_LABELS.expiresInN, locale).replace("{{n}}", String(days));
}

/** Texte tarifs / aide. */
export function plusPermanentAudioBenefit(locale: AppLocale): string {
  return pickL(RETENTION_LABELS.plusPermanent, locale);
}

export function hostedAudioRetentionDaysLabel(locale: AppLocale, plan?: string | null): string {
  const days = getLoopAudioRetentionDays(plan);
  if (days === 1) return pickL(RETENTION_LABELS.hostedOne, locale);
  return pickL(RETENTION_LABELS.hostedN, locale).replace("{{n}}", String(days));
}

export function standardAudioRetentionNote(locale: AppLocale, plan?: string | null): string {
  const days = getLoopAudioRetentionDays(plan);
  if (days === 1) return pickL(RETENTION_LABELS.hostedForOne, locale);
  return pickL(RETENTION_LABELS.hostedForN, locale).replace("{{n}}", String(days));
}

export function hostedAudioRetentionSummary(locale: AppLocale): string {
  const freeDays = LOOP_AUDIO_RETENTION_DAYS_FREE;
  const freeLabel = formatDaysLabel(locale, freeDays);
  return pickL(RETENTION_LABELS.summary, locale)
    .replace("{{free}}", freeLabel)
    .replace("{{pro}}", String(LOOP_AUDIO_RETENTION_DAYS_PRO))
    .replace("{{studio}}", String(LOOP_AUDIO_RETENTION_DAYS_STUDIO));
}
