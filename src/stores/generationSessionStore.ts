import { create } from "zustand";

export type GenerationSlotSnapshot = {
  idx: 1 | 2;
  status: "queued" | "waiting" | "generating" | "error";
  errorText?: string;
  seed?: number;
  title: string;
  visible: boolean;
  previewReady?: boolean;
  previewLoopId?: string;
  savedLoopId?: string;
  generationKey?: string;
  progressPct?: number;
};

export type GenerationActivityPhase = "idle" | "generating" | "done" | "error";

type GenerationSessionState = {
  sessionId: number;
  generating: boolean;
  phase: GenerationActivityPhase;
  slots: GenerationSlotSnapshot[] | null;
  startedAt: number | null;
  doneAt: number | null;
  summaryTitle: string | null;
  startSession: (sessionId: number, slots: GenerationSlotSnapshot[]) => void;
  patchSlot: (idx: 1 | 2, patch: Partial<GenerationSlotSnapshot>) => void;
  setSlots: (slots: GenerationSlotSnapshot[] | null) => void;
  setGeneratingFalse: (slots: GenerationSlotSnapshot[] | null) => void;
  markDone: (title?: string | null) => void;
  clearActivity: () => void;
  isSessionActive: (sessionId: number) => boolean;
  maxProgressPct: () => number;
};

export const useGenerationSessionStore = create<GenerationSessionState>((set, get) => ({
  sessionId: 0,
  generating: false,
  phase: "idle",
  slots: null,
  startedAt: null,
  doneAt: null,
  summaryTitle: null,

  startSession: (sessionId, slots) =>
    set({
      sessionId,
      generating: true,
      phase: "generating",
      slots,
      startedAt: Date.now(),
      doneAt: null,
      summaryTitle: slots[0]?.title ?? null,
    }),

  patchSlot: (idx, patch) =>
    set((state) => ({
      slots: state.slots?.map((s) => (s.idx === idx ? { ...s, ...patch } : s)) ?? null,
    })),

  setSlots: (slots) => set({ slots }),

  setGeneratingFalse: (slots) => set({ generating: false, slots }),

  markDone: (title) =>
    set({
      phase: "done",
      generating: false,
      summaryTitle: title ?? get().summaryTitle,
      doneAt: Date.now(),
    }),

  clearActivity: () =>
    set({
      phase: "idle",
      doneAt: null,
      summaryTitle: null,
      slots: null,
      generating: false,
    }),

  isSessionActive: (sessionId) => get().sessionId === sessionId,

  maxProgressPct: () => {
    const active = (get().slots ?? []).filter((s) => s.visible && s.status === "generating");
    if (!active.length) return 0;
    return Math.max(0, ...active.map((s) => s.progressPct ?? 0));
  },
}));
