import { create } from "zustand";
import type { PaidPlanId } from "@/lib/planEntitlements";
import type { CreditPackId } from "@/lib/creditPacks";

type PaidPlan = PaidPlanId;
export type CheckoutKind = "subscription" | "credit_pack";

type StripeCheckoutState = {
  open: boolean;
  clientSecret: string | null;
  returnUrl: string | null;
  plan: PaidPlan | null;
  kind: CheckoutKind;
  product: CreditPackId | null;
  openCheckout: (payload: {
    clientSecret: string;
    returnUrl: string;
    plan?: PaidPlan;
    kind?: CheckoutKind;
    product?: CreditPackId;
  }) => void;
  closeCheckout: () => void;
};

export const useStripeCheckoutStore = create<StripeCheckoutState>((set) => ({
  open: false,
  clientSecret: null,
  returnUrl: null,
  plan: null,
  kind: "subscription",
  product: null,
  openCheckout: ({ clientSecret, returnUrl, plan, kind = "subscription", product = null }) =>
    set({
      open: true,
      clientSecret,
      returnUrl,
      plan: plan ?? null,
      kind,
      product: product ?? null,
    }),
  closeCheckout: () =>
    set({
      open: false,
      clientSecret: null,
      returnUrl: null,
      plan: null,
      kind: "subscription",
      product: null,
    }),
}));
