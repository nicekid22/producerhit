import { create } from "zustand";
import { loadWavFormatCoachProgress, saveWavFormatCoachProgress } from "@/lib/onboarding/wavFormatCoachStorage";

export type WavFormatCoachMode = "pro" | "free";

type WavFormatCoachState = {
  visible: boolean;
  mode: WavFormatCoachMode | null;
  userId: string | null;
  timerId: number | null;
  scheduleProTip: (userId: string, delayMs?: number) => void;
  scheduleFreeTease: (userId: string, delayMs?: number) => void;
  triggerFreeClick: (userId: string) => boolean;
  show: (userId: string, mode: WavFormatCoachMode) => void;
  dismiss: (opts?: { markDone?: boolean }) => void;
  cancelPending: () => void;
};


export const useWavFormatCoachStore = create<WavFormatCoachState>((set, get) => ({
  visible: false,
  mode: null,
  userId: null,
  timerId: null,

  cancelPending: () => {
    const { timerId } = get();
    if (timerId !== null) window.clearTimeout(timerId);
    set({ timerId: null });
  },

  show: (userId, mode) => {
    const progress = loadWavFormatCoachProgress(userId);
    if (mode === "pro" && progress.proTipDone) return;
    if (mode === "free" && progress.freeTeaseDone) return;
    set({ visible: true, mode, userId });
  },

  scheduleProTip: (userId, delayMs = 14_000) => {
    get().cancelPending();
    const progress = loadWavFormatCoachProgress(userId);
    if (progress.proTipDone) return;

    const timerId = window.setTimeout(() => {
      if (get().userId && get().userId !== userId) return;
      get().show(userId, "pro");
    }, delayMs);
    set({ userId, timerId });
  },

  scheduleFreeTease: (userId, delayMs = 22_000) => {
    get().cancelPending();
    const progress = loadWavFormatCoachProgress(userId);
    if (progress.freeTeaseDone) return;

    const timerId = window.setTimeout(() => {
      if (get().userId && get().userId !== userId) return;
      get().show(userId, "free");
    }, delayMs);
    set({ userId, timerId });
  },

  triggerFreeClick: (userId) => {
    const progress = loadWavFormatCoachProgress(userId);
    if (progress.freeTeaseDone) return false;
    get().show(userId, "free");
    return true;
  },

  dismiss: (opts) => {
    const { userId, mode } = get();
    if (userId && opts?.markDone !== false && mode) {
      if (mode === "pro") saveWavFormatCoachProgress(userId, { proTipDone: true });
      if (mode === "free") {
        saveWavFormatCoachProgress(userId, {
          freeTeaseDone: true,
          freeTeaseDismissedAt: new Date().toISOString(),
        });
      }
    }
    get().cancelPending();
    set({ visible: false, mode: null });
  },
}));
