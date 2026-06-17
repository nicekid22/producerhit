import type { AppLocale } from "./config";

const INTL_LOCALE: Partial<Record<AppLocale, string>> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-BR",
  de: "de-DE",
  it: "it-IT",
  nl: "nl-NL",
  ar: "ar-SA",
  ja: "ja-JP",
  ko: "ko-KR",
  tr: "tr-TR",
  hi: "hi-IN",
  zh: "zh-Hans",
  th: "th-TH",
};

const MONTH_SUFFIX: Partial<Record<AppLocale, string>> = {
  en: "/mo",
  fr: "/mois",
  es: "/mes",
  pt: "/mês",
  de: "/Mon.",
  it: "/mese",
  nl: "/mnd",
  ar: "/شهر",
  ja: "/月",
  ko: "/월",
  tr: "/ay",
  hi: "/माह",
  zh: "/月",
  th: "/เดือน",
};

export function intlLocale(locale: AppLocale): string {
  return INTL_LOCALE[locale] ?? "en-US";
}

export function formatDate(locale: AppLocale, ymd: string): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return ymd;
  return new Intl.DateTimeFormat(intlLocale(locale), { year: "numeric", month: "short", day: "numeric" }).format(d);
}

export function formatNumber(locale: AppLocale, n: number): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(n);
}

export function planMonthlySuffix(locale: AppLocale): string {
  return MONTH_SUFFIX[locale] ?? "/mo";
}

export function formatPlanPrice(
  tier: "free" | "pro" | "studio" | "plus",
  locale: AppLocale,
  opts?: { suffix?: boolean },
): string {
  if (tier === "free") return "$0";
  const amounts = { pro: 8, studio: 24, plus: 47 } as const;
  const amount = amounts[tier];
  const suffix = opts?.suffix ? planMonthlySuffix(locale) : "";
  if (locale === "ar") return `$${amount}${suffix}`;
  return `$${amount}${suffix}`;
}

export function formatReadingTime(locale: AppLocale, minutes: number): string {
  const n = formatNumber(locale, minutes);
  const map: Record<AppLocale, string> = {
    en: `${n} min read`,
    fr: `${n} min de lecture`,
    es: `${n} min de lectura`,
    pt: `${n} min de leitura`,
    de: `${n} Min. Lesezeit`,
    it: `${n} min di lettura`,
    nl: `${n} min lezen`,
    ar: `${n} دقيقة قراءة`,
    ja: `${n}分で読める`,
    ko: `${n}분 읽기`,
    tr: `${n} dk okuma`,
    hi: `${n} मिनट पढ़ें`,
    zh: `阅读约${n}分钟`,
    th: `อ่าน ${n} นาที`,
  };
  return map[locale] ?? map.en;
}
