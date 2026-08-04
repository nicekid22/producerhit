// confirmCheckout.ts — Firebase Cloud Function (Node.js)
// Port of supabase/functions/confirm-checkout/index.ts

import * as functions from "firebase-functions";
import { fbGetProfile, fbUpdateProfile, fbGrantCredits } from "./firestore";

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

const HOSTED_AUDIO_GRACE_DAYS = 7;

function hostedAudioExpiresAtIso(days = HOSTED_AUDIO_GRACE_DAYS): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function profilePlanPatch(prevPlan: string, nextPlan: string): Record<string, unknown> {
  const patch: Record<string, unknown> = { plan: nextPlan };
  if (nextPlan === "plus") {
    patch.hosted_audio_expires_at = null;
  } else if (prevPlan === "plus") {
    patch.hosted_audio_expires_at = hostedAudioExpiresAtIso();
  }
  return patch;
}

function planFromPriceId(
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

async function fetchSubscription(stripeKey: string, subscriptionId: string): Promise<Record<string, unknown>> {
  const fetch = (await import("node-fetch")).default;
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) throw new functions.https.HttpsError("internal", "Stripe subscription fetch failed");
  return json ?? {};
}

export async function confirmCheckoutHandler(request: { auth?: { uid: string; token?: Record<string, unknown> }; data: Record<string, unknown> }) {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Not authenticated");
  }

  const userId = request.auth.uid;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const pricePro = process.env.STRIPE_PRICE_ID_PRO ?? "";
  const priceStudio = process.env.STRIPE_PRICE_ID_STUDIO ?? "";
  const pricePlus = process.env.STRIPE_PRICE_ID_PLUS ?? "";
  const priceProAnnual = process.env.STRIPE_PRICE_ID_PRO_ANNUAL ?? "";
  const priceStudioAnnual = process.env.STRIPE_PRICE_ID_STUDIO_ANNUAL ?? "";
  const pricePlusAnnual = process.env.STRIPE_PRICE_ID_PLUS_ANNUAL ?? "";

  if (!stripeKey) throw new functions.https.HttpsError("failed-precondition", "Missing STRIPE_SECRET_KEY");

  const sessionId = asString(request.data?.sessionId);
  if (!sessionId.startsWith("cs_")) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid sessionId");
  }

  const fetch = (await import("node-fetch")).default;

  const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const session = (await sessionRes.json().catch(() => null)) as Record<string, unknown> | null;
  if (!sessionRes.ok || !session) {
    throw new functions.https.HttpsError("not-found", "Could not retrieve checkout session");
  }

  const metadata = (session.metadata ?? {}) as Record<string, unknown>;
  const sessionUserId = asString(metadata.firebase_uid) || asString(session.client_reference_id);
  if (sessionUserId !== userId) {
    throw new functions.https.HttpsError("permission-denied", "Session does not belong to user");
  }

  const paymentStatus = asString(session.payment_status);
  const sessionStatus = asString(session.status);
  if (paymentStatus !== "paid" && sessionStatus !== "complete") {
    return { ok: false, pending: true };
  }

  const mode = asString(session.mode);
  const customerId = asString(session.customer);

  // ── Credit Pack ──────────────────────────────────────────────
  if (mode === "payment") {
    const creditPack = asString(metadata.credit_pack);
    const creditsRaw = asString(metadata.credits);
    const credits = Number.parseInt(creditsRaw, 10);
    if (!creditPack || !Number.isFinite(credits) || credits <= 0) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid credit pack session");
    }
    await fbGrantCredits(userId, {
      idempotencyKey: `confirm:${sessionId}`,
      bonusType: "purchased",
      credits,
    });
    return { ok: true, product: "credit_pack" };
  }

  // ── Subscription ────────────────────────────────────────────
  const subscriptionId = asString(session.subscription);
  if (!subscriptionId) {
    return { ok: false, pending: true };
  }

  const sub = await fetchSubscription(stripeKey, subscriptionId);
  const items = (sub.items as { data?: unknown } | undefined)?.data;
  const firstItem =
    Array.isArray(items) && items[0] && typeof items[0] === "object" ? (items[0] as Record<string, unknown>) : null;
  const price = firstItem && typeof firstItem.price === "object" ? (firstItem.price as Record<string, unknown>) : null;
  const priceId = asString(price?.id);
  const currentPeriodEnd = typeof sub.current_period_end === "number" ? sub.current_period_end : null;
  const periodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;

  const plan = planFromPriceId(
    priceId,
    pricePro,
    priceStudio,
    pricePlus,
    priceProAnnual,
    priceStudioAnnual,
    pricePlusAnnual,
  );
  if (plan === "free") {
    throw new functions.https.HttpsError("invalid-argument", "Unknown price");
  }

  const prevProfile = await fbGetProfile(userId);
  const prevPlan = prevProfile?.plan ?? "free";

  await fbUpdateProfile(userId, {
    ...profilePlanPatch(prevPlan, plan),
    stripe_customer_id: customerId || undefined,
    stripe_subscription_id: subscriptionId,
    stripe_price_id: priceId || undefined,
    stripe_current_period_end: periodEndIso || undefined,
  });

  return { ok: true, plan };
}
