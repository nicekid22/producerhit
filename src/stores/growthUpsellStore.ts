import { create } from "zustand";
import type { UpsellContext, UpsellReason } from "@/lib/growthUpsell";

type GrowthUpsellState = {
  open: boolean;
  reason: UpsellReason | null;
  ctx: UpsellContext | null;
  openUpsell: (reason: UpsellReason, ctx?: UpsellContext) => void;
  closeUpsell: () => void;
};

export const useGrowthUpsellStore = create<GrowthUpsellState>((set) => ({
  open: false,
  reason: null,
  ctx: null,
  openUpsell: (reason, ctx = { source: "app" }) => set({ open: true, reason, ctx }),
  closeUpsell: () => set({ open: false, reason: null, ctx: null }),
}));
