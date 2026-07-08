import { useMemo } from "react";
import type { AppLocale } from "./config";
import { getMessages } from "./locales";
import { buildDashboardSection } from "./dashboardCatalog";
import { useLocaleStore } from "@/stores/localeStore";

export function getDashboardMessages(locale: AppLocale) {
  const base = getMessages(locale);
  return { ...base, dashboard: buildDashboardSection(locale) };
}

export function useDashboardT() {
  const locale = useLocaleStore((s) => s.locale);
  return useMemo(() => {
    const messages = getDashboardMessages(locale);
    return { locale, m: messages };
  }, [locale]);
}
