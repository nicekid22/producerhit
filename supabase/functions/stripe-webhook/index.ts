// stripe-webhook/index.ts
//
// Receives Stripe webhook events and syncs billing to Firestore.
//
// Auth: Stripe signature (verified as before)
// Storage: Firestore collections
//   - profiles/{uid}          — billing profile
//   - billing_revenue_events/{event_id}  — append-only event log (idempotent)
//   - stripe_customers/{customer_id}      — customer_id → uid lookup

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  fbGetProfile,
  fbUpdateProfile,
  fbGrantCredits,
  fbLogBillingEvent,
  fbResolveUidByStripeCustomerId,
  fbRegisterStripeCustomer,
} from "../_shared/firestoreServer.ts";

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function equalBytes(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function hexToBytes(hex: string) {
  const clean = hex.trim();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function hmacSha256(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return new Uint8Array(sig);
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

const LAUNCH_OFFER_END_ISO = Deno.env.get("LAUNCH_OFFER_END_ISO") ?? "2026-07-31T23:59:59Z";
const LAUNCH_BONUS_PRO = Number.parseInt(Deno.env.get("LAUNCH_BONUS_PRO") ?? "20", 10);
const LAUNCH_BONUS_RECOVERY = Number.parseInt(Deno.env.get("LAUNCH_BONUS_RECOVERY") ?? "5", 10);

function isLaunchOfferActive(now = Date.now()): boolean {
  const end = new Date(LAUNCH_OFFER_END_ISO).getTime();
  return Number.isFinite(end) && now < end;
}

function planFromPriceId(priceId: string): string {
  const pro = Deno.env.get("STRIPE_PRICE_ID_PRO") ?? "";
  const studio = Deno.env.get("STRIPE_PRICE_ID_STUDIO") ?? "";
  const plus = Deno.env.get("STRIPE_PRICE_ID_PLUS") ?? "";
  const proAnnual = Deno.env.get("STRIPE_PRICE_ID_PRO_ANNUAL") ?? "";
  const studioAnnual = Deno.env.get("STRIPE_PRICE_ID_STUDIO_ANNUAL") ?? "";
  const plusAnnual = Deno.env.get("STRIPE_PRICE_ID_PLUS_ANNUAL") ?? "";
  if (priceId && (priceId === pro || priceId === proAnnual)) return "pro";
  if (priceId && (priceId === studio || priceId === studioAnnual)) return "studio";
  if (priceId && (priceId === plus || priceId === plusAnnual)) return "plus";
  return "free";
}

function priceAmountCents(price: Record<string, unknown> | null): number | null {
  const unit = price?.unit_amount;
  return typeof unit === "number" ? unit : null;
}

async function fetchSubscription(stripeKey: string, subscriptionId: string) {
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error("Stripe subscription fetch failed");
  return json as Record<string, unknown>;
}

serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("ok");

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? Deno.env.get("STRIPE_ENDPOINT_SECRET") ?? "";

  if (!stripeKey || !webhookSecret) {
    return new Response("missing env", { status: 500 });
  }
  if (webhookSecret.startsWith("http://") || webhookSecret.startsWith("https://")) {
    return new Response("invalid webhook secret", { status: 500 });
  }

  const sigHeader = req.headers.get("stripe-signature") ?? "";
  const rawBody = await req.text();

  const parts = sigHeader.split(",").map((p) => p.trim());
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2) ?? "";
  const v1s = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3)).filter(Boolean);
  if (!timestamp || v1s.length === 0) return new Response("bad signature header", { status: 400 });

  const eventTs = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(eventTs)) return new Response("bad signature timestamp", { status: 400 });
  const toleranceSec = Number.parseInt(Deno.env.get("STRIPE_WEBHOOK_TOLERANCE_SEC") ?? "300", 10);
  const skewSec = Math.abs(Math.floor(Date.now() / 1000) - eventTs);
  if (skewSec > Math.max(60, toleranceSec)) {
    return new Response("timestamp outside tolerance", { status: 400 });
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = await hmacSha256(webhookSecret, signedPayload);
  let ok = false;
  for (const v1 of v1s) {
    const provided = hexToBytes(v1);
    if (equalBytes(expected, provided)) {
      ok = true;
      break;
    }
  }
  if (!ok) return new Response("invalid signature", { status: 400 });

  const event = (JSON.parse(rawBody) as { id?: unknown; type?: unknown; data?: unknown }) ?? {};
  const type = asString(event.type);
  const stripeEventId = asString(event.id);
  const dataObj =
    typeof event.data === "object" && event.data && typeof (event.data as { object?: unknown }).object === "object"
      ? ((event.data as { object: unknown }).object as Record<string, unknown>)
      : null;

  try {
    if (!dataObj) return new Response("ok");

    // ── Checkout session completed ───────────────────────────────────────────
    if (type === "checkout.session.completed") {
      const mode = asString(dataObj.mode);
      const customerId = asString(dataObj.customer);
      const metadata = (dataObj.metadata ?? {}) as Record<string, unknown>;
      const userId = asString(metadata.firebase_uid) || asString(dataObj.client_reference_id);

      // Credit pack purchase (one-time payment)
      if (mode === "payment") {
        const creditPack = asString(metadata.credit_pack);
        const creditsRaw = asString(metadata.credits);
        const credits = Number.parseInt(creditsRaw, 10);
        if (userId && creditPack && Number.isFinite(credits) && credits > 0 && stripeEventId) {
          await fbGrantCredits(userId, {
            idempotencyKey: stripeEventId,
            bonusType: "purchased",
            credits,
          });
          await fbLogBillingEvent({
            stripeEventId: `${stripeEventId}:credit_pack`,
            userId,
            eventType: "credit_pack_purchased",
            amountCents: Number.parseInt(asString(dataObj.amount_total), 10) || null,
            currency: asString(dataObj.currency) || "usd",
            status: "paid",
            metadata: { credit_pack: creditPack, credits },
          });
        }
        return new Response("ok");
      }

      // Subscription checkout
      const subscriptionId = asString(dataObj.subscription);
      if (!userId || !subscriptionId) return new Response("ok");

      // Register customer → uid mapping so future events can find the user by customer_id
      if (userId && customerId) {
        await fbRegisterStripeCustomer(userId, customerId);
      }

      const sub = await fetchSubscription(stripeKey, subscriptionId);
      const items = (sub.items as { data?: unknown } | undefined)?.data;
      const firstItem = Array.isArray(items) && items[0] && typeof items[0] === "object" ? (items[0] as Record<string, unknown>) : null;
      const price = firstItem && typeof firstItem.price === "object" ? (firstItem.price as Record<string, unknown>) : null;
      const priceId = asString(price?.id);
      const currentPeriodEnd = typeof sub.current_period_end === "number" ? sub.current_period_end : null;
      const periodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;

      const plan = planFromPriceId(priceId);

      const prev = await fbGetProfile(userId);
      const prevPlan = prev?.plan ?? "free";
      const hadSubscription = !!prev?.stripe_subscription_id;

      await fbUpdateProfile(userId, {
        ...profilePlanPatch(prevPlan, plan),
        stripe_customer_id: customerId || null,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId || null,
        stripe_current_period_end: periodEndIso,
      });

      // Launch offer bonuses
      if (isLaunchOfferActive()) {
        const isRecovery = asString(metadata.checkout_recovery) === "true";
        if (isRecovery && stripeEventId) {
          await fbGrantCredits(userId, {
            idempotencyKey: `${stripeEventId}:checkout_recovery`,
            bonusType: "launch",
            credits: LAUNCH_BONUS_RECOVERY,
          });
        }
        const isFirstProMonth = plan === "pro" && prevPlan === "free" && !hadSubscription;
        if (isFirstProMonth && stripeEventId) {
          await fbGrantCredits(userId, {
            idempotencyKey: `${stripeEventId}:pro_first_month`,
            bonusType: "launch",
            credits: LAUNCH_BONUS_PRO,
          });
        }
      }

      if (stripeEventId) {
        await fbLogBillingEvent({
          stripeEventId: `${stripeEventId}:subscription_activated`,
          userId,
          stripeSubscriptionId: subscriptionId,
          eventType: "subscription_activated",
          plan,
          amountCents: priceAmountCents(price),
          currency: asString(price?.currency) || "usd",
          status: "active",
          metadata: { checkout_mode: mode },
        });
      }

      return new Response("ok");
    }

    // ── Subscription updated / deleted ─────────────────────────────────────
    if (type === "customer.subscription.updated" || type === "customer.subscription.deleted") {
      const subscriptionId = asString(dataObj.id);
      const customerId = asString(dataObj.customer);
      const status = asString(dataObj.status);
      const metadata = (dataObj.metadata ?? {}) as Record<string, unknown>;
      const firebaseUid = asString(metadata.firebase_uid);

      // Resolve uid: from metadata first, then from stripe_customers collection
      let userId = firebaseUid;
      if (!userId && customerId) {
        userId = await fbResolveUidByStripeCustomerId(customerId);
      }

      const items = (dataObj.items as { data?: unknown } | undefined)?.data;
      const firstItem = Array.isArray(items) && items[0] && typeof items[0] === "object" ? (items[0] as Record<string, unknown>) : null;
      const price = firstItem && typeof firstItem.price === "object" ? (firstItem.price as Record<string, unknown>) : null;
      const priceId = asString(price?.id);
      const currentPeriodEnd = typeof dataObj.current_period_end === "number" ? (dataObj.current_period_end as number) : null;
      const periodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;

      if (!userId) return new Response("ok");

      const active = status === "active" || status === "trialing";
      const plan = active ? planFromPriceId(priceId) : "free";
      const prev = await fbGetProfile(userId);
      const prevPlan = prev?.plan ?? "free";

      await fbUpdateProfile(userId, {
        ...profilePlanPatch(prevPlan, plan),
        stripe_customer_id: customerId || null,
        stripe_subscription_id: active ? subscriptionId : null,
        stripe_price_id: active ? priceId || null : null,
        stripe_current_period_end: active ? periodEndIso : null,
      });

      if (stripeEventId) {
        const canceled = type === "customer.subscription.deleted" || !active;
        await fbLogBillingEvent({
          stripeEventId: `${stripeEventId}:${canceled ? "canceled" : "updated"}`,
          userId,
          stripeSubscriptionId: subscriptionId,
          eventType: canceled ? "subscription_canceled" : "subscription_updated",
          plan: active ? plan : prevPlan,
          amountCents: priceAmountCents(price),
          currency: asString(price?.currency) || "usd",
          status,
          metadata: { stripe_type: type },
        });
      }

      return new Response("ok");
    }

    return new Response("ok");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("stripe-webhook error:", message);
    return new Response(message, { status: 500 });
  }
});