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
  return PLAN_RANK[normalizePlanId(plan)] >= PLAN_RANK.pro;
}

/** Droits commerciaux (Spotify, YouTube, clients) — Pro et au-dessus. */
export function hasCommercialUseRights(plan: string | null | undefined): boolean {
  return isPaidPlan(plan);
}

/** Plus : liens audio hébergés sans expiration (tant que l’abonnement Plus est actif). Free 1j, Pro 3j, Studio 7j. */
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

/** Voix → paroles (transcription) — Studio+ illimité ; Free/Pro essais mensuels. */
export function canUseVoiceToSong(plan: string | null | undefined, usedThisMonth: number): boolean {
  const id = normalizePlanId(plan);
  if (PLAN_RANK[id] >= PLAN_RANK.studio) return true;
  const limit = id === "pro" ? 5 : 2;
  return Math.max(0, usedThisMonth) < limit;
}

/** Génération ×2 en parallèle (double slot v2) — Studio et Plus uniquement. */
export function canDualGeneration(plan: string | null | undefined): boolean {
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
