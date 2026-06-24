import { create } from "zustand";
import type { Loop } from "@producerhit/shared";
import { prefetchCoverUri } from "@/lib/coverImageCache";
import { saveLastPlayed } from "@/lib/lastPlayedCache";

export type PlaybackHandlers = {
  toggle: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
};

type PlayerState = {
  current: Loop | null;
  queue: Loop[];
  queueIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  positionMs: number;
  durationMs: number;
  expanded: boolean;
  playbackError: string | null;
  handlers: PlaybackHandlers | null;
  setCurrent: (loop: Loop | null, queue?: Loop[]) => void;
  /** Met à jour la cover quand elle arrive (génération / Pinterest). */
  patchLoopCover: (loopId: string, coverUrl: string) => void;
  setPlaying: (playing: boolean) => void;
  setLoading: (loading: boolean) => void;
  setPositionMs: (ms: number, force?: boolean) => void;
  setDurationMs: (ms: number) => void;
  setExpanded: (expanded: boolean) => void;
  setPlaybackError: (message: string | null) => void;
  registerHandlers: (handlers: PlaybackHandlers | null) => void;
  playNext: () => void;
  playPrev: () => void;
  reset: () => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  current: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  isLoading: false,
  positionMs: 0,
  durationMs: 0,
  expanded: false,
  playbackError: null,
  handlers: null,
  setCurrent: (current, queue) => {
    const list = queue ?? (current ? [current] : []);
    const index = current ? list.findIndex((l) => l.id === current.id) : -1;
    const prev = get().current;
    const sameTrack =
      Boolean(current) &&
      prev?.id === current?.id &&
      (prev?.audioUrl?.trim() ?? "") === (current?.audioUrl?.trim() ?? "");

    if (sameTrack) {
      set({
        queue: list,
        queueIndex: index >= 0 ? index : list.length ? 0 : -1,
      });
      return;
    }

    set({
      current,
      queue: list,
      queueIndex: index >= 0 ? index : list.length ? 0 : -1,
      positionMs: 0,
      durationMs: 0,
      isLoading: Boolean(current),
      isPlaying: false,
      playbackError: null,
    });
    if (current) void saveLastPlayed(current);
  },
  patchLoopCover: (loopId, coverUrl) => {
    const trimmed = coverUrl.trim();
    if (!trimmed.startsWith("http")) return;
    const { current, queue } = get();
    const patch = (loop: Loop): Loop =>
      loop.id === loopId ? { ...loop, coverUrl: trimmed } : loop;
    const nextCurrent = current?.id === loopId ? patch(current) : current;
    const nextQueue = queue.some((l) => l.id === loopId) ? queue.map(patch) : queue;
    set({ current: nextCurrent, queue: nextQueue });
    if (nextCurrent) void saveLastPlayed(nextCurrent);
    prefetchCoverUri(trimmed);
  },
  setPlaying: (isPlaying) => set({ isPlaying }),
  setLoading: (isLoading) => set({ isLoading }),
  setPositionMs: (positionMs, force = false) => {
    if (!force) {
      const prev = get().positionMs;
      if (Math.abs(prev - positionMs) < 80) return;
    }
    set({ positionMs });
  },
  setDurationMs: (durationMs) => set({ durationMs }),
  setExpanded: (expanded) => set({ expanded }),
  setPlaybackError: (playbackError) => set({ playbackError }),
  registerHandlers: (handlers) => set({ handlers }),
  playNext: () => {
    const { queue, queueIndex } = get();
    if (queue.length < 2) return;
    const next = (queueIndex + 1) % queue.length;
    const track = queue[next];
    if (!track) return;
    set({ current: track, queueIndex: next, positionMs: 0, durationMs: 0, isLoading: true });
  },
  playPrev: () => {
    const { queue, queueIndex, positionMs } = get();
    if (queue.length < 2) return;
    if (positionMs > 3000) {
      void get().handlers?.seek(0);
      return;
    }
    const prev = queueIndex <= 0 ? queue.length - 1 : queueIndex - 1;
    const track = queue[prev];
    if (!track) return;
    set({ current: track, queueIndex: prev, positionMs: 0, durationMs: 0, isLoading: true });
  },
  reset: () =>
    set({
      current: null,
      queue: [],
      queueIndex: -1,
      isPlaying: false,
      isLoading: false,
      positionMs: 0,
      durationMs: 0,
      expanded: false,
      playbackError: null,
    }),
}));

export async function togglePlayback(): Promise<void> {
  await usePlayerStore.getState().handlers?.toggle();
}

export async function seekPlayback(positionMs: number): Promise<void> {
  await usePlayerStore.getState().handlers?.seek(positionMs);
}
