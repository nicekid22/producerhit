import { create } from "zustand";
import {
  COACH_POST_GEN_STEPS,
  COACH_TOUR_STEPS,
  type CoachStep,
  type CoachStepId,
} from "@/lib/onboarding/coachSteps";
import { loadCoachProgress, saveCoachProgress } from "@/lib/onboarding/coachStorage";
import { completeOnboardingStepOnServer } from "@/lib/onboardingProgress";

type CoachPhase = "idle" | "tour" | "post_gen";

let tourRevealTimer: number | null = null;

function clearTourRevealTimer() {
  if (tourRevealTimer == null) return;
  window.clearTimeout(tourRevealTimer);
  tourRevealTimer = null;
}

type CoachState = {
  visible: boolean;
  phase: CoachPhase;
  stepIndex: number;
  userId: string | null;
  hydrate: (userId: string, loopsUsedThisMonth: number, profileReady?: boolean) => void;
  startTour: () => void;
  celebrateFirstGeneration: () => void;
  next: () => void;
  skip: () => void;
  dismissAll: () => void;
  currentStep: () => CoachStep | null;
};

function stepsForPhase(phase: CoachPhase): CoachStep[] {
  if (phase === "post_gen") return COACH_POST_GEN_STEPS;
  if (phase === "tour") return COACH_TOUR_STEPS;
  return [];
}

export const useOnboardingCoachStore = create<CoachState>((set, get) => ({
  visible: false,
  phase: "idle",
  stepIndex: 0,
  userId: null,

  hydrate: (userId, loopsUsedThisMonth, profileReady = false) => {
    clearTourRevealTimer();
    const progress = loadCoachProgress(userId);
    if (progress.tourDone && progress.postGenDone) {
      set({ visible: false, phase: "idle", stepIndex: 0, userId });
      return;
    }
    if (!profileReady) {
      set({ userId, visible: false, phase: "idle", stepIndex: 0 });
      return;
    }
    if (!progress.tourDone && loopsUsedThisMonth <= 0) {
      set({ userId, phase: "tour", stepIndex: 0, visible: false });
      tourRevealTimer = window.setTimeout(() => {
        tourRevealTimer = null;
        if (get().userId === userId && get().phase === "tour" && !loadCoachProgress(userId).tourDone) {
          set({ visible: true });
        }
      }, 1400);
      return;
    }
    set({ userId, visible: false, phase: "idle", stepIndex: 0 });
  },

  startTour: () => {
    const userId = get().userId;
    if (!userId) return;
    set({ phase: "tour", stepIndex: 0, visible: true });
  },

  celebrateFirstGeneration: () => {
    const userId = get().userId;
    if (!userId) return;
    const progress = loadCoachProgress(userId);
    if (progress.firstGenCelebrated || progress.postGenDone) return;
    saveCoachProgress(userId, { firstGenCelebrated: true });
    set({ phase: "post_gen", stepIndex: 0, visible: true });
  },

  currentStep: () => {
    const { phase, stepIndex } = get();
    const steps = stepsForPhase(phase);
    return steps[stepIndex] ?? null;
  },

  next: () => {
    const userId = get().userId;
    if (!userId) return;
    const { phase, stepIndex } = get();
    const steps = stepsForPhase(phase);
    const step = steps[stepIndex];
    if (!step) return;

    if (stepIndex >= steps.length - 1) {
      if (phase === "tour") {
        saveCoachProgress(userId, { tourDone: true });
        void completeOnboardingStepOnServer("tour_done");
        set({ visible: false, phase: "idle", stepIndex: 0 });
      } else if (phase === "post_gen") {
        saveCoachProgress(userId, { postGenDone: true, firstGenCelebrated: true });
        void completeOnboardingStepOnServer("first_beat");
        set({ visible: false, phase: "idle", stepIndex: 0 });
      }
      return;
    }

    set({ stepIndex: stepIndex + 1 });
  },

  skip: () => {
    get().dismissAll();
  },

  dismissAll: () => {
    clearTourRevealTimer();
    const userId = get().userId;
    if (!userId) {
      set({ visible: false, phase: "idle", stepIndex: 0 });
      return;
    }
    const { phase } = get();
    if (phase === "tour") {
      saveCoachProgress(userId, { tourDone: true, dismissedAt: new Date().toISOString() });
      void completeOnboardingStepOnServer("tour_done");
    }
    if (phase === "post_gen") {
      saveCoachProgress(userId, { postGenDone: true, firstGenCelebrated: true });
      void completeOnboardingStepOnServer("first_beat");
    }
    set({ visible: false, phase: "idle", stepIndex: 0 });
  },
}));

export function coachStepId(step: CoachStep | null): CoachStepId | null {
  return step?.id ?? null;
}
