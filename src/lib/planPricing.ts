import type { AppLocale } from "@/i18n/config";
import { UI_LOCALES } from "@/i18n/config";
import { buildPricingPageSection } from "@/i18n/pricingCatalog";
import { formatPlanPrice, planMonthlySuffix } from "@/i18n/format";

/** Affichage UI — facturation Stripe en USD ($8 / $24 / $47). */
export const PLAN_MONTHLY_USD = {
  pro: 8,
  studio: 24,
  plus: 47,
} as const;

export const PLAN_BILLING_CURRENCY = "USD" as const;

export function planPriceLabel(
  tier: keyof typeof PLAN_MONTHLY_USD | "free",
  locale: AppLocale = "en",
  opts?: { suffix?: boolean },
): string {
  return formatPlanPrice(tier, locale, opts);
}

export function planPriceUpsellLabel(tier: keyof typeof PLAN_MONTHLY_USD, locale: AppLocale): string {
  const amount = PLAN_MONTHLY_USD[tier];
  const suffix = planMonthlySuffix(locale).replace(/^\//, "");
  const per = locale === "fr" ? "mois" : locale === "de" ? "Monat" : locale === "es" ? "mes" : locale === "pt" ? "mês" : locale === "it" ? "mese" : locale === "nl" ? "mnd" : locale === "ar" ? "شهر" : locale === "ja" ? "月" : locale === "ko" ? "월" : locale === "tr" ? "ay" : locale === "hi" ? "माह" : locale === "zh" ? "月" : locale === "th" ? "เดือน" : "month";
  return `$${amount} / ${per}`;
}

export function commercialRightsFaq(locale: AppLocale): { q: string; a: string } {
  const s = buildPricingPageSection(locale);
  return { q: s.faqCommercialQ, a: s.faqCommercialA };
}

/** @deprecated Use commercialRightsFaq(locale) — 14 langues via pricingCatalog */
export const COMMERCIAL_RIGHTS_FAQ = Object.fromEntries(
  UI_LOCALES.map((loc) => [loc, commercialRightsFaq(loc)]),
) as Record<AppLocale, { q: string; a: string }>;
