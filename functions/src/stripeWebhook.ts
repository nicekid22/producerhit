// stripeWebhook.ts — Firebase Cloud Function (Node.js)
// Port of supabase/functions/stripe-webhook/index.ts
// HTTPS function (not onCall) — Stripe calls this directly

import * as functions from "firebase-functions";
import * as crypto from "crypto";
import {
  fbGetProfile,
  fbUpdateProfile,
  fbGrantCredits,
  fbLogBillingEvent,
  fbResolveUidByStripeCustomerId,
  fbRegisterStripeCustomer,
} from "./firestore";
import { env } from "./env";

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function hmacSha256(secret: string, message: string): Buffer {
  return crypto.createHmac("sha256", secret).update(message, "utf8").digest();
}

function hexToBytes(hex: string): Buffer {
  return Buffer.from(hex, "hex");
}

function equalBytes(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
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

const LAUNCH_OFFER_END_ISO = env("LAUNCH_OFFER_END_ISO") || "2026-07-31T23:59:59Z";
const LAUNCH_BONUS_PRO = Number.parseInt(env("LAUNCH_BONUS_PRO") || "20", 10);
const LAUNCH_BONUS_RECOVERY = Number.parseInt(env("LAUNCH_BONUS_RECOVERY") || "5", 10);

function isLaunchOfferActive(now = Date.now()): boolean {
  const end = new Date(LAUNCH_OFFER_END_ISO).getTime();
  return Number.isFinite(end) && now < end;
}

function planFromPriceId(priceId: string): string {
  const pro = env("STRIPE_PRICE_ID_PRO");
  const studio = env("STRIPE_PRICE_ID_STUDIO");
  const plus = env("STRIPE_PRICE_ID_PLUS");
  const proAnnual = env("STRIPE_PRICE_ID_PRO_ANNUAL");
  const studioAnnual = env("STRIPE_PRICE_ID_STUDIO_ANNUAL");
  const plusAnnual = env("STRIPE_PRICE_ID_PLUS_ANNUAL");
  if (priceId && (priceId === pro || priceId === proAnnual)) return "pro";
  if (priceId && (priceId === studio || priceId === studioAnnual)) return "studio";
  if (priceId && (priceId === plus || priceId === plusAnnual)) return "plus";
  return "free";
}

function priceAmountCents(price: Record<string, unknown> | null): number | null {
  const unit = price?.unit_amount;
  return typeof unit === "number" ? unit : null;
}

async function fetchSubscription(stripeKey: string, subscriptionId: string): Promise<Record<string, unknown>> {
  const fetch = (await import("node-fetch")).default;
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const json = await res.json().catch(() => null) as Record<string, unknown> | null;
  if (!res.ok) throw new Error("Stripe subscription fetch failed");
  return json ?? {};
}

// ---------------------------------------------------------------------------
// Cloud Function: stripeWebhook (raw HTTP, not onCall)
// ---------------------------------------------------------------------------

export async function stripeWebhookHandler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(200).send("ok");
    return;
  }

  const stripeKey = env("STRIPE_SECRET_KEY");
  const webhookSecret = env("STRIPE_WEBHOOK_SECRET") || env("STRIPE_ENDPOINT_SECRET");

  if (!stripeKey || !webhookSecret) {
    res.status(500).send("missing env");
    return;
  }
  if (webhookSecret.startsWith("http://") || webhookSecret.startsWith("https://")) {
    res.status(500).send("invalid webhook secret");
    return;
  }

  const sigHeader = req.get("stripe-signature") ?? "";
  const rawBody = (req as any).rawBody ?? JSON.stringify(req.body);

  // Parse signature header
  const parts: string[] = sigHeader.split(",").map((p: string) => p.trim());
  const timestamp = parts.find((p: string) => p.startsWith("t="))?.slice(2) ?? "";
  const v1s = parts.filter((p: string) => p.startsWith("v1=")).map((p: string) => p.slice(3)).filter(Boolean);
  if (!timestamp || v1s.length === 0) {
    res.status(400).send("bad signature header");
    return;
  }

  // Timestamp tolerance
  const eventTs = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(eventTs)) {
    res.status(400).send("bad signature timestamp");
    return;
  }
  const toleranceSec = Number.parseInt(env("STRIPE_WEBHOOK_TOLERANCE_SEC") || "300", 10);
  const skewSec = Math.abs(Math.floor(Date.now() / 1000) - eventTs);
  if (skewSec > Math.max(60, toleranceSec)) {
    res.status(400).send("timestamp outside tolerance");
    return;
  }

  // Verify HMAC signature
  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = hmacSha256(webhookSecret, signedPayload);
  let sigOk = false;
  for (const v1 of v1s) {
    const provided = hexToBytes(v1);
    if (equalBytes(expected, provided)) {
      sigOk = true;
      break;
    }
  }
  if (!sigOk) {
    res.status(400).send("invalid signature");
    return;
  }

  const event = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) as {
    id?: unknown;
    type?: unknown;
    data?: unknown;
  } ?? {};
  const type = asString(event.type);
  const stripeEventId = asString(event.id);
  const dataObj =
    typeof event.data === "object" && event.data && typeof (event.data as { object?: unknown }).object === "object"
      ? ((event.data as { object: unknown }).object as Record<string, unknown>)
      : null;

  try {
    if (!dataObj) {
      res.status(200).send("ok");
      return;
    }

    // ── Checkout session completed ─────────────────────────────────
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
        res.status(200).send("ok");
        return;
      }

      // Subscription checkout
      const subscriptionId = asString(dataObj.subscription);
      if (!userId || !subscriptionId) {
        res.status(200).send("ok");
        return;
      }

      // Register customer → uid mapping
      if (userId && customerId) {
        await fbRegisterStripeCustomer(userId, customerId);
      }

      const sub = await fetchSubscription(stripeKey, subscriptionId);
      const items = (sub.items as { data?: unknown } | undefined)?.data;
      const firstItem = Array.isArray(items) && items[0] && typeof items[0] === "object"
        ? (items[0] as Record<string, unknown>) : null;
      const price = firstItem && typeof firstItem.price === "object"
        ? (firstItem.price as Record<string, unknown>) : null;
      const priceId = asString(price?.id);
      const currentPeriodEnd = typeof sub.current_period_end === "number" ? sub.current_period_end : null;
      const periodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;

      const plan = planFromPriceId(priceId);

      const prev = await fbGetProfile(userId);
      const prevPlan = prev?.plan ?? "free";
      const hadSubscription = !!prev?.stripe_subscription_id;

      await fbUpdateProfile(userId, {
        ...profilePlanPatch(prevPlan, plan),
        stripe_customer_id: customerId || undefined,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId || undefined,
        stripe_current_period_end: periodEndIso || undefined,
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

      res.status(200).send("ok");
      return;
    }

    // ── Subscription updated / deleted ─────────────────────────────
    if (type === "customer.subscription.updated" || type === "customer.subscription.deleted") {
      const subscriptionId = asString(dataObj.id);
      const customerId = asString(dataObj.customer);
      const status = asString(dataObj.status);
      const metadata = (dataObj.metadata ?? {}) as Record<string, unknown>;
      const firebaseUid = asString(metadata.firebase_uid);

      // Resolve uid: from metadata first, then from stripe_customers collection
      let userId = firebaseUid;
      if (!userId && customerId) {
        userId = await fbResolveUidByStripeCustomerId(customerId) ?? "";
      }

      const items = (dataObj.items as { data?: unknown } | undefined)?.data;
      const firstItem = Array.isArray(items) && items[0] && typeof items[0] === "object"
        ? (items[0] as Record<string, unknown>) : null;
      const price = firstItem && typeof firstItem.price === "object"
        ? (firstItem.price as Record<string, unknown>) : null;
      const priceId = asString(price?.id);
      const currentPeriodEnd = typeof dataObj.current_period_end === "number" ? (dataObj.current_period_end as number) : null;
      const periodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;

      if (!userId) {
        res.status(200).send("ok");
        return;
      }

      const active = status === "active" || status === "trialing";
      const plan = active ? planFromPriceId(priceId) : "free";
      const prev = await fbGetProfile(userId);
      const prevPlan = prev?.plan ?? "free";

      await fbUpdateProfile(userId, {
        ...profilePlanPatch(prevPlan, plan),
        stripe_customer_id: customerId || undefined,
        stripe_subscription_id: active ? subscriptionId : undefined,
        stripe_price_id: active ? priceId || undefined : undefined,
        stripe_current_period_end: active ? periodEndIso || undefined : undefined,
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

      res.status(200).send("ok");
      return;
    }

    res.status(200).send("ok");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    functions.logger.error("stripe-webhook error:", message);
    res.status(500).send(message);
  }
}
