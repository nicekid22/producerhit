// createCheckout.ts — Firebase Cloud Function (Node.js)
// Port of supabase/functions/create-checkout/index.ts

import * as functions from "firebase-functions";
import { fbGetProfile, fbUpdateProfile, fbRegisterStripeCustomer } from "./firestore";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLAN_NAMES: Record<string, string> = { pro: "Pro", studio: "Studio", plus: "Plus" };
const PAID_PLANS = new Set(["pro", "studio", "plus"]);
const CREDIT_PACKS: Record<string, { credits: number; label: string }> = {
  credit_pack_50: { credits: 50, label: "50 generations" },
};

function planRank(plan: string): number {
  if (plan === "plus") return 3;
  if (plan === "studio") return 2;
  if (plan === "pro") return 1;
  return 0;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// ---------------------------------------------------------------------------
// Stripe helpers (REST API)
// ---------------------------------------------------------------------------

async function fetchSubscription(stripeKey: string, subscriptionId: string): Promise<Record<string, unknown>> {
  const fetch = (await import("node-fetch")).default;
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) {
    const msg =
      json && typeof json === "object" && "error" in json
        ? String((json as { error?: { message?: unknown } }).error?.message ?? "Stripe subscription fetch failed")
        : "Stripe subscription fetch failed";
    throw new functions.https.HttpsError("internal", msg);
  }
  return json ?? {};
}

async function upgradeExistingSubscription(
  stripeKey: string,
  subscriptionId: string,
  priceId: string,
  plan: string,
  userId: string,
): Promise<Record<string, unknown>> {
  const fetch = (await import("node-fetch")).default;
  const sub = await fetchSubscription(stripeKey, subscriptionId);
  const status = asString(sub.status);
  if (status !== "active" && status !== "trialing") {
    throw new functions.https.HttpsError("failed-precondition", "Subscription is not active");
  }

  const items = (sub.items as { data?: unknown } | undefined)?.data;
  const firstItem =
    Array.isArray(items) && items[0] && typeof items[0] === "object" ? (items[0] as Record<string, unknown>) : null;
  const itemId = asString(firstItem?.id);
  if (!itemId) throw new functions.https.HttpsError("internal", "Missing subscription item");

  const params = new URLSearchParams({
    "items[0][id]": itemId,
    "items[0][price]": priceId,
    proration_behavior: "create_prorations",
    "metadata[plan]": plan,
    "metadata[firebase_uid]": userId,
    "metadata[price_id]": priceId,
  });

  const updateRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const updateJson = (await updateRes.json().catch(() => null)) as Record<string, unknown> | null;
  if (!updateRes.ok) {
    const msg =
      updateJson && typeof updateJson === "object" && "error" in updateJson
        ? String(
            (updateJson as { error?: { message?: unknown } }).error?.message ??
              "Stripe subscription update failed",
          )
        : "Stripe subscription update failed";
    throw new functions.https.HttpsError("internal", msg);
  }
  return updateJson ?? {};
}

function subscriptionPriceId(sub: Record<string, unknown>): string {
  const items = (sub.items as { data?: unknown } | undefined)?.data;
  const firstItem =
    Array.isArray(items) && items[0] && typeof items[0] === "object" ? (items[0] as Record<string, unknown>) : null;
  const price = firstItem && typeof firstItem.price === "object" ? (firstItem.price as Record<string, unknown>) : null;
  return asString(price?.id);
}

async function syncProfilePlanFB(
  userId: string,
  plan: string,
  customerId: string,
  subscriptionId: string,
  priceId: string,
  currentPeriodEnd: number | null,
): Promise<void> {
  const periodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;
  await fbUpdateProfile(userId, {
    plan,
    stripe_customer_id: customerId || undefined,
    stripe_subscription_id: subscriptionId,
    stripe_price_id: priceId || undefined,
    stripe_current_period_end: periodEndIso || undefined,
  });
  if (customerId) {
    await fbRegisterStripeCustomer(userId, customerId);
  }
}

