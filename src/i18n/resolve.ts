import type { AppLocale } from "./config";

/** Chaîne localisée avec repli EN (et FR legacy si fourni). */
export function pickLocalized(
  locale: AppLocale,
  strings: Partial<Record<AppLocale, string>> & { en: string; fr?: string },
): string {
  if (strings[locale]) return strings[locale]!;
  if (locale === "fr" && strings.fr) return strings.fr;
  if (locale === "pt" && strings.es) return strings.es;
  if (locale === "it" && strings.es) return strings.es;
  if (locale === "nl" && strings.de) return strings.de;
  return strings.en;
}
