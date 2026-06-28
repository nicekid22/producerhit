import { create } from "zustand";

export type AudioRetentionModalPayload = {
  expiredCount: number;
  plan: string;
  source: string;
};

type AudioRetentionModalState = {
  open: boolean;
  payload: AudioRetentionModalPayload | null;
  openModal: (payload: AudioRetentionModalPayload) => void;
  closeModal: () => void;
};

export const useAudioRetentionModalStore = create<AudioRetentionModalState>((set) => ({
  open: false,
  payload: null,
  openModal: (payload) => set({ open: true, payload }),
  closeModal: () => set({ open: false, payload: null }),
}));
