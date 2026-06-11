import { create } from "zustand";
import type { UpsellContext, UpsellReason } from "@/lib/growthUpsell";
import { trackClientEvent } from "@/lib/supabaseClient";

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
  openUpsell: (reason, ctx = { source: "app" }) => {
    trackClientEvent("upgrade_prompt_shown", {
      reason,
      source: ctx.source ?? "app",
      plan: ctx.plan ?? "free",
    });
    set({ open: true, reason, ctx });
  },
  closeUpsell: () => set({ open: false, reason: null, ctx: null }),
}));
