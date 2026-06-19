import type { AppLocale } from "@/i18n/config";
import type { PaidPlan } from "@/lib/billing";
import { PLAN_MONTHLY_USD } from "@/lib/planPricing";

export type BillingInterval = "month" | "year";

export const ANNUAL_DISCOUNT_RATE = 0.2;

export function annualTotalUsd(tier: keyof typeof PLAN_MONTHLY_USD): number {
  const monthly = PLAN_MONTHLY_USD[tier];
  return Math.round(monthly * 12 * (1 - ANNUAL_DISCOUNT_RATE));
}

export function annualMonthlyEquivalentUsd(tier: keyof typeof PLAN_MONTHLY_USD): number {
  return Math.round((annualTotalUsd(tier) / 12) * 100) / 100;
}

export function formatUsd(amount: number): string {
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

export function planDisplayPrice(
  tier: keyof typeof PLAN_MONTHLY_USD | "free",
  interval: BillingInterval,
): string {
  if (tier === "free") return "$0";
  if (interval === "year") return formatUsd(annualTotalUsd(tier));
  return formatUsd(PLAN_MONTHLY_USD[tier]);
}

export function billingIntervalCopy(locale: AppLocale): {
  monthly: string;
  annual: string;
  saveBadge: string;
  perMonth: string;
  perYear: string;
  billedAnnually: string;
} {
  const isFr = locale === "fr";
  return {
    monthly: isFr ? "Mensuel" : "Monthly",
    annual: isFr ? "Annuel" : "Annual",
    saveBadge: isFr ? "−20 %" : "Save 20%",
    perMonth: isFr ? "mois" : "mo",
    perYear: isFr ? "an" : "yr",
    billedAnnually: isFr ? "facturé annuellement" : "billed annually",
  };
}

export function isPaidPlanTier(plan: string | undefined): plan is PaidPlan {
  return plan === "pro" || plan === "studio" || plan === "plus";
}
