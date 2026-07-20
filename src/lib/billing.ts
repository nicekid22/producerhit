import toast from "react-hot-toast";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { buildAuthUrl } from "@/lib/authRoutes";
import { clearCheckoutAbandoned } from "@/lib/checkoutRecovery";
import { supabase, trackClientEvent } from "@/lib/supabaseClient";
import { PLAN_RANK, type PaidPlanId, type PlanId, normalizePlanId } from "@/lib/planEntitlements";
import { useStripeCheckoutStore } from "@/stores/stripeCheckoutStore";
import { useVisualThemeStore } from "@/stores/visualThemeStore";
import { useCloudAccentStore } from "@/stores/cloudAccentStore";

import type { AppLocale } from "@/i18n/config";
import { buildBillingSection } from "@/i18n/systemCatalog";
import type { CreditPackId } from "@/lib/creditPacks";
import { getCreditPack } from "@/lib/creditPacks";
import type { BillingInterval } from "@/lib/billingInterval";
export type PaidPlan = PaidPlanId;
export type PlanTier = PlanId;

export function normalizePlan(plan: string | null | undefined): PlanTier {
  return normalizePlanId(plan);
}

export function planRank(plan: string | null | undefined): number {
  return PLAN_RANK[normalizePlanId(plan)];
}

export function comparePlans(current: string | null | undefined, target: PaidPlan): "same" | "upgrade" | "downgrade" {
  const cur = normalizePlanId(current);
  if (cur === target) return "same";
  return PLAN_RANK[target] > PLAN_RANK[cur] ? "upgrade" : "downgrade";
}

function paidPlanLabel(plan: PaidPlan, _locale: AppLocale): string {
  if (plan === "plus") return "Plus";
  if (plan === "studio") return "Studio";
  return "Pro";
}

export function buildPricingUrl(plan?: PaidPlan, autoCheckout = false): string {
  if (!plan) return "/pricing";
  const params = new URLSearchParams({ plan });
  if (autoCheckout) params.set("checkout", "1");
  return `/pricing?${params.toString()}`;
}

export function buildAuthNextUrl(plan: PaidPlan): string {
  return buildAuthUrl({ next: buildPricingUrl(plan, true) });
}

/** Lit `?next=/pricing?plan=pro&checkout=1` après redirection auth. */
export function parseCheckoutIntentFromNext(next: string | null | undefined): PaidPlan | null {
  if (!next?.trim()) return null;
  const raw = next.trim();
  const qIndex = raw.indexOf("?");
  if (qIndex === -1) return null;
  const params = new URLSearchParams(raw.slice(qIndex + 1));
  if (params.get("checkout") !== "1") return null;
  const plan = params.get("plan");
  if (plan === "pro" || plan === "studio" || plan === "plus") return plan;
  return null;
}

export function extractInvokeError(err: unknown): { status?: number; message: string } {
  const e = err as
    | (Error & { context?: { status?: unknown; body?: unknown } })
    | { message?: unknown; context?: { status?: unknown; body?: unknown }; status?: unknown }
    | null;

  const status =
    (typeof e === "object" && e && typeof (e as { status?: unknown }).status === "number" ? (e as { status: number }).status : undefined) ??
    (typeof e === "object" && e && typeof e.context?.status === "number" ? e.context.status : undefined);

  let message =
    err instanceof Error
      ? err.message
      : typeof (e as { message?: unknown } | null)?.message === "string"
        ? String((e as { message?: unknown }).message)
        : "Could not start checkout — try again";

  const body = typeof e === "object" && e ? e.context?.body : undefined;
  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body) as { error?: unknown };
      if (typeof parsed?.error === "string") message = parsed.error;
    } catch {
      if (body.trim()) message = body;
    }
  } else if (body && typeof body === "object") {
    const parsed = body as { error?: unknown };
    if (typeof parsed?.error === "string") message = parsed.error;
  }

  return { status, message };
}

