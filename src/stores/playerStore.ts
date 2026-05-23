import { create } from "zustand";
import type { Loop } from "@/types/loop";

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
      const clean = (loops ?? []).filter((l) => l && typeof l.id === "string" && typeof l.audioUrl === "string" && l.audioUrl.trim().length > 0);
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

