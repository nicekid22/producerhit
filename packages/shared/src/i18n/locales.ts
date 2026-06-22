/** Langues avec pools de prompts aléatoires (aligné web UI_LOCALES). */
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

/** Langue appareil / navigateur — première visite. */
export function getDeviceAppLocale(): AppLocale {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale ?? "en";
    return normalizeLocale(tag) ?? DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

const PROMPT_LOCALE_SET = new Set<string>(UI_LOCALES);

/** Map code vocal ACE (en, ja, ru…) → pool de prompts (14 locales UI). */
export function vocalCodeToPromptLocale(code: string): AppLocale {
  const normalized = code.trim().toLowerCase();
  if (PROMPT_LOCALE_SET.has(normalized)) return normalized as AppLocale;
  return DEFAULT_LOCALE;
}
