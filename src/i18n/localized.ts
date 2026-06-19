import { UI_LOCALES, type AppLocale } from "./config";

export type LocalizedString = Partial<Record<AppLocale, string>> & { en: string };

export function L(strings: LocalizedString): Record<AppLocale, string> {
  const { en } = strings;
  const out = {} as Record<AppLocale, string>;
  for (const loc of UI_LOCALES) {
    out[loc] = strings[loc] ?? en;
  }
  return out;
}

export function pickL(map: Record<AppLocale, string>, locale: AppLocale): string {
  return map[locale] ?? map.en;
}

/** Binaire FR/EN — les autres locales retombent sur EN. */
export function pickFrEn<T>(locale: AppLocale, fr: T, en: T): T {
  return locale === "fr" ? fr : en;
}

export function resolveSection<T extends Record<string, Record<AppLocale, string>>>(
  section: T,
  locale: AppLocale,
): { [K in keyof T]: string } {
  const out = {} as { [K in keyof T]: string };
  for (const key of Object.keys(section) as (keyof T)[]) {
    out[key] = pickL(section[key], locale);
  }
  return out;
}
