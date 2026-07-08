import { supabase } from "@/lib/supabaseClient";
import { loadGamification } from "@/lib/gamification";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { ensureActivationNudge } from "@/lib/notifications";
import { useLocaleStore } from "@/stores/localeStore";

export async function fetchOnboardingStepsFromServer(): Promise<Set<string>> {
  try {
    const { data, error } = await supabase.rpc("get_onboarding_progress");
    if (error) return new Set();
    const row = data as { ok?: boolean; steps?: unknown } | null;
    if (!row?.ok || !Array.isArray(row.steps)) return new Set();
    return new Set(row.steps.filter((s): s is string => typeof s === "string"));
  } catch {
    return new Set();
  }
}

async function refreshNotificationsIfNeeded(created: boolean): Promise<void> {
  if (!created) return;
  const locale = useLocaleStore.getState().locale;
  await ensureActivationNudge(locale);
  await useNotificationStore.getState().refresh();
}

export async function completeOnboardingStepOnServer(stepId: string): Promise<boolean> {
  try {
    const locale = useLocaleStore.getState().locale;
    const { data, error } = await supabase.rpc("complete_onboarding_step", {
      p_step_id: stepId,
      p_locale: locale === "fr" ? "fr" : "en",
    });
    if (error) return false;
    const row = data as { ok?: boolean; created?: boolean } | null;
    if (!row?.ok) return false;
    await refreshNotificationsIfNeeded(Boolean(row.created));
    return true;
  } catch {
    return false;
  }
}

/** Étapes clés activation (notifications progressives, plus de checklist UI). */
export const ACTIVATION_CHECKLIST_STEPS = [
  { id: "first_beat", labelFr: "Première génération", labelEn: "First generation" },
  { id: "library_visit", labelFr: "Visite Library", labelEn: "Visit Library", href: "/library" },
  { id: "community_visit", labelFr: "Explorer la commu", labelEn: "Explore community", href: "/community" },
  {
    id: "referral_share",
    labelFr: "Partager ton lien",
    labelEn: "Share referral link",
    href: "/settings#pk-settings-referral",
  },
] as const;

export type ActivationStepId = (typeof ACTIVATION_CHECKLIST_STEPS)[number]["id"];

const LOCAL_STEP_KEYS: Record<string, string> = {
  library_visit: "producerhit_library_visited_v1",
  community_visit: "producerhit_community_visited_v1",
  referral_share: "producerhit_referral_shared_v1",
};

function isLocalStepDone(stepId: string): boolean {
  if (stepId === "first_beat") return loadGamification().totalGenerations >= 1;
  const key = LOCAL_STEP_KEYS[stepId];
  if (!key) return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/** Marque une étape locale + sync serveur (Library, Commu, parrainage). */
export function markActivationStepLocal(stepId: string): void {
  const key = LOCAL_STEP_KEYS[stepId];
  if (key) {
    try {
      window.localStorage.setItem(key, "1");
    } catch {
      void 0;
    }
  }
  void completeOnboardingStepOnServer(stepId);
}

/** Sync étapes locales → serveur (sans UI checklist). */
export async function syncActivationProgressFromLocal(): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;

  const serverSteps = await fetchOnboardingStepsFromServer();
  for (const step of ACTIVATION_CHECKLIST_STEPS) {
    if (serverSteps.has(step.id)) continue;
    if (!isLocalStepDone(step.id)) continue;
    await completeOnboardingStepOnServer(step.id);
  }
}
