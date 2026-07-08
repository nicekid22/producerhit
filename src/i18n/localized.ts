import type { AppLocale } from "./config";

export type LocalizedString = Partial<Record<AppLocale, string>> & { en: string };

export function L(strings: LocalizedString): Partial<Record<AppLocale, string>> {
  return strings;
}

export function pickL(map: Partial<Record<AppLocale, string>>, locale: AppLocale): string {
  return map[locale] ?? map.en ?? "";
}

/** Binaire FR/EN — les autres locales retombent sur EN. */
export function pickFrEn<T>(locale: AppLocale, fr: T, en: T): T {
  return locale === "fr" ? fr : en;
}

export function resolveSection<T extends Record<string, Partial<Record<AppLocale, string>>>>(
  section: T,
  locale: AppLocale,
): { [K in keyof T]: string } {
  const out = {} as { [K in keyof T]: string };
  for (const key of Object.keys(section) as (keyof T)[]) {
    out[key] = pickL(section[key], locale);
  }
  return out;
}
