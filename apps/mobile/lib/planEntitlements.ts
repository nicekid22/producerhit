/** Plan feature gates — keep in sync with web `src/lib/planEntitlements.ts`. */
import { normalizePlanId, type PlanId } from "@producerhit/shared";

const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  pro: 1,
  studio: 2,
  plus: 3,
};

export function isPaidPlan(plan: string | null | undefined): boolean {
  return normalizePlanId(plan) !== "free";
}

export function hasCommercialUseRights(plan: string | null | undefined): boolean {
  return isPaidPlan(plan);
}

export function canExportWav(plan: string | null | undefined): boolean {
  return isPaidPlan(plan);
}

export function canDownloadStems(plan: string | null | undefined): boolean {
  return normalizePlanId(plan) === "plus";
}

export function planDisplayName(plan: string | null | undefined): string {
  const id = normalizePlanId(plan);
  if (id === "plus") return "Plus";
  if (id === "studio") return "Studio";
  if (id === "pro") return "Pro";
  return "Free";
}

export function hasPriorityGeneration(plan: string | null | undefined): boolean {
  return PLAN_RANK[normalizePlanId(plan)] >= PLAN_RANK.pro;
}
