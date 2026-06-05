import { trackClientEvent } from "@/lib/supabaseClient";
import {
  buildGenerationPlaybackQueue,
  buildWorkspaceQueueFromLoop,
  filterPlayableLoops,
  findLoopQueueIndex,
  type WorkspaceQueueFilter,
} from "@/lib/workspacePlaybackQueue";
import { resolvePlaybackUrlForLoop, useLoopsStore } from "@/stores/loopsStore";
import { usePlayerStore, type PlaybackOverride } from "@/stores/playerStore";
import type { Loop } from "@/types/loop";

export type GenerationSlotIndex = 1 | 2;

export type GenerationAutoplayOptions = {
  versions: 1 | 2;
  workspaceFilter: WorkspaceQueueFilter;
  mobileV2?: boolean;
  goResults?: () => void;
  isActiveSession: () => boolean;
};

const WORKSPACE_QUEUE_SOURCE = "workspace";

function isSameLoop(a: Loop | null | undefined, b: Loop | null | undefined) {
  if (!a || !b) return false;
  if (a.id === b.id) return true;
  const urlA = a.audioUrl?.trim();
  const urlB = b.audioUrl?.trim();
  if (urlA && urlB && urlA === urlB) return true;
  return a.name.trim().toLowerCase() === b.name.trim().toLowerCase();
}

function isCurrentLoop(loop: Loop | undefined) {
  return isSameLoop(usePlayerStore.getState().current, loop);
}

function generationAutoplayBlocked(override: PlaybackOverride, allowNextAfterPausedFirst: boolean) {
  if (override === "manual") return true;
  if (override === "paused" && allowNextAfterPausedFirst) return false;
  if (override === "paused") return true;
  return false;
}

async function loopForPlayback(loop: Loop): Promise<Loop | null> {
  const url = loop.audioUrl?.trim();
  if (!url) return null;
  try {
    const resolved = await resolvePlaybackUrlForLoop(loop.id, url);
    if (!resolved.trim()) return null;
    const fresh = useLoopsStore.getState().loops.find((l) => l.id === loop.id) ?? loop;
    return { ...fresh, audioUrl: resolved };
  } catch {
    return null;
  }
}

function generationQueue(completionOrder: Loop[], filter: WorkspaceQueueFilter) {
  const loops = useLoopsStore.getState().loops;
  return buildGenerationPlaybackQueue(loops, filter, completionOrder);
}

function bumpPlayback() {
  usePlayerStore.getState().bumpPlaybackRequest();
}

function startAutoplayQueue(loop: Loop, options: GenerationAutoplayOptions, meta?: Record<string, unknown>) {
  if (!options.isActiveSession()) return false;
  if (generationAutoplayBlocked(usePlayerStore.getState().playbackOverride, false)) return false;

  const { queue, startIndex } = buildWorkspaceQueueFromLoop(useLoopsStore.getState().loops, options.workspaceFilter, loop);
  if (!queue.length) return false;

  usePlayerStore.getState().setQueue(queue, startIndex, true, WORKSPACE_QUEUE_SOURCE);
  usePlayerStore.getState().armGenerationAutoplay();
  bumpPlayback();
  trackClientEvent("growth_autoplay", {
    loop_id: queue[startIndex]?.id ?? loop.id,
    count: queue.length,
    ...meta,
  });
  if (options.mobileV2) options.goResults?.();
  return true;
}

function startAutoplayCompletionOrder(
  completionOrder: Loop[],
  options: GenerationAutoplayOptions,
  meta?: Record<string, unknown>,
) {
  if (!options.isActiveSession()) return false;
  if (generationAutoplayBlocked(usePlayerStore.getState().playbackOverride, false)) return false;

  const queue = generationQueue(completionOrder, options.workspaceFilter);
  const first = completionOrder[0];
  if (!first || !queue.length) return false;

  const startIndex = Math.max(0, findLoopQueueIndex(queue, first));
  usePlayerStore.getState().setQueue(queue, startIndex, true, WORKSPACE_QUEUE_SOURCE);
  usePlayerStore.getState().armGenerationAutoplay();
  bumpPlayback();
  trackClientEvent("growth_autoplay", {
    loop_id: queue[startIndex]?.id ?? first.id,
    count: queue.length,
    ...meta,
  });
  if (options.mobileV2) options.goResults?.();
  return true;
}

