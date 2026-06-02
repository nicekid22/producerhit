/** Paid plan IDs and feature gates — keep in sync with Supabase billing + PLAN_LIMITS. */
export type PaidPlanId = "pro" | "studio" | "plus";
export type PlanId = "free" | PaidPlanId;

export const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  pro: 1,
  studio: 2,
  plus: 3,
};

export function normalizePlanId(plan: string | null | undefined): PlanId {
  if (plan === "pro" || plan === "studio" || plan === "plus") return plan;
  return "free";
}

export function isPaidPlan(plan: string | null | undefined): boolean {
  return normalizePlanId(plan) !== "free";
}

export function hasPriorityGeneration(plan: string | null | undefined): boolean {
  return normalizePlanId(plan) === "plus";
}

/** Plus : liens audio hébergés sans expiration 7j (tant que l’abonnement Plus est actif). */
export function hasPermanentHostedAudio(plan: string | null | undefined): boolean {
  return normalizePlanId(plan) === "plus";
}

export function canExportWav(plan: string | null | undefined): boolean {
  return isPaidPlan(plan);
}

/** Mastering complet (aperçu apply + export master) — Studio et Plus. */
export function hasFullMastering(plan: string | null | undefined): boolean {
  return PLAN_RANK[normalizePlanId(plan)] >= PLAN_RANK.studio;
}

export function canExportMastering(plan: string | null | undefined): boolean {
  return hasFullMastering(plan);
}

export function canDownloadStems(plan: string | null | undefined): boolean {
  return normalizePlanId(plan) === "plus";
}

export function canShareWithoutWatermark(plan: string | null | undefined): boolean {
  return isPaidPlan(plan);
}

export function planDisplayName(plan: string | null | undefined): string {
  const id = normalizePlanId(plan);
  if (id === "plus") return "Plus";
  if (id === "studio") return "Studio";
  if (id === "pro") return "Pro";
  return "Free";
}
