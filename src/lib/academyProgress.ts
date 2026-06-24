const STORAGE_KEY = "ph:distribution-academy:v1";

export type AcademyProgress = Record<string, string>;

export function readDistributionAcademyProgress(): AcademyProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as AcademyProgress;
  } catch {
    return {};
  }
}

export function markDistributionModuleComplete(moduleId: string): AcademyProgress {
  const next = { ...readDistributionAcademyProgress(), [moduleId]: new Date().toISOString() };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function isDistributionModuleComplete(moduleId: string, progress?: AcademyProgress): boolean {
  const p = progress ?? readDistributionAcademyProgress();
  return Boolean(p[moduleId]);
}