function refreshAutoplayCompletionOrder(
  completionOrder: Loop[],
  options: GenerationAutoplayOptions,
  opts?: { forcePlay?: boolean },
) {
  if (!options.isActiveSession()) return;
  const player = usePlayerStore.getState();
  const queue = generationQueue(completionOrder, options.workspaceFilter);
  if (!queue.length) return;

  let currentIdx = player.current ? findLoopQueueIndex(queue, player.current) : -1;
  if (currentIdx < 0 && player.current?.audioUrl?.trim()) {
    currentIdx = queue.findIndex((l) => l.audioUrl?.trim() === player.current?.audioUrl?.trim());
  }

  const startIndex = currentIdx >= 0 ? currentIdx : 0;
  const shouldPlay = opts?.forcePlay || player.isPlaying || player.queueSource === WORKSPACE_QUEUE_SOURCE;
  usePlayerStore.getState().setQueue(queue, startIndex, shouldPlay, WORKSPACE_QUEUE_SOURCE);
  if (shouldPlay) bumpPlayback();
}

function tryAutoplayNextAfterPausedFirst(
  completionOrder: Loop[],
  playbackLoop: Loop,
  options: GenerationAutoplayOptions,
  meta?: Record<string, unknown>,
) {
  if (!options.isActiveSession() || completionOrder.length < 2) return false;

  const first = completionOrder[0];
  const second = completionOrder[1];
  if (!first || !second || !isSameLoop(playbackLoop, second)) return false;

  const player = usePlayerStore.getState();
  const pausedOnFirst =
    player.playbackOverride === "paused" &&
    player.queueSource === WORKSPACE_QUEUE_SOURCE &&
    isCurrentLoop(first);

  if (!pausedOnFirst || generationAutoplayBlocked(player.playbackOverride, true)) return false;

  const queue = generationQueue(completionOrder, options.workspaceFilter);
  const targetIdx = findLoopQueueIndex(queue, second);
  if (targetIdx < 0) return false;

  usePlayerStore.getState().setQueue(queue, targetIdx, true, WORKSPACE_QUEUE_SOURCE);
  usePlayerStore.getState().armGenerationAutoplay();
  bumpPlayback();
  trackClientEvent("growth_autoplay", {
    loop_id: queue[targetIdx]?.id ?? second.id,
    count: queue.length,
    resume_after_pause: true,
    ...meta,
  });
  if (options.mobileV2) options.goResults?.();
  return true;
}

export type GenerationAutoplaySession = {
  playWhenReady: (idx: GenerationSlotIndex, loop: Loop, meta?: Record<string, unknown>) => Promise<boolean>;
  notifyPreviewReady: (idx: GenerationSlotIndex, loop: Loop) => void;
  notifyPersisted: (idx: GenerationSlotIndex, loop: Loop, ctx: { wasPreviewPlaying: boolean }) => void;
  finalize: (created: Loop[], slotOrder: Map<string, GenerationSlotIndex>) => Promise<void>;
};

export function armGenerationAutoplay() {
  usePlayerStore.getState().armGenerationAutoplay();
}

