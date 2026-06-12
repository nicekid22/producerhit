import toast from "react-hot-toast";
import { buildAuthUrl } from "@/lib/authRoutes";
import { supabase, trackClientEvent } from "@/lib/supabaseClient";
import { PLAN_RANK, type PaidPlanId, type PlanId, normalizePlanId } from "@/lib/planEntitlements";

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

function paidPlanLabel(plan: PaidPlan, locale: "en" | "fr"): string {
  const isFr = locale === "fr";
  if (plan === "plus") return "Plus";
  if (plan === "studio") return isFr ? "Studio" : "Studio";
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

type CheckoutPayload = {
  url?: string;
  mock?: boolean;
  message?: string;
  upgraded?: boolean;
  alreadySubscribed?: boolean;
  plan?: string;
};

type CheckoutOptions = {
  plan: PaidPlan;
  location: string;
  successUrl?: string;
  cancelUrl?: string;
  locale?: "en" | "fr";
};

export async function startCheckout({
  plan,
  location,
  successUrl = `${window.location.origin}/dashboard?upgraded=true`,
  cancelUrl = `${window.location.origin}/pricing`,
  locale = "en",
}: CheckoutOptions): Promise<boolean> {
  const isFr = locale === "fr";
  trackClientEvent("checkout_start", { plan, location });

  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { plan, successUrl, cancelUrl },
  });
  if (error) throw error;

  const payload = data as CheckoutPayload | null;
  if (payload?.mock) {
    toast(payload.message || (isFr ? "Stripe arrive bientôt — contacte le support." : "Stripe coming soon — contact support."));
    return false;
  }

  if (payload?.upgraded || payload?.alreadySubscribed) {
    window.location.href = successUrl;
    return true;
  }

  const url = payload?.url;
  if (url) {
    window.location.href = url;
    return true;
  }

  throw new Error("Missing checkout URL");
}

export async function runCheckoutWithAuth({
  plan,
  location,
  locale = "en",
}: {
  plan: PaidPlan;
  location: string;
  locale?: "en" | "fr";
}): Promise<void> {
  const isFr = locale === "fr";
  try {
    await startCheckout({ plan, location, locale });
  } catch (err) {
    const { status, message } = extractInvokeError(err);
    const lower = message.toLowerCase();
    if (status === 401 || lower.includes("not authenticated") || lower.includes("jwt") || lower.includes("auth")) {
      toast(isFr ? "Connecte-toi pour upgrader" : "Sign in to upgrade");
      window.location.href = buildAuthNextUrl(plan);
      return;
    }
    if (lower.includes("billing portal")) {
      toast(isFr ? "Utilise le portail de facturation pour changer de plan." : "Use the billing portal to change your plan.");
      window.location.href = "/settings";
      return;
    }
    toast.error(message || (isFr ? "Impossible de démarrer le paiement" : "Could not start checkout"));
  }
}

export async function openBillingPortal(returnUrl: string, locale: "en" | "fr" = "en"): Promise<void> {
  const isFr = locale === "fr";
  const { data, error } = await supabase.functions.invoke("create-portal", {
    body: { returnUrl },
  });
  if (error) throw error;
  const url = (data as { url?: string } | null)?.url;
  if (!url) throw new Error(isFr ? "Portail indisponible" : "Portal unavailable");
  window.location.href = url;
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
  locale: "en" | "fr",
  options?: { isLoggedIn?: boolean },
): PricingCtaMeta {
  const isFr = locale === "fr";
  const cur = normalizePlanId(currentPlan);
  const isLoggedIn = options?.isLoggedIn ?? false;

  if (tier === cur) {
    return {
      kind: "current",
      label: isFr ? "Plan actuel" : "Current plan",
      disabled: true,
      isPrimary: false,
    };
  }

  if (tier === "free") {
    if (!isLoggedIn) {
      return {
        kind: "start_free",
        label: isFr ? "Commencer gratuit" : "Start free",
        disabled: false,
        isPrimary: false,
      };
    }
    if (cur !== "free") {
      return {
        kind: "included",
        label: isFr ? "Inclus dans ton plan" : "Included in your plan",
        disabled: true,
        isPrimary: false,
      };
    }
    return {
      kind: "current",
      label: isFr ? "Plan actuel" : "Current plan",
      disabled: true,
      isPrimary: false,
    };
  }

  const paid = tier as PaidPlan;
  if (comparePlans(cur, paid) === "upgrade") {
    return {
      kind: "upgrade",
      label: isFr ? `Passer ${paidPlanLabel(paid, locale)}` : `Upgrade to ${paidPlanLabel(paid, locale)}`,
      disabled: false,
      isPrimary: true,
    };
  }

  return {
    kind: "included",
    label: isFr ? "Inclus dans ton plan" : "Included in your plan",
    disabled: true,
    isPrimary: false,
  };
}

export function pricingCtaLabel(
  tier: PlanTier,
  currentPlan: string | null | undefined,
  locale: "en" | "fr",
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
