import {
  useGenerationSessionStore,
  type GenerationSlotSnapshot,
} from "@/stores/generationSessionStore";

export function syncGenerationStart(sessionId: number, slots: GenerationSlotSnapshot[]) {
  useGenerationSessionStore.getState().startSession(sessionId, slots);
}

export function syncGenerationSlots(slots: GenerationSlotSnapshot[] | null) {
  useGenerationSessionStore.getState().setSlots(slots);
}

export function syncGenerationSlotPatch(idx: 1 | 2, patch: Partial<GenerationSlotSnapshot>) {
  useGenerationSessionStore.getState().patchSlot(idx, patch);
}

export function isSyncGenerationSessionActive(sessionId: number) {
  return useGenerationSessionStore.getState().isSessionActive(sessionId);
}

export function syncGenerationFinish(
  sessionId: number,
  opts: { slots: GenerationSlotSnapshot[] | null; didGenerate?: boolean; title?: string },
) {
  if (!isSyncGenerationSessionActive(sessionId)) return;
  const store = useGenerationSessionStore.getState();
  store.setGeneratingFalse(opts.slots);
  if (opts.didGenerate) store.markDone(opts.title ?? null);
  else if (!opts.slots?.length) store.clearActivity();
}

export function syncRemixGenerationStart(sessionId: number, slots: GenerationSlotSnapshot[]) {
  syncGenerationStart(sessionId, slots);
}

export function syncRemixGenerationFinish(sessionId: number, opts: { ok: boolean; title?: string }) {
  if (!isSyncGenerationSessionActive(sessionId)) return;
  const store = useGenerationSessionStore.getState();
  store.setGeneratingFalse(null);
  if (opts.ok) store.markDone(opts.title ?? null);
  else store.clearActivity();
}
