import { useMemo } from "react";
import type { AppLocale } from "./config";
import { getMessages } from "./locales";
import { useLocaleStore } from "@/stores/localeStore";

export type { AppLocale, Locale } from "./config";
export {
  UI_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  LOCALE_SHORT,
  normalizeLocale,
  legacyEnFr,
  isFrenchLocale,
  hreflangUrl,
} from "./config";
export { getMessages } from "./locales";

export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  return useMemo(() => {
    const messages = getMessages(locale);
    return { locale, m: messages };
  }, [locale]);
}

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}