async function readCheckoutPayload(data: unknown, error: unknown): Promise<CheckoutPayload> {
  if (data && typeof data === "object") {
    const payload = data as CheckoutPayload;
    if (payload.error || payload.clientSecret || payload.url || payload.mock || payload.upgraded) {
      return payload;
    }
  }

  // Handle Supabase FunctionsHttpError (legacy)
  if (error instanceof FunctionsHttpError) {
    try {
      return (await error.context.json()) as CheckoutPayload;
    } catch {
      return {};
    }
  }

  // Handle plain Error from Firebase compat layer — try to parse JSON body from message
  if (error instanceof Error && error.message) {
    try {
      const parsed = JSON.parse(error.message) as CheckoutPayload;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // not JSON, fall through
    }
  }

  return (data ?? {}) as CheckoutPayload;
}

type CheckoutPayload = {
  url?: string;
  clientSecret?: string;
  uiMode?: string;
  fallback?: boolean;
  mock?: boolean;
  message?: string;
  upgraded?: boolean;
  alreadySubscribed?: boolean;
  plan?: string;
  error?: string;
  code?: string | null;
};

type CheckoutOptions = {
  plan: PaidPlan;
  location: string;
  successUrl?: string;
  cancelUrl?: string;
  locale?: AppLocale;
  billingInterval?: BillingInterval;
};

export async function startCheckout({
  plan,
  location,
  successUrl = `${window.location.origin}/dashboard?upgraded=true`,
  cancelUrl = `${window.location.origin}/pricing?checkout=cancelled&plan=${plan}`,
  locale = "en",
  billingInterval = "month",
}: CheckoutOptions): Promise<boolean> {
  const b = buildBillingSection(locale);
  trackClientEvent("checkout_start", { plan, location, ui_mode: "embedded", billing_interval: billingInterval });

  const visualTheme = useVisualThemeStore.getState().theme;
  const cloudAccent = useCloudAccentStore.getState().accent;

  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: {
      plan,
      successUrl,
      cancelUrl,
      uiMode: "embedded",
      visualTheme,
      cloudAccent,
      locale,
      billingInterval,
      checkoutRecovery: location === "checkout_recovery",
    },
  });

  const payload = await readCheckoutPayload(data, error);

  if (payload.error) {
    throw new Error(payload.error);
  }
  if (error && !payload.clientSecret && !payload.url && !payload.mock && !payload.upgraded) {
    throw error;
  }
  if (payload.mock) {
    toast(payload.message || b.stripeComingSoon);
    return false;
  }

  if (payload.upgraded || payload.alreadySubscribed) {
    clearCheckoutAbandoned();
    window.location.href = successUrl;
    return true;
  }

  const clientSecret = payload.clientSecret;
  if (clientSecret) {
    if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      throw new Error(b.missingPublishableKey);
    }
    useStripeCheckoutStore.getState().openCheckout({ clientSecret, returnUrl: successUrl, plan });
    return true;
  }

  const url = payload.url;
  if (url) {
    if (payload.fallback) {
      toast(b.checkoutFallback);
    }
    window.location.href = url;
    return true;
  }

  throw new Error("Missing checkout session");
}

export async function runCheckoutWithAuth({
  plan,
  location,
  locale = "en",
  billingInterval = "month",
}: {
  plan: PaidPlan;
  location: string;
  locale?: AppLocale;
  billingInterval?: BillingInterval;
}): Promise<void> {
  const b = buildBillingSection(locale);
  try {
    await startCheckout({ plan, location, locale, billingInterval });
  } catch (err) {
    const { status, message } = extractInvokeError(err);
    const lower = message.toLowerCase();
    if (status === 401 || lower.includes("not authenticated") || lower.includes("jwt") || lower.includes("auth")) {
      toast(b.signInToUpgrade);
      window.location.href = buildAuthNextUrl(plan);
      return;
    }
    if (lower.includes("billing portal")) {
      toast(b.useBillingPortal);
      window.location.href = "/settings";
      return;
    }
    if (
      status === 503 ||
      lower.includes("failed to send a request") ||
      lower.includes("edge function") ||
      lower.includes("non-2xx")
    ) {
      toast.error(b.checkoutUnavailable);
      return;
    }
    toast.error(message || b.checkoutStartFailed);
  }
}

