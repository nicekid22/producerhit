export const PLAN_LIMITS = {
  free: 10,
  pro: 75,
  studio: 250,
} as const;

export function getRemainingBeats(plan: string, usedThisMonth: number): number {
  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;
  return Math.max(0, limit - usedThisMonth);
}

export function canGenerate(plan: string, usedThisMonth: number): boolean {
  return getRemainingBeats(plan, usedThisMonth) > 0;
}
