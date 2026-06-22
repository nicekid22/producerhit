import { create } from "zustand";
import type { Loop } from "@producerhit/shared";

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
  handlers: PlaybackHandlers | null;
  setCurrent: (loop: Loop | null, queue?: Loop[]) => void;
  setPlaying: (playing: boolean) => void;
  setLoading: (loading: boolean) => void;
  setPositionMs: (ms: number) => void;
  setDurationMs: (ms: number) => void;
  setExpanded: (expanded: boolean) => void;
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
  handlers: null,
  setCurrent: (current, queue) => {
    const list = queue ?? (current ? [current] : []);
    const index = current ? list.findIndex((l) => l.id === current.id) : -1;
    set({
      current,
      queue: list,
      queueIndex: index >= 0 ? index : list.length ? 0 : -1,
      positionMs: 0,
      durationMs: 0,
    });
  },
  setPlaying: (isPlaying) => set({ isPlaying }),
  setLoading: (isLoading) => set({ isLoading }),
  setPositionMs: (positionMs) => set({ positionMs }),
  setDurationMs: (durationMs) => set({ durationMs }),
  setExpanded: (expanded) => set({ expanded }),
  registerHandlers: (handlers) => set({ handlers }),
  playNext: () => {
    const { queue, queueIndex } = get();
    if (queue.length < 2) return;
    const next = (queueIndex + 1) % queue.length;
    set({ current: queue[next], queueIndex: next, positionMs: 0, durationMs: 0 });
  },
  playPrev: () => {
    const { queue, queueIndex, positionMs } = get();
    if (queue.length < 2) return;
    if (positionMs > 3000) {
      void get().handlers?.seek(0);
      return;
    }
    const prev = queueIndex <= 0 ? queue.length - 1 : queueIndex - 1;
    set({ current: queue[prev], queueIndex: prev, positionMs: 0, durationMs: 0 });
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
    }),
}));

export async function togglePlayback(): Promise<void> {
  await usePlayerStore.getState().handlers?.toggle();
}

export async function seekPlayback(positionMs: number): Promise<void> {
  await usePlayerStore.getState().handlers?.seek(positionMs);
}
