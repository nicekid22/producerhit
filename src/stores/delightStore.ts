import { create } from "zustand";

export type WowBanner = {
  id: string;
  title: string;
  subtitle?: string;
  emoji: string;
  variant: "violet" | "cyan" | "gold";
};

type DelightState = {
  banner: WowBanner | null;
  showBanner: (banner: WowBanner) => void;
  clearBanner: () => void;
};

export const useDelightStore = create<DelightState>((set) => ({
  banner: null,
  showBanner: (banner) => set({ banner }),
  clearBanner: () => set({ banner: null }),
}));
