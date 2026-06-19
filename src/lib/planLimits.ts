export const PLAN_LIMITS = {
  free: 10,
  pro: 75,
  studio: 250,
  plus: 1000,
} as const;

export type PlanLimitKey = keyof typeof PLAN_LIMITS;

/** Free users get mastering preview (listen) after this many generations — export on paid plans. */
export const FREE_MASTERING_UPSELL_AT = 4;

export type GenerationBonusCredits = {
  referralBonus?: number;
  levelBonus?: number;
  dailyBonusMonth?: number;
  purchasedBonus?: number;
};

import { hasFullMastering, isPaidPlan } from "@/lib/planEntitlements";

export function getPlanBaseLimit(plan: string): number {
  return PLAN_LIMITS[plan as PlanLimitKey] ?? PLAN_LIMITS.free;
}

export function getTotalGenerationLimit(plan: string, bonus: GenerationBonusCredits = {}): number {
  const base = getPlanBaseLimit(plan);
  const extra =
    Math.max(0, bonus.referralBonus ?? 0) +
    Math.max(0, bonus.levelBonus ?? 0) +
    Math.max(0, bonus.dailyBonusMonth ?? 0) +
    Math.max(0, bonus.purchasedBonus ?? 0);
  return base + extra;
}

export function getRemainingBeats(
  plan: string,
  usedThisMonth: number,
  referralBonus = 0,
  levelBonus = 0,
  dailyBonusMonth = 0,
  purchasedBonus = 0,
): number {
  const limit = getTotalGenerationLimit(plan, { referralBonus, levelBonus, dailyBonusMonth, purchasedBonus });
  return Math.max(0, limit - usedThisMonth);
}

export function canGenerate(
  plan: string,
  usedThisMonth: number,
  referralBonus = 0,
  levelBonus = 0,
  dailyBonusMonth = 0,
  purchasedBonus = 0,
): boolean {
  return getRemainingBeats(plan, usedThisMonth, referralBonus, levelBonus, dailyBonusMonth, purchasedBonus) > 0;
}

export function canExportMastering(plan: string): boolean {
  return hasFullMastering(plan);
}

export function canApplyMastering(plan: string): boolean {
  return hasFullMastering(plan);
}

export function isFreePlan(plan: string): boolean {
  return !isPaidPlan(plan);
}
