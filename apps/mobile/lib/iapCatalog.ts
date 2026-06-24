import type { PlanId } from "@producerhit/shared";

export type IapPaidPlan = Extract<PlanId, "pro" | "studio" | "plus">;

export type IapProductDef = {
  sku: string;
  plan: IapPaidPlan;
  /** Launch price in USD — instant UI fallback until StoreKit returns localized price. */
  storePriceUsd: number;
  anchorUsd: number;
  generations: number;
  groupLevel: 1 | 2 | 3;
  recommended?: boolean;
  bestValue?: boolean;
};

const DEFAULT_SKUS = {
  pro: "com.producerhit.app.pro.monthly",
  studio: "com.producerhit.app.studio.monthly",
  plus: "com.producerhit.app.plus.monthly",
} as const;

export const IAP_PRODUCTS: Record<IapPaidPlan, IapProductDef> = {
  pro: {
    sku: process.env.EXPO_PUBLIC_IAP_PRO_MONTHLY?.trim() || DEFAULT_SKUS.pro,
    plan: "pro",
    storePriceUsd: 6.99,
    anchorUsd: 12,
    generations: 75,
    groupLevel: 1,
  },
  studio: {
    sku: process.env.EXPO_PUBLIC_IAP_STUDIO_MONTHLY?.trim() || DEFAULT_SKUS.studio,
    plan: "studio",
    storePriceUsd: 19.99,
    anchorUsd: 32,
    generations: 250,
    groupLevel: 2,
    recommended: true,
  },
  plus: {
    sku: process.env.EXPO_PUBLIC_IAP_PLUS_MONTHLY?.trim() || DEFAULT_SKUS.plus,
    plan: "plus",
    storePriceUsd: 39.99,
    anchorUsd: 59,
    generations: 1000,
    groupLevel: 3,
    bestValue: true,
  },
};

export const IAP_PLAN_ORDER: readonly IapPaidPlan[] = ["pro", "studio", "plus"];

export const IAP_SUBSCRIPTION_SKUS = IAP_PLAN_ORDER.map((plan) => IAP_PRODUCTS[plan].sku);

export const DEFAULT_PAYWALL_PLAN: IapPaidPlan = "studio";

export function iapPlanFromSku(sku: string | null | undefined): IapPaidPlan | null {
  if (!sku) return null;
  const hit = IAP_PLAN_ORDER.find((plan) => IAP_PRODUCTS[plan].sku === sku);
  return hit ?? null;
}

export function parsePaywallPlanParam(value: string | string[] | undefined): IapPaidPlan {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "pro" || raw === "studio" || raw === "plus") return raw;
  return DEFAULT_PAYWALL_PLAN;
}

export function paywallHref(plan?: IapPaidPlan): "/paywall" | `/paywall?plan=${IapPaidPlan}` {
  if (!plan) return "/paywall";
  return `/paywall?plan=${plan}`;
}

export function anchorDiscountPercent(anchorUsd: number, storePriceUsd: number | null): number | null {
  if (!storePriceUsd || storePriceUsd <= 0 || anchorUsd <= storePriceUsd) return null;
  return Math.round((1 - storePriceUsd / anchorUsd) * 100);
}

/** Parse "$6.99" / "6,99 €" → number for badge math (approximate). */
export function formatCatalogStorePrice(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

/** Store price for UI: real StoreKit string when loaded, else catalog USD fallback. */
export function resolveTierStorePrice(
  pkg: { price?: string } | undefined,
  def: IapProductDef,
): string {
  const live = pkg?.price?.trim();
  if (live) return live;
  return formatCatalogStorePrice(def.storePriceUsd);
}

export function parseStorePriceNumber(displayPrice: string): number | null {
  const cleaned = displayPrice.replace(/[^\d.,]/g, "").replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}
