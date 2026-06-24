import type { PlanId } from "../index";

export const DISTRIBUTION_MONTHLY_QUOTA: Record<PlanId, number> = {
  free: 0,
  pro: 0,
  studio: 2,
  plus: 5,
};

const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  pro: 1,
  studio: 2,
  plus: 3,
};

export function distributionMonthlyQuota(plan: string | null | undefined): number {
  const id = normalizePlanForDistribution(plan);
  return DISTRIBUTION_MONTHLY_QUOTA[id];
}

export function canDistribute(plan: string | null | undefined): boolean {
  return distributionMonthlyQuota(plan) > 0;
}

export function normalizePlanForDistribution(plan: string | null | undefined): PlanId {
  if (plan === "pro" || plan === "studio" || plan === "plus") return plan;
  return "free";
}

export function canViewDistributionRoyalties(plan: string | null | undefined): boolean {
  return normalizePlanForDistribution(plan) === "plus";
}

export function distributionPlanRank(plan: string | null | undefined): number {
  return PLAN_RANK[normalizePlanForDistribution(plan)];
}