function planFromEnvPriceId(
  priceId: string,
  pricePro: string,
  priceStudio: string,
  pricePlus: string,
  priceProAnnual: string,
  priceStudioAnnual: string,
  pricePlusAnnual: string,
): string {
  if (priceId && (priceId === pricePro || priceId === priceProAnnual)) return "pro";
  if (priceId && (priceId === priceStudio || priceId === priceStudioAnnual)) return "studio";
  if (priceId && (priceId === pricePlus || priceId === pricePlusAnnual)) return "plus";
  return "free";
}

function priceIdForPlan(
  plan: string,
  interval: string,
  pricePro: string,
  priceStudio: string,
  pricePlus: string,
  priceProAnnual: string,
  priceStudioAnnual: string,
  pricePlusAnnual: string,
): string {
  const annual = interval === "year";
  if (plan === "pro") return annual ? priceProAnnual : pricePro;
  if (plan === "studio") return annual ? priceStudioAnnual : priceStudio;
  if (plan === "plus") return annual ? pricePlusAnnual : pricePlus;
  return "";
}

async function clearStaleBillingFB(userId: string): Promise<void> {
  await fbUpdateProfile(userId, {
    plan: "free",
    stripe_subscription_id: undefined,
    stripe_price_id: undefined,
    stripe_current_period_end: undefined,
  });
}

// ---------------------------------------------------------------------------
// Stripe Checkout Session creation
// ---------------------------------------------------------------------------

type StripeSessionResult = {
  ok: boolean;
  session: {
    id?: unknown;
    url?: unknown;
    client_secret?: unknown;
    error?: { message?: unknown; type?: unknown; code?: unknown };
  } | null;
};

async function createStripeCheckoutSession(
  stripeKey: string,
  params: URLSearchParams,
  stripeVersion?: string,
): Promise<StripeSessionResult> {
  const fetch = (await import("node-fetch")).default;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${stripeKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (stripeVersion) headers["Stripe-Version"] = stripeVersion;

  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers,
    body: params.toString(),
  });

  const session = (await stripeRes.json().catch(() => null)) as StripeSessionResult["session"];
  return { ok: stripeRes.ok, session };
}

function stripeErrorMessage(session: StripeSessionResult["session"]): string {
  return typeof session?.error?.message === "string" ? session.error.message : "Stripe error";
}

// ---------------------------------------------------------------------------
// Branding
// ---------------------------------------------------------------------------

function brandingPalette(
  visualTheme: string,
  cloudAccent: string,
  plan: string,
): { background: string; button: string } {
  if (visualTheme === "cloud") {
    const buttons: Record<string, string> = {
      transparent: "#8a9cff",
      green: "#7ec850",
      red: "#e87858",
      blue: "#58a8e8",
    };
    return { background: "#f5f5f7", button: buttons[cloudAccent] ?? buttons.transparent };
  }
  if (visualTheme === "warm-glass") {
    return { background: "#261008", button: "#d4845a" };
  }
  return {
    background: "#0f0d18",
    button: plan === "pro" ? "#5eb8ff" : "#9d7cff",
  };
}

function applyCheckoutBranding(
  params: URLSearchParams,
  plan: string,
  visualTheme: string,
  cloudAccent: string,
): void {
  const palette = brandingPalette(visualTheme, cloudAccent, plan);
  params.set("branding_settings[background_color]", palette.background);
  params.set("branding_settings[button_color]", palette.button);
  params.set("branding_settings[font_family]", "inter");
  params.set("branding_settings[border_style]", "rounded");
  params.set("branding_settings[display_name]", "ProducerHit");
}

function stripCheckoutBranding(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const key of [...next.keys()]) {
    if (key.startsWith("branding_settings")) next.delete(key);
  }
  return next;
}

function buildEmbeddedReturnUrl(successUrl: string): string {
  if (successUrl.includes("{CHECKOUT_SESSION_ID}")) return successUrl;
  const join = successUrl.includes("?") ? "&" : "?";
  return `${successUrl}${join}session_id={CHECKOUT_SESSION_ID}`;
}

// ---------------------------------------------------------------------------
// Build checkout params
// ---------------------------------------------------------------------------

