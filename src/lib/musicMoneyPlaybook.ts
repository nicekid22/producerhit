import type { AppLocale } from "@/i18n/config";
import {
  musicMoneyPlaysI18n,
  musicMoneySectionCopyI18n,
} from "@/i18n/musicMoneyPlaybookCatalog";
import { PLAN_MONTHLY_USD } from "@/lib/planPricing";
import { PLAN_LIMITS } from "@/lib/planLimits";

export type MoneyPlay = {
  id: string;
  title: string;
  potential: string;
  steps: string[];
  plan: string;
};

export function musicMoneyPlaybook(locale: AppLocale): MoneyPlay[] {
  const perTrack = (PLAN_MONTHLY_USD.pro / PLAN_LIMITS.pro).toFixed(2);
  return musicMoneyPlaysI18n(locale, perTrack);
}

export function musicMoneySectionCopy(locale: AppLocale) {
  return musicMoneySectionCopyI18n(locale);
}