export function createGenerationAutoplaySession(options: GenerationAutoplayOptions): GenerationAutoplaySession {
  let started = false;
  const slots = new Map<GenerationSlotIndex, Loop>();
  const completionOrder: Loop[] = [];

  const registerCompletion = (playbackLoop: Loop) => {
    if (!completionOrder.some((l) => l.id === playbackLoop.id)) {
      completionOrder.push(playbackLoop);
    }
  };

  const playWhenReady = async (
    idx: GenerationSlotIndex,
    loop: Loop,
    meta?: Record<string, unknown>,
  ): Promise<boolean> => {
    if (!options.isActiveSession() || !loop.audioUrl?.trim()) return false;
    if (generationAutoplayBlocked(usePlayerStore.getState().playbackOverride, false)) return false;

    const playbackLoop = await loopForPlayback(loop);
    if (!playbackLoop?.audioUrl?.trim() || !options.isActiveSession()) return false;

    slots.set(idx, playbackLoop);
    registerCompletion(playbackLoop);

    if (!started) {
      started = startAutoplayCompletionOrder(completionOrder, options, meta);
      return started;
    }

    const player = usePlayerStore.getState();
    if (player.isPlaying && isCurrentLoop(playbackLoop)) return true;

    refreshAutoplayCompletionOrder(completionOrder, options, { forcePlay: false });

    if (tryAutoplayNextAfterPausedFirst(completionOrder, playbackLoop, options, meta)) return true;

    if (!player.isPlaying && player.queueSource === WORKSPACE_QUEUE_SOURCE) {
      const queue = generationQueue(completionOrder, options.workspaceFilter);
      const targetIdx = findLoopQueueIndex(queue, playbackLoop);
      if (targetIdx >= 0) {
        usePlayerStore.getState().setQueue(queue, targetIdx, true, WORKSPACE_QUEUE_SOURCE);
        usePlayerStore.getState().armGenerationAutoplay();
        bumpPlayback();
        return true;
      }
    }

    return true;
  };

  return {
    playWhenReady,
    notifyPreviewReady: (idx, loop) => {
      void playWhenReady(idx, loop, { preview: true, slot: idx });
    },
    notifyPersisted: (idx, loop, ctx) => {
      slots.set(idx, loop);
      if (ctx.wasPreviewPlaying && isCurrentLoop(loop)) {
        registerCompletion(loop);
        refreshAutoplayCompletionOrder(completionOrder, options);
        tryAutoplayNextAfterPausedFirst(completionOrder, loop, options, { persisted: true });
        return;
      }
      void playWhenReady(idx, loop, { persisted: true, slot: idx });
    },
    finalize: async (created, slotOrder) => {
      if (!options.isActiveSession()) return;

      const playableCreated = filterPlayableLoops(
        created.sort((a, b) => (slotOrder.get(a.name) ?? 99) - (slotOrder.get(b.name) ?? 99)),
      );
      if (!playableCreated.length) return;

      for (const loop of playableCreated) {
        const slotIdx = slotOrder.get(loop.name);
        if (slotIdx === 1 || slotIdx === 2) slots.set(slotIdx, loop);
        if (!completionOrder.some((l) => l.id === loop.id)) completionOrder.push(loop);
      }

      const resolvedOrdered = (await Promise.all(completionOrder.map((l) => loopForPlayback(l)))).filter(
        (l): l is Loop => !!l?.audioUrl?.trim(),
      );
      if (!resolvedOrdered.length || !options.isActiveSession()) return;

      completionOrder.length = 0;
      completionOrder.push(...resolvedOrdered);

      if (
        started &&
        resolvedOrdered.length >= 2 &&
        tryAutoplayNextAfterPausedFirst(resolvedOrdered, resolvedOrdered[1]!, options, { early: false })
      ) {
        return;
      }

      if (!started) {
        if (!generationAutoplayBlocked(usePlayerStore.getState().playbackOverride, false)) {
          startAutoplayCompletionOrder(resolvedOrdered, options, {
            early: false,
            count: resolvedOrdered.length,
          });
          started = true;
        }
        return;
      }

      if (!generationAutoplayBlocked(usePlayerStore.getState().playbackOverride, false)) {
        refreshAutoplayCompletionOrder(resolvedOrdered, options);
      }
    },
  };
}

export function autoplaySingleGenerationResult(loop: Loop, options: GenerationAutoplayOptions) {
  if (generationAutoplayBlocked(usePlayerStore.getState().playbackOverride, false)) return;
  void (async () => {
    const playbackLoop = await loopForPlayback(loop);
    if (!playbackLoop?.audioUrl?.trim() || !options.isActiveSession()) return;
    startAutoplayQueue(playbackLoop, options, { single: true });
  })();
}

export { findLoopQueueIndex, WORKSPACE_QUEUE_SOURCE };
