import { create } from "zustand";
import type { Loop } from "@/types/loop";

type PlayerState = {
  current: Loop | null;
  isPlaying: boolean;
  progress: number;
  currentTimeSec: number;
  durationSec: number;
  loopEndSec: number | null;
  setCurrent: (loop: Loop, autoPlay: boolean) => void;
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
  seekToPct: null,
  setCurrent: (loop, autoPlay) =>
    set({
      current: loop,
      isPlaying: autoPlay,
      progress: 0,
      currentTimeSec: 0,
      durationSec: 0,
      loopEndSec: computeLoopEndSec(loop),
      seekToPct: 0,
    }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setProgress: (progress) => set({ progress }),
  setCurrentTime: (currentTimeSec) => set({ currentTimeSec }),
  setDuration: (durationSec) => set({ durationSec }),
  requestSeek: (pct) => set({ seekToPct: Math.max(0, Math.min(1, pct)) }),
  clearSeek: () => set({ seekToPct: null }),
}));

