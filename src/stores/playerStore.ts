import { create } from "zustand";
import type { Loop } from "@/types/loop";

const DOCK_COLLAPSED_KEY = "producerhit_player_docked_collapsed";

function readDockCollapsed(): boolean {
  try {
    return localStorage.getItem(DOCK_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function persistDockCollapsed(value: boolean) {
  try {
    localStorage.setItem(DOCK_COLLAPSED_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

type PlayerState = {
  current: Loop | null;
  isPlaying: boolean;
  progress: number;
  currentTimeSec: number;
  durationSec: number;
  loopEndSec: number | null;
  queue: Loop[];
  queueIndex: number;
  queueSource: string | null;
  setCurrent: (loop: Loop, autoPlay: boolean) => void;
  setQueue: (loops: Loop[], startIndex: number, autoPlay: boolean, source?: string) => void;
  mergeQueue: (loops: Loop[], source?: string) => void;
  promoteLoop: (fromId: string, loop: Loop) => void;
  next: () => void;
  prev: () => void;
  clearQueue: () => void;
  setPlaying: (playing: boolean) => void;
  setProgress: (progress: number) => void;
  setCurrentTime: (currentTimeSec: number) => void;
  setDuration: (durationSec: number) => void;
  seekToPct: number | null;
  requestSeek: (pct: number) => void;
  clearSeek: () => void;
  dockCollapsed: boolean;
  setDockCollapsed: (collapsed: boolean) => void;
  toggleDockCollapsed: () => void;
};

function barsFromLoopLength(loopLength: string) {
  const n = Number(loopLength.split(" ")[0]);
  return Number.isFinite(n) && n > 0 ? n : 4;
}

function computeLoopEndSec(loop: Loop) {
  const bars = barsFromLoopLength(loop.loopLength);
  const bpm = Math.max(60, Math.min(200, loop.bpm));
  const sec = (bars * 4 * 60) / bpm;
  return Math.max(3, Math.min(60, sec));
}

function playableLoops(loops: Loop[]) {
  return (loops ?? []).filter(
    (l) => l && typeof l.id === "string" && typeof l.audioUrl === "string" && l.audioUrl.trim().length > 0,
  );
}

/** Play one loop, optionally within a list so prev/next and auto-advance work. */
export function playLoopInContext(loop: Loop, context: Loop[] | undefined, autoPlay: boolean, source = "context") {
  const store = usePlayerStore.getState();
  const base = context ?? [];
  const merged = [loop, ...base.filter((l) => l.id !== loop.id)];
  const clean = playableLoops(merged);
  if (clean.length <= 1) {
    store.setCurrent(loop, autoPlay);
    return;
  }
  const idx = clean.findIndex((l) => l.id === loop.id);
  store.setQueue(clean, idx >= 0 ? idx : 0, autoPlay, source);
}

export const usePlayerStore = create<PlayerState>((set) => ({
  current: null,
  isPlaying: false,
  progress: 0,
  currentTimeSec: 0,
  durationSec: 0,
  loopEndSec: null,
  queue: [],
  queueIndex: 0,
  queueSource: null,
  seekToPct: null,
  dockCollapsed: readDockCollapsed(),
  setDockCollapsed: (collapsed) => {
    persistDockCollapsed(collapsed);
    set({ dockCollapsed: collapsed });
  },
  toggleDockCollapsed: () => {
    const next = !usePlayerStore.getState().dockCollapsed;
    persistDockCollapsed(next);
    set({ dockCollapsed: next });
  },
  setCurrent: (loop, autoPlay) =>
    set({
      current: loop,
      isPlaying: autoPlay,
      progress: 0,
      currentTimeSec: 0,
      durationSec: 0,
      loopEndSec: computeLoopEndSec(loop),
      queue: [],
      queueIndex: 0,
      queueSource: null,
      seekToPct: 0,
    }),
  setQueue: (loops, startIndex, autoPlay, source) =>
    set(() => {
      const clean = playableLoops(loops ?? []);
      const idx = Math.max(0, Math.min(clean.length - 1, startIndex));
      const current = clean[idx] ?? null;
      return {
        current,
        isPlaying: Boolean(autoPlay && current),
        progress: 0,
        currentTimeSec: 0,
        durationSec: 0,
        loopEndSec: current ? computeLoopEndSec(current) : null,
        queue: clean,
        queueIndex: idx,
        queueSource: typeof source === "string" ? source : null,
        seekToPct: 0,
      };
    }),
  mergeQueue: (loops, source) =>
    set((s) => {
      const clean = playableLoops(loops ?? []);
      if (!clean.length) return s;

      const currentId = s.current?.id;
      const currentUrl = typeof s.current?.audioUrl === "string" ? s.current.audioUrl.trim() : "";
      let idx = currentId ? clean.findIndex((l) => l.id === currentId) : Math.min(s.queueIndex, clean.length - 1);
      if (idx < 0 && currentUrl) {
        idx = clean.findIndex((l) => l.audioUrl?.trim() === currentUrl);
      }
      const queueIndex = idx >= 0 ? idx : 0;
      const current = clean[queueIndex] ?? s.current;
      const keepPlaying = s.isPlaying && Boolean(current);

      return {
        queue: clean,
        queueIndex,
        queueSource: typeof source === "string" ? source : s.queueSource,
        current: current ?? s.current,
        isPlaying: keepPlaying,
        loopEndSec: current ? computeLoopEndSec(current) : s.loopEndSec,
      };
    }),
  promoteLoop: (fromId, loop) =>
    set((s) => {
      if (!fromId || fromId === loop.id) return s;
      const inQueue = s.queue.some((l) => l.id === fromId);
      const isCurrent = s.current?.id === fromId;
      if (!inQueue && !isCurrent) return s;
      const queue = inQueue ? s.queue.map((l) => (l.id === fromId ? loop : l)) : s.queue;
      const current = isCurrent ? loop : s.current;
      return {
        ...s,
        queue,
        current,
        loopEndSec: current ? computeLoopEndSec(current) : s.loopEndSec,
      };
    }),
  next: () =>
    set((s) => {
      if (!s.queue.length) return s;
      const idx = Math.min(s.queue.length - 1, s.queueIndex + 1);
      const next = s.queue[idx] ?? null;
      if (!next || next.id === s.current?.id) return s;
      return {
        ...s,
        current: next,
        isPlaying: true,
        progress: 0,
        currentTimeSec: 0,
        durationSec: 0,
        loopEndSec: computeLoopEndSec(next),
        queueIndex: idx,
        seekToPct: 0,
      };
    }),
  prev: () =>
    set((s) => {
      if (!s.queue.length) return s;
      const idx = Math.max(0, s.queueIndex - 1);
      const prev = s.queue[idx] ?? null;
      if (!prev || prev.id === s.current?.id) return s;
      return {
        ...s,
        current: prev,
        isPlaying: true,
        progress: 0,
        currentTimeSec: 0,
        durationSec: 0,
        loopEndSec: computeLoopEndSec(prev),
        queueIndex: idx,
        seekToPct: 0,
      };
    }),
  clearQueue: () => set({ queue: [], queueIndex: 0, queueSource: null }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setProgress: (progress) => set({ progress }),
  setCurrentTime: (currentTimeSec) => set({ currentTimeSec }),
  setDuration: (durationSec) => set({ durationSec }),
  requestSeek: (pct) => set({ seekToPct: Math.max(0, Math.min(1, pct)) }),
  clearSeek: () => set({ seekToPct: null }),
}));

