import { supabase } from "@/lib/supabaseClient";
import type { CoachStepId } from "@/lib/onboarding/coachSteps";

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

export async function completeOnboardingStepOnServer(stepId: CoachStepId | string): Promise<void> {
  try {
    await supabase.rpc("complete_onboarding_step", { p_step_id: stepId });
  } catch {
    void 0;
  }
}

/** Étapes clés pour la checklist activation (mesurable investisseurs). */
export const ACTIVATION_CHECKLIST_STEPS = [
  { id: "tour_done", labelFr: "Tour du studio", labelEn: "Studio tour" },
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
