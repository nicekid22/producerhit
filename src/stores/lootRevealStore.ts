import { create } from "zustand";

export type LootRevealKind = "daily" | "level" | "referral";

export type LootRevealPayload = {
  kind: LootRevealKind;
  credits: number;
  xp?: number;
  level?: number;
  referralRole?: "referrer" | "referee";
};

type LootRevealState = {
  open: boolean;
  payload: LootRevealPayload | null;
  queue: LootRevealPayload[];
  showLoot: (payload: LootRevealPayload) => void;
  closeLoot: () => void;
};

export const useLootRevealStore = create<LootRevealState>((set, get) => ({
  open: false,
  payload: null,
  queue: [],
  showLoot: (payload) => {
    const { open } = get();
    if (open) {
      set({ queue: [...get().queue, payload] });
      return;
    }
    set({ open: true, payload });
  },
  closeLoot: () => {
    const queue = get().queue;
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      set({ open: true, payload: next, queue: rest });
      return;
    }
    set({ open: false, payload: null, queue: [] });
  },
}));
