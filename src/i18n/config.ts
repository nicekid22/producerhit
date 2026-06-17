/** Langues avec interface traduite (marketing + app progressive). */
export const UI_LOCALES = [
  "en",
  "fr",
  "es",
  "pt",
  "de",
  "it",
  "nl",
  "ar",
  "ja",
  "ko",
  "tr",
  "hi",
  "zh",
  "th",
] as const;

export type AppLocale = (typeof UI_LOCALES)[number];

/** @deprecated Prefer AppLocale — kept for gradual migration */
export type Locale = AppLocale;

export const DEFAULT_LOCALE: AppLocale = "en";

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  pt: "Português",
  de: "Deutsch",
  it: "Italiano",
  nl: "Nederlands",
  ar: "العربية",
  ja: "日本語",
  ko: "한국어",
  tr: "Türkçe",
  hi: "हिन्दी",
  zh: "中文",
  th: "ไทย",
};

export const LOCALE_SHORT: Record<AppLocale, string> = {
  en: "EN",
  fr: "FR",
  es: "ES",
  pt: "PT",
  de: "DE",
  it: "IT",
  nl: "NL",
  ar: "AR",
  ja: "JA",
  ko: "KO",
  tr: "TR",
  hi: "HI",
  zh: "ZH",
  th: "TH",
};

/** Balise HTML lang (SEO / accessibilité). */
export const HTML_LANG: Partial<Record<AppLocale, string>> = {
  zh: "zh-Hans",
  ar: "ar",
  hi: "hi",
};

/** Locales écrites de droite à gauche. */
export const RTL_LOCALES: ReadonlySet<AppLocale> = new Set(["ar"]);

export function htmlLangAttribute(locale: AppLocale): string {
  return HTML_LANG[locale] ?? locale;
}

export function isRtlLocale(locale: AppLocale): boolean {
  return RTL_LOCALES.has(locale);
}

const LOCALE_PREFIX: Record<string, AppLocale> = {
  en: "en",
  fr: "fr",
  es: "es",
  pt: "pt",
  de: "de",
  it: "it",
  nl: "nl",
  ar: "ar",
  ja: "ja",
  jp: "ja",
  ko: "ko",
  kr: "ko",
  tr: "tr",
  hi: "hi",
  zh: "zh",
  cn: "zh",
  th: "th",
};

export function normalizeLocale(input: string | null | undefined): AppLocale | null {
  if (!input) return null;
  const v = input.trim().toLowerCase();
  if (v in LOCALE_PREFIX) return LOCALE_PREFIX[v]!;
  const base = v.split("-")[0];
  if (base && base in LOCALE_PREFIX) return LOCALE_PREFIX[base]!;
  return null;
}

/** Contenu legacy EN/FR — les autres langues UI retombent sur l’anglais. */
export function legacyEnFr(locale: AppLocale, en: string, fr: string): string {
  return locale === "fr" ? fr : en;
}

/** Chemin SEO localisé (FR a des slugs dédiés). */
export function localizedPath(locale: AppLocale, enPath: string, frPath?: string): string {
  if (locale === "fr" && frPath) return frPath;
  return enPath;
}

export function isFrenchLocale(locale: AppLocale): boolean {
  return locale === "fr";
}

export function hreflangUrl(origin: string, pathname: string, locale: AppLocale): string {
  const url = new URL(origin + pathname);
  url.searchParams.set("lang", locale);
  return url.toString();
}

/** Open Graph locale tags (ex. fr_FR). */
export const OG_LOCALE: Record<AppLocale, string> = {
  en: "en_US",
  fr: "fr_FR",
  es: "es_ES",
  pt: "pt_BR",
  de: "de_DE",
  it: "it_IT",
  nl: "nl_NL",
  ar: "ar_SA",
  ja: "ja_JP",
  ko: "ko_KR",
  tr: "tr_TR",
  hi: "hi_IN",
  zh: "zh_CN",
  th: "th_TH",
};
