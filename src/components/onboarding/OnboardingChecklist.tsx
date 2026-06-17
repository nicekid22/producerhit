import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import {
  ACTIVATION_CHECKLIST_STEPS,
  completeOnboardingStepOnServer,
  fetchOnboardingStepsFromServer,
} from "@/lib/onboardingProgress";
import { loadGamification } from "@/lib/gamification";
import { loadCoachProgress } from "@/lib/onboarding/coachStorage";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

type Props = {
  locale: AppLocale;
  className?: string;
};

const LOCAL_KEYS: Record<string, () => boolean> = {
  tour_done: () => {
    const uid = useAuthStore.getState().user?.id;
    if (!uid) return false;
    return loadCoachProgress(uid).tourDone;
  },
  first_beat: () => loadGamification().totalGenerations >= 1,
  library_visit: () => {
    try {
      return window.localStorage.getItem("producerhit_library_visited_v1") === "1";
    } catch {
      return false;
    }
  },
  community_visit: () => {
    try {
      return window.localStorage.getItem("producerhit_community_visited_v1") === "1";
    } catch {
      return false;
    }
  },
  referral_share: () => {
    try {
      return window.localStorage.getItem("producerhit_referral_shared_v1") === "1";
    } catch {
      return false;
    }
  },
};

export function OnboardingChecklist({ locale, className }: Props) {
  const user = useAuthStore((s) => s.user);
  const isFr = locale === "fr";
  const [serverSteps, setServerSteps] = useState<Set<string>>(new Set());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    void fetchOnboardingStepsFromServer().then(setServerSteps);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const timer = window.setInterval(() => setTick((t) => t + 1), 4000);
    return () => window.clearInterval(timer);
  }, [user?.id]);

  const completed = useMemo(() => {
    void tick;
    const set = new Set(serverSteps);
    for (const step of ACTIVATION_CHECKLIST_STEPS) {
      if (LOCAL_KEYS[step.id]?.()) set.add(step.id);
    }
    return set;
  }, [serverSteps, tick]);

  useEffect(() => {
    if (!user?.id) return;
    for (const stepId of completed) {
      if (serverSteps.has(stepId)) continue;
      void completeOnboardingStepOnServer(stepId);
    }
  }, [completed, serverSteps, user?.id]);

  const doneCount = ACTIVATION_CHECKLIST_STEPS.filter((s) => completed.has(s.id)).length;
  const pct = Math.round((doneCount / ACTIVATION_CHECKLIST_STEPS.length) * 100);

  if (!user || doneCount >= ACTIVATION_CHECKLIST_STEPS.length) return null;

  return (
    <div className={cn("pk-activation-checklist rounded-2xl border border-white/10 bg-white/[0.03] p-4", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{isFr ? "Checklist d'activation" : "Activation checklist"}</p>
          <p className="text-xs text-white/55">
            {isFr ? `${doneCount}/${ACTIVATION_CHECKLIST_STEPS.length} — débloque ton studio` : `${doneCount}/${ACTIVATION_CHECKLIST_STEPS.length} — unlock your studio`}
          </p>
        </div>
        <span className="pk-activation-checklist__pct text-sm font-bold">{pct}%</span>
      </div>
      <div className="pk-activation-checklist__track mb-3 h-1.5 overflow-hidden rounded-full">
        <div className="pk-activation-checklist__fill h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-2">
        {ACTIVATION_CHECKLIST_STEPS.map((step) => {
          const done = completed.has(step.id);
          const label = isFr ? step.labelFr : step.labelEn;
          const href = "href" in step ? step.href : undefined;
          return (
            <li key={step.id} className="flex items-center gap-2 text-sm text-white/75">
              {done ? (
                <CheckCircle2 className="pk-activation-checklist__icon pk-activation-checklist__icon--done h-4 w-4 shrink-0" />
              ) : (
                <Circle className="pk-activation-checklist__icon pk-activation-checklist__icon--pending h-4 w-4 shrink-0" />
              )}
              {href && !done ? (
                <Link to={href} className="pk-activation-checklist__link font-medium transition-colors">
                  {label}
                </Link>
              ) : (
                <span className={done ? "text-white/45 line-through" : undefined}>{label}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Marque une étape locale + sync serveur (ex. partage referral). */
export function markActivationStepLocal(stepId: string): void {
  const keyMap: Record<string, string> = {
    library_visit: "producerhit_library_visited_v1",
    community_visit: "producerhit_community_visited_v1",
    referral_share: "producerhit_referral_shared_v1",
  };
  const key = keyMap[stepId];
  if (key) {
    try {
      window.localStorage.setItem(key, "1");
    } catch {
      void 0;
    }
  }
  void completeOnboardingStepOnServer(stepId);
}
