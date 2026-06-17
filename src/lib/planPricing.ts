import type { AppLocale } from "@/i18n/config";
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

export const COMMERCIAL_RIGHTS_FAQ = {
  en: {
    q: "Commercial rights",
    a: "The Free tier does not grant you commercial rights to your music. If you plan to monetize your tracks on Spotify, YouTube, or for client work, you must upgrade to the Pro, Studio or Plus plan. These rights usually only apply to songs generated while the subscription is active, not retroactively.",
  },
  fr: {
    q: "Droits commerciaux",
    a: "Le plan Free ne te confère pas de droits commerciaux sur ta musique. Pour monétiser sur Spotify, YouTube ou pour des clients, passe Pro, Studio ou Plus. Ces droits s'appliquent en général aux morceaux générés pendant l'abonnement actif, pas rétroactivement.",
  },
} as const;
