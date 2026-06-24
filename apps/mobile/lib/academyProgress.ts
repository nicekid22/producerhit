import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "ph:distribution-academy:v1";

export type AcademyProgress = Record<string, string>;

export async function readDistributionAcademyProgress(): Promise<AcademyProgress> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as AcademyProgress;
  } catch {
    return {};
  }
}

export async function markDistributionModuleComplete(moduleId: string): Promise<AcademyProgress> {
  const prev = await readDistributionAcademyProgress();
  const next = { ...prev, [moduleId]: new Date().toISOString() };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function isDistributionModuleComplete(moduleId: string, progress: AcademyProgress): boolean {
  return Boolean(progress[moduleId]);
}
