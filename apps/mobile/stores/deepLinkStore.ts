import { create } from "zustand";

type DeepLinkState = {
  pendingLoopId: string | null;
  pendingPlayLoopId: string | null;
  setPendingLoopId: (id: string) => void;
  setPendingPlayLoopId: (id: string) => void;
  consumePendingLoopId: () => string | null;
  consumePendingPlayLoopId: () => string | null;
};

export const useDeepLinkStore = create<DeepLinkState>((set, get) => ({
  pendingLoopId: null,
  pendingPlayLoopId: null,
  setPendingLoopId: (id) => set({ pendingLoopId: id }),
  setPendingPlayLoopId: (id) => set({ pendingPlayLoopId: id }),
  consumePendingLoopId: () => {
    const id = get().pendingLoopId;
    if (id) set({ pendingLoopId: null });
    return id;
  },
  consumePendingPlayLoopId: () => {
    const id = get().pendingPlayLoopId;
    if (id) set({ pendingPlayLoopId: null });
    return id;
  },
}));
