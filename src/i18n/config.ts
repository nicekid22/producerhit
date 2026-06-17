/** Langues avec interface traduite (marketing + app progressive). */
export const UI_LOCALES = ["en", "fr", "es", "pt", "de", "it", "ja", "ko", "zh", "th"] as const;

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
  ja: "日本語",
  ko: "한국어",
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
  ja: "JA",
  ko: "KO",
  zh: "ZH",
  th: "TH",
};

/** Balise HTML lang (SEO / accessibilité). */
export const HTML_LANG: Partial<Record<AppLocale, string>> = {
  zh: "zh-Hans",
};

export function htmlLangAttribute(locale: AppLocale): string {
  return HTML_LANG[locale] ?? locale;
}

const LOCALE_PREFIX: Record<string, AppLocale> = {
  en: "en",
  fr: "fr",
  es: "es",
  pt: "pt",
  de: "de",
  it: "it",
  ja: "ja",
  jp: "ja",
  ko: "ko",
  kr: "ko",
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

export function isFrenchLocale(locale: AppLocale): boolean {
  return locale === "fr";
}

export function hreflangUrl(origin: string, pathname: string, locale: AppLocale): string {
  const url = new URL(origin + pathname);
  url.searchParams.set("lang", locale);
  return url.toString();
}