type CreditPackCheckoutOptions = {
  product: CreditPackId;
  location: string;
  successUrl?: string;
  cancelUrl?: string;
  locale?: AppLocale;
};

export async function startCreditPackCheckout({
  product,
  location,
  successUrl = `${window.location.origin}/dashboard?credits_purchased=1`,
  cancelUrl = `${window.location.origin}/pricing?checkout=cancelled&product=${product}`,
  locale = "en",
}: CreditPackCheckoutOptions): Promise<boolean> {
  const b = buildBillingSection(locale);
  const pack = getCreditPack(product);
  trackClientEvent("credit_pack_checkout_start", { product, location, credits: pack.credits });

  const visualTheme = useVisualThemeStore.getState().theme;
  const cloudAccent = useCloudAccentStore.getState().accent;

  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: {
      product,
      successUrl,
      cancelUrl,
      uiMode: "embedded",
      visualTheme,
      cloudAccent,
      locale,
    },
  });

  const payload = await readCheckoutPayload(data, error);

  if (payload.error) {
    throw new Error(payload.error);
  }
  if (error && !payload.clientSecret && !payload.url && !payload.mock) {
    throw error;
  }
  if (payload.mock) {
    toast(payload.message || b.stripeComingSoon);
    return false;
  }

  const clientSecret = payload.clientSecret;
  if (clientSecret) {
    if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      throw new Error(b.missingPublishableKey);
    }
    useStripeCheckoutStore.getState().openCheckout({
      clientSecret,
      returnUrl: successUrl,
      kind: "credit_pack",
      product,
    });
    return true;
  }

  const url = payload.url;
  if (url) {
    if (payload.fallback) toast(b.checkoutFallback);
    window.location.href = url;
    return true;
  }

  throw new Error("Missing checkout session");
}

export async function runCreditPackCheckout({
  product,
  location,
  locale = "en",
}: {
  product: CreditPackId;
  location: string;
  locale?: AppLocale;
}): Promise<void> {
  const b = buildBillingSection(locale);
  try {
    await startCreditPackCheckout({ product, location, locale });
  } catch (err) {
    const { status, message } = extractInvokeError(err);
    const lower = message.toLowerCase();
    if (status === 401 || lower.includes("not authenticated") || lower.includes("jwt") || lower.includes("auth")) {
      toast(b.signInToUpgrade);
      window.location.href = buildAuthUrl({ next: `/pricing?pack=${product}` });
      return;
    }
    if (
      status === 503 ||
      lower.includes("failed to send a request") ||
      lower.includes("edge function") ||
      lower.includes("non-2xx")
    ) {
      toast.error(b.checkoutUnavailable);
      return;
    }
    toast.error(message || b.checkoutStartFailed);
  }
}

/** Poll profile until purchased_bonus increases after credit pack payment. */
export async function waitForCreditPackActivation(
  refreshProfile: () => Promise<{ purchased_bonus?: number | null } | null>,
  previousPurchasedBonus: number,
  maxAttempts = 12,
  delayMs = 1000,
): Promise<number | null> {
  for (let i = 0; i < maxAttempts; i += 1) {
    const profile = await refreshProfile().catch(() => null);
    const purchased = profile?.purchased_bonus ?? 0;
    if (purchased > previousPurchasedBonus) return purchased;
    if (i < maxAttempts - 1) {
      await new Promise((r) => window.setTimeout(r, delayMs));
    }
  }
  return null;
}

export async function openBillingPortal(returnUrl: string, locale: AppLocale = "en"): Promise<void> {
  const b = buildBillingSection(locale);
  const { data, error } = await supabase.functions.invoke("create-portal", {
    body: { returnUrl },
  });
  if (error) throw error;
  const url = (data as { url?: string } | null)?.url;
  if (!url) throw new Error(b.portalUnavailable);
  window.location.href = url;
}

/** Extract Checkout Session ID from embedded client secret (`cs_…_secret_…`). */
export function checkoutSessionIdFromClientSecret(clientSecret: string): string | null {
  const marker = "_secret_";
  const idx = clientSecret.indexOf(marker);
  if (idx <= 0) return null;
  const id = clientSecret.slice(0, idx);
  return id.startsWith("cs_") ? id : null;
}

