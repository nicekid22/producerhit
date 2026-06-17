import { create } from "zustand";
import type { PaidPlanId } from "@/lib/planEntitlements";

type PaidPlan = PaidPlanId;

type StripeCheckoutState = {
  open: boolean;
  clientSecret: string | null;
  returnUrl: string | null;
  plan: PaidPlan | null;
  openCheckout: (payload: { clientSecret: string; returnUrl: string; plan: PaidPlan }) => void;
  closeCheckout: () => void;
};

export const useStripeCheckoutStore = create<StripeCheckoutState>((set) => ({
  open: false,
  clientSecret: null,
  returnUrl: null,
  plan: null,
  openCheckout: ({ clientSecret, returnUrl, plan }) =>
    set({ open: true, clientSecret, returnUrl, plan }),
  closeCheckout: () => set({ open: false, clientSecret: null, returnUrl: null, plan: null }),
}));