function buildCreditPackCheckoutParams(
  priceId: string,
  product: string,
  credits: number,
  userId: string,
  customerId: string,
  customerEmail: string,
  visualTheme: string,
  cloudAccent: string,
  locale: string,
): URLSearchParams {
  const params = new URLSearchParams({
    mode: "payment",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    allow_promotion_codes: "true",
    client_reference_id: userId,
    "metadata[credit_pack]": product,
    "metadata[credits]": String(credits),
    "metadata[firebase_uid]": userId,
    "metadata[price_id]": priceId,
  });
  if (customerId) params.set("customer", customerId);
  else if (customerEmail) params.set("customer_email", customerEmail);
  params.set("locale", locale === "fr" ? "fr" : "auto");
  if (locale === "fr") {
    params.set("custom_text[submit][message]", "Confirmer l'achat");
  }
  applyCheckoutBranding(params, "pro", visualTheme, cloudAccent);
  return params;
}

function buildBaseCheckoutParams(
  priceId: string,
  plan: string,
  userId: string,
  customerId: string,
  customerEmail: string,
  visualTheme: string,
  cloudAccent: string,
  locale: string,
  checkoutRecovery = false,
): URLSearchParams {
  const params = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    allow_promotion_codes: "true",
    client_reference_id: userId,
    "metadata[plan]": plan,
    "metadata[firebase_uid]": userId,
    "metadata[price_id]": priceId,
    "subscription_data[metadata][plan]": plan,
    "subscription_data[metadata][firebase_uid]": userId,
    "subscription_data[metadata][price_id]": priceId,
  });
  if (checkoutRecovery) {
    params.set("metadata[checkout_recovery]", "true");
    params.set("subscription_data[metadata][checkout_recovery]", "true");
  }
  if (customerId) params.set("customer", customerId);
  else if (customerEmail) params.set("customer_email", customerEmail);
  params.set("locale", locale === "fr" ? "fr" : "auto");
  if (locale === "fr") {
    params.set("custom_text[submit][message]", "Confirmer l'abonnement");
  }
  applyCheckoutBranding(params, plan, visualTheme, cloudAccent);
  return params;
}

// ---------------------------------------------------------------------------
// Embedded + Hosted session creation
// ---------------------------------------------------------------------------

async function createEmbeddedCheckoutSession(
  stripeKey: string,
  baseParams: URLSearchParams,
  successUrl: string,
): Promise<{ clientSecret: string } | { error: string; code?: string }> {
  const attempts: URLSearchParams[] = [
    (() => {
      const p = new URLSearchParams(baseParams);
      p.set("ui_mode", "embedded_page");
      p.set("redirect_on_completion", "never");
      return p;
    })(),
    (() => {
      const p = new URLSearchParams(baseParams);
      p.set("ui_mode", "embedded_page");
      p.set("return_url", buildEmbeddedReturnUrl(successUrl));
      p.set("redirect_on_completion", "if_required");
      return p;
    })(),
    (() => {
      const p = new URLSearchParams(baseParams);
      p.set("ui_mode", "embedded");
      p.set("return_url", buildEmbeddedReturnUrl(successUrl));
      return p;
    })(),
    (() => {
      const p = stripCheckoutBranding(new URLSearchParams(baseParams));
      p.set("ui_mode", "embedded_page");
      p.set("redirect_on_completion", "never");
      return p;
    })(),
  ];

  let lastError = "Stripe error";
  let lastCode: string | undefined;

  for (const params of attempts) {
    const { ok, session } = await createStripeCheckoutSession(stripeKey, params);
    const clientSecret = typeof session?.client_secret === "string" ? session.client_secret : null;
    if (ok && clientSecret) return { clientSecret };
    lastError = stripeErrorMessage(session);
    lastCode = typeof session?.error?.code === "string" ? session.error.code : undefined;
  }

  return { error: lastError, code: lastCode };
}