/** Backup activation when webhook is delayed — idempotent profile update from Stripe session. */
export async function confirmCheckoutSession(sessionId: string): Promise<{ ok: boolean; plan?: string }> {
  const { data, error } = await supabase.functions.invoke("confirm-checkout", {
    body: { sessionId },
  });
  if (error) {
    const { message } = extractInvokeError(error);
    throw new Error(message);
  }
  return (data ?? {}) as { ok: boolean; plan?: string; pending?: boolean };
}

/** Poll profile until paid plan is active (webhook or confirm-checkout). */
export async function waitForPlanActivation(
  refreshProfile: () => Promise<{ plan?: string | null } | null>,
  expectedPlan?: string,
  maxAttempts = 10,
  delayMs = 1200,
): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      await supabase.rpc("sync_profile_plan_from_billing");
    } catch {
      /* best-effort sync */
    }
    const profile = await refreshProfile().catch(() => null);
    const activePlan = profile?.plan ?? null;
    if (activePlan && activePlan !== "free") {
      if (!expectedPlan || activePlan === expectedPlan || planRank(activePlan) >= planRank(expectedPlan)) {
        return activePlan;
      }
    }
    if (i < maxAttempts - 1) {
      await new Promise((r) => window.setTimeout(r, delayMs));
    }
  }
  return null;
}

export type PricingCtaKind = "current" | "upgrade" | "start_free" | "included";

export type PricingCtaMeta = {
  kind: PricingCtaKind;
  label: string;
  disabled: boolean;
  isPrimary: boolean;
};

export function isRecommendedPlan(tier: PlanTier, currentPlan: string | null | undefined): boolean {
  const cur = normalizePlanId(currentPlan);
  if (cur === "free" && tier === "pro") return true;
  if (cur === "pro" && tier === "studio") return true;
  if (cur === "studio" && tier === "plus") return true;
  return false;
}

export function pricingCtaMeta(
  tier: PlanTier,
  currentPlan: string | null | undefined,
  locale: AppLocale,
  options?: { isLoggedIn?: boolean },
): PricingCtaMeta {
  const b = buildBillingSection(locale);
  const cur = normalizePlanId(currentPlan);
  const isLoggedIn = options?.isLoggedIn ?? false;

  if (tier === cur) {
    return {
      kind: "current",
      label: b.currentPlan,
      disabled: true,
      isPrimary: false,
    };
  }

  if (tier === "free") {
    if (!isLoggedIn) {
      return {
        kind: "start_free",
        label: b.startFree,
        disabled: false,
        isPrimary: false,
      };
    }
    if (cur !== "free") {
      return {
        kind: "included",
        label: b.includedInPlan,
        disabled: true,
        isPrimary: false,
      };
    }
    return {
      kind: "current",
      label: b.currentPlan,
      disabled: true,
      isPrimary: false,
    };
  }

  const paid = tier as PaidPlan;
  if (comparePlans(cur, paid) === "upgrade") {
    return {
      kind: "upgrade",
      label: `${b.upgradeTo}${paidPlanLabel(paid, locale)}`,
      disabled: false,
      isPrimary: true,
    };
  }

  return {
    kind: "included",
    label: b.includedInPlan,
    disabled: true,
    isPrimary: false,
  };
}

export function pricingCtaLabel(
  tier: PlanTier,
  currentPlan: string | null | undefined,
  locale: AppLocale,
  isLoggedIn = false,
): string {
  return pricingCtaMeta(tier, currentPlan, locale, { isLoggedIn }).label;
}

export function pricingCtaHref(
  tier: PlanTier,
  currentPlan: string | null | undefined,
  isLoggedIn: boolean,
): string {
  const meta = pricingCtaMeta(tier, currentPlan, "en", { isLoggedIn });

  if (meta.kind === "current" || meta.kind === "included") return "/settings";
  if (meta.kind === "start_free") return isLoggedIn ? "/dashboard" : "/auth";
  if (isLoggedIn) return buildPricingUrl(tier as PaidPlan, true);
  return buildAuthNextUrl(tier as PaidPlan);
}
