import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import type { ActivationStepId } from "./i18n/catalog";

const STORAGE_KEY = "producerhit_mobile_activation_v1";

type Listener = () => void;
const listeners = new Set<Listener>();

/** Notifie les écrans (checklist) quand une étape est complétée. */
export function subscribeActivationProgress(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyActivationProgress(): void {
  for (const listener of listeners) listener();
}

export async function loadActivationSteps(): Promise<Set<ActivationStepId>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((s): s is ActivationStepId => typeof s === "string"));
  } catch {
    return new Set();
  }
}

export async function completeActivationStep(stepId: ActivationStepId): Promise<Set<ActivationStepId>> {
  const steps = await loadActivationSteps();
  if (steps.has(stepId)) return steps;
  steps.add(stepId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...steps]));
  void syncStepToServer(stepId);
  notifyActivationProgress();
  return steps;
}

async function syncStepToServer(stepId: ActivationStepId): Promise<void> {
  try {
    await supabase.rpc("complete_onboarding_step", { p_step_id: stepId });
  } catch {
    // offline OK
  }
}

export async function mergeServerActivationSteps(local: Set<ActivationStepId>): Promise<Set<ActivationStepId>> {
  try {
    const { data, error } = await supabase.rpc("get_onboarding_progress");
    if (error || !data) return local;
    const row = data as { ok?: boolean; steps?: unknown };
    if (!row.ok || !Array.isArray(row.steps)) return local;
    const merged = new Set(local);
    for (const s of row.steps) {
      if (typeof s === "string") merged.add(s as ActivationStepId);
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...merged]));
    return merged;
  } catch {
    return local;
  }
}