async function createHostedCheckoutSession(
  stripeKey: string,
  baseParams: URLSearchParams,
  successUrl: string,
  cancelUrl: string,
): Promise<{ url: string } | { error: string; code?: string }> {
  const attempts: URLSearchParams[] = [
    (() => {
      const p = new URLSearchParams(baseParams);
      p.set("success_url", successUrl);
      p.set("cancel_url", cancelUrl);
      return p;
    })(),
    (() => {
      const p = new URLSearchParams(baseParams);
      p.set("ui_mode", "hosted_page");
      p.set("success_url", successUrl);
      p.set("cancel_url", cancelUrl);
      return p;
    })(),
  ];

  let lastError = "Stripe error";
  let lastCode: string | undefined;

  for (const params of attempts) {
    const { ok, session } = await createStripeCheckoutSession(stripeKey, params);
    const checkoutUrl = typeof session?.url === "string" ? session.url : null;
    if (ok && checkoutUrl) return { url: checkoutUrl };
    lastError = stripeErrorMessage(session);
    lastCode = typeof session?.error?.code === "string" ? session.error.code : undefined;
  }

  return { error: lastError, code: lastCode };
}

// ---------------------------------------------------------------------------
// Cloud Function: createCheckout
// ---------------------------------------------------------------------------

export async function createCheckoutHandler(request: { auth?: { uid: string; token?: Record<string, unknown> }; data: Record<string, unknown> }) {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Not authenticated");
  }

  const userId = request.auth.uid;
  const userEmail = (request.auth.token?.email as string) ?? undefined;

  const body = request.data as Record<string, unknown>;
  const plan = String(body.plan ?? "");
  const product = String(body.product ?? "");
  const successUrl = String(body.successUrl ?? "");
  const cancelUrl = String(body.cancelUrl ?? "");
  const uiMode = String(body.uiMode ?? "embedded");
  const visualTheme = String(body.visualTheme ?? "prism");
  const cloudAccent = String(body.cloudAccent ?? "transparent");
  const checkoutLocale = String(body.locale ?? "auto");
  const checkoutRecovery = body.checkoutRecovery === true || body.checkoutRecovery === "true";
  const billingIntervalRaw = String(body.billingInterval ?? "month");
  const billingInterval = billingIntervalRaw === "year" ? "year" : "month";
  const embedded = uiMode === "embedded";

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const pricePro = process.env.STRIPE_PRICE_ID_PRO ?? "";
  const priceStudio = process.env.STRIPE_PRICE_ID_STUDIO ?? "";
  const pricePlus = process.env.STRIPE_PRICE_ID_PLUS ?? "";
  const priceProAnnual = process.env.STRIPE_PRICE_ID_PRO_ANNUAL ?? "";
  const priceStudioAnnual = process.env.STRIPE_PRICE_ID_STUDIO_ANNUAL ?? "";
  const pricePlusAnnual = process.env.STRIPE_PRICE_ID_PLUS_ANNUAL ?? "";
  const priceCreditPack50 = process.env.STRIPE_PRICE_ID_CREDIT_PACK_50 ?? "";

  if (!successUrl.startsWith("http")) {
    throw new functions.https.HttpsError("invalid-argument", "Missing successUrl");
  }
  if (!embedded && !cancelUrl.startsWith("http")) {
    throw new functions.https.HttpsError("invalid-argument", "Missing cancelUrl");
  }

  const fbProfile = await fbGetProfile(userId);
  const customerId = fbProfile?.stripe_customer_id ?? "";

  // ── Credit Pack ──────────────────────────────────────────────
  if (product === "credit_pack_50") {
    if (!stripeKey || !priceCreditPack50) {
      return { mock: true, message: "Credit packs not configured yet" };
    }

    const pack = CREDIT_PACKS.credit_pack_50;
    const baseParams = buildCreditPackCheckoutParams(
      priceCreditPack50,
      product,
      pack.credits,
      userId,
      customerId,
      userEmail ?? "",
      visualTheme,
      cloudAccent,
      checkoutLocale,
    );

    if (embedded) {
      const er = await createEmbeddedCheckoutSession(stripeKey, baseParams, successUrl);
      if ("clientSecret" in er) return { clientSecret: er.clientSecret, uiMode: "embedded", product };
      const hr = await createHostedCheckoutSession(stripeKey, baseParams, successUrl, cancelUrl);
      if ("url" in hr) return { url: hr.url, uiMode: "hosted", fallback: true, product };
      throw new functions.https.HttpsError("failed-precondition", hr.error);
    }

    const hr = await createHostedCheckoutSession(stripeKey, baseParams, successUrl, cancelUrl);
    if ("url" in hr) return { url: hr.url, uiMode: "hosted", product };
    throw new functions.https.HttpsError("failed-precondition", hr.error);
  }

  // ── Subscription ─────────────────────────────────────────────
  if (!stripeKey || !pricePro || !priceStudio || !pricePlus) {
    return { mock: true, message: "Stripe not configured yet" };
  }

  const planName = PLAN_NAMES[plan];
  if (!planName) throw new functions.https.HttpsError("invalid-argument", "Invalid plan: " + plan);

  const priceId = priceIdForPlan(
    plan,
    billingInterval,
    pricePro,
    priceStudio,
    pricePlus,
    priceProAnnual,
    priceStudioAnnual,
    pricePlusAnnual,
  );
  if (!priceId) {
    if (billingInterval === "year") {
      throw new functions.https.HttpsError(
        "unimplemented",
        "Annual billing not configured. Please choose monthly or contact support.",
      );
    }
    throw new functions.https.HttpsError("invalid-argument", "Invalid plan: " + plan);
  }

  let subscriptionId = fbProfile?.stripe_subscription_id ?? "";
  let currentPlan = fbProfile?.plan ?? "free";

  if (subscriptionId) {
    let subActive = false;
    let subRecord: Record<string, unknown> | null = null;
    try {
      subRecord = await fetchSubscription(stripeKey, subscriptionId);
      const status = asString(subRecord.status);
      subActive = status === "active" || status === "trialing";
    } catch {
      subActive = false;
    }

    if (!subActive) {
      await clearStaleBillingFB(userId);
      subscriptionId = "";
      currentPlan = "free";
    } else if (subRecord && !PAID_PLANS.has(currentPlan)) {
      const subPriceId = subscriptionPriceId(subRecord);
      const healedPlan = planFromEnvPriceId(
        subPriceId,
        pricePro,
        priceStudio,
        pricePlus,
        priceProAnnual,
        priceStudioAnnual,
        pricePlusAnnual,
      );
      if (PAID_PLANS.has(healedPlan)) {
        const healedCustomerId = asString(subRecord.customer) || customerId;
        const cpe = typeof subRecord.current_period_end === "number" ? subRecord.current_period_end : null;
        await syncProfilePlanFB(userId, healedPlan, healedCustomerId, subscriptionId, subPriceId, cpe);
        currentPlan = healedPlan;
      }
    }
  }

  if (subscriptionId && PAID_PLANS.has(currentPlan)) {
    if (currentPlan === plan) {
      return { url: successUrl, alreadySubscribed: true };
    }
    if (planRank(plan) < planRank(currentPlan)) {
      throw new functions.https.HttpsError("failed-precondition", "Use the billing portal to change your plan");
    }
    const updatedSub = await upgradeExistingSubscription(stripeKey, subscriptionId, priceId, plan, userId);
    const updatedCustomerId = asString(updatedSub.customer) || customerId;
    const cpe = typeof updatedSub.current_period_end === "number" ? updatedSub.current_period_end : null;
    await syncProfilePlanFB(userId, plan, updatedCustomerId, subscriptionId, priceId, cpe);
    return { url: successUrl, upgraded: true, plan };
  }

  const baseParams = buildBaseCheckoutParams(
    priceId,
    plan,
    userId,
    customerId,
    userEmail ?? "",
    visualTheme,
    cloudAccent,
    checkoutLocale,
    checkoutRecovery,
  );

  if (embedded) {
    const er = await createEmbeddedCheckoutSession(stripeKey, baseParams, successUrl);
    if ("clientSecret" in er) return { clientSecret: er.clientSecret, uiMode: "embedded" };

    const hr = await createHostedCheckoutSession(stripeKey, baseParams, successUrl, cancelUrl);
    if ("url" in hr) return { url: hr.url, uiMode: "hosted", fallback: true };
    throw new functions.https.HttpsError("failed-precondition", hr.error);
  }

  const hr = await createHostedCheckoutSession(stripeKey, baseParams, successUrl, cancelUrl);
  if ("url" in hr) return { url: hr.url, uiMode: "hosted" };
  throw new functions.https.HttpsError("failed-precondition", hr.error);
}
