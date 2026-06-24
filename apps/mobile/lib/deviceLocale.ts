import { getLocales } from "expo-localization";
import { normalizeLocale, DEFAULT_LOCALE, type AppLocale } from "@producerhit/shared";

/** Langue système iOS/Android via expo-localization (ordre des réglages utilisateur). */
export function getDeviceAppLocale(): AppLocale {
  try {
    const locales = getLocales();
    for (const loc of locales) {
      const tag = loc.languageTag ?? loc.languageCode;
      const normalized = normalizeLocale(tag);
      if (normalized) return normalized;
    }
  } catch {
    /* rare — fallback Intl */
  }

  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale ?? "en";
    return normalizeLocale(tag) ?? DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}
