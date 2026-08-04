"use strict";
// stripeWebhook.ts — Firebase Cloud Function (Node.js)
// Port of supabase/functions/stripe-webhook/index.ts
// HTTPS function (not onCall) — Stripe calls this directly
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhookHandler = stripeWebhookHandler;
const functions = __importStar(require("firebase-functions"));
const crypto = __importStar(require("crypto"));
const firestore_1 = require("./firestore");
function asString(v) {
    return typeof v === "string" ? v : "";
}
function hmacSha256(secret, message) {
    return crypto.createHmac("sha256", secret).update(message, "utf8").digest();
}
function hexToBytes(hex) {
    return Buffer.from(hex, "hex");
}
function equalBytes(a, b) {
    if (a.length !== b.length)
        return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++)
        diff |= a[i] ^ b[i];
    return diff === 0;
}
const HOSTED_AUDIO_GRACE_DAYS = 7;
function hostedAudioExpiresAtIso(days = HOSTED_AUDIO_GRACE_DAYS) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}
function profilePlanPatch(prevPlan, nextPlan) {
    const patch = { plan: nextPlan };
    if (nextPlan === "plus") {
        patch.hosted_audio_expires_at = null;
    }
    else if (prevPlan === "plus") {
        patch.hosted_audio_expires_at = hostedAudioExpiresAtIso();
    }
    return patch;
}
const LAUNCH_OFFER_END_ISO = (_a = process.env.LAUNCH_OFFER_END_ISO) !== null && _a !== void 0 ? _a : "2026-07-31T23:59:59Z";
const LAUNCH_BONUS_PRO = Number.parseInt((_b = process.env.LAUNCH_BONUS_PRO) !== null && _b !== void 0 ? _b : "20", 10);
const LAUNCH_BONUS_RECOVERY = Number.parseInt((_c = process.env.LAUNCH_BONUS_RECOVERY) !== null && _c !== void 0 ? _c : "5", 10);
function isLaunchOfferActive(now = Date.now()) {
    const end = new Date(LAUNCH_OFFER_END_ISO).getTime();
    return Number.isFinite(end) && now < end;
}
function planFromPriceId(priceId) {
    var _a, _b, _c, _d, _e, _f;
    const pro = (_a = process.env.STRIPE_PRICE_ID_PRO) !== null && _a !== void 0 ? _a : "";
    const studio = (_b = process.env.STRIPE_PRICE_ID_STUDIO) !== null && _b !== void 0 ? _b : "";
    const plus = (_c = process.env.STRIPE_PRICE_ID_PLUS) !== null && _c !== void 0 ? _c : "";
    const proAnnual = (_d = process.env.STRIPE_PRICE_ID_PRO_ANNUAL) !== null && _d !== void 0 ? _d : "";
    const studioAnnual = (_e = process.env.STRIPE_PRICE_ID_STUDIO_ANNUAL) !== null && _e !== void 0 ? _e : "";
    const plusAnnual = (_f = process.env.STRIPE_PRICE_ID_PLUS_ANNUAL) !== null && _f !== void 0 ? _f : "";
    if (priceId && (priceId === pro || priceId === proAnnual))
        return "pro";
    if (priceId && (priceId === studio || priceId === studioAnnual))
        return "studio";
    if (priceId && (priceId === plus || priceId === plusAnnual))
        return "plus";
    return "free";
}
function priceAmountCents(price) {
    const unit = price === null || price === void 0 ? void 0 : price.unit_amount;
    return typeof unit === "number" ? unit : null;
}
async function fetchSubscription(stripeKey, subscriptionId) {
    const fetch = (await Promise.resolve().then(() => __importStar(require("node-fetch")))).default;
    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok)
        throw new Error("Stripe subscription fetch failed");
    return json !== null && json !== void 0 ? json : {};
}
// ---------------------------------------------------------------------------
// Cloud Function: stripeWebhook (raw HTTP, not onCall)
// ---------------------------------------------------------------------------
async function stripeWebhookHandler(req, res) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    if (req.method !== "POST") {
        res.status(200).send("ok");
        return;
    }
    const stripeKey = (_a = process.env.STRIPE_SECRET_KEY) !== null && _a !== void 0 ? _a : "";
    const webhookSecret = (_c = (_b = process.env.STRIPE_WEBHOOK_SECRET) !== null && _b !== void 0 ? _b : process.env.STRIPE_ENDPOINT_SECRET) !== null && _c !== void 0 ? _c : "";
    if (!stripeKey || !webhookSecret) {
        res.status(500).send("missing env");
        return;
    }
    if (webhookSecret.startsWith("http://") || webhookSecret.startsWith("https://")) {
        res.status(500).send("invalid webhook secret");
        return;
    }
    const sigHeader = (_d = req.get("stripe-signature")) !== null && _d !== void 0 ? _d : "";
    const rawBody = (_e = req.rawBody) !== null && _e !== void 0 ? _e : JSON.stringify(req.body);
    // Parse signature header
    const parts = sigHeader.split(",").map((p) => p.trim());
    const timestamp = (_g = (_f = parts.find((p) => p.startsWith("t="))) === null || _f === void 0 ? void 0 : _f.slice(2)) !== null && _g !== void 0 ? _g : "";
    const v1s = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3)).filter(Boolean);
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
    const toleranceSec = Number.parseInt((_h = process.env.STRIPE_WEBHOOK_TOLERANCE_SEC) !== null && _h !== void 0 ? _h : "300", 10);
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
    const event = (_j = (typeof req.body === "string" ? JSON.parse(req.body) : req.body)) !== null && _j !== void 0 ? _j : {};
    const type = asString(event.type);
    const stripeEventId = asString(event.id);
    const dataObj = typeof event.data === "object" && event.data && typeof event.data.object === "object"
        ? event.data.object
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
            const metadata = ((_k = dataObj.metadata) !== null && _k !== void 0 ? _k : {});
            const userId = asString(metadata.firebase_uid) || asString(dataObj.client_reference_id);
            // Credit pack purchase (one-time payment)
            if (mode === "payment") {
                const creditPack = asString(metadata.credit_pack);
                const creditsRaw = asString(metadata.credits);
                const credits = Number.parseInt(creditsRaw, 10);
                if (userId && creditPack && Number.isFinite(credits) && credits > 0 && stripeEventId) {
                    await (0, firestore_1.fbGrantCredits)(userId, {
                        idempotencyKey: stripeEventId,
                        bonusType: "purchased",
                        credits,
                    });
                    await (0, firestore_1.fbLogBillingEvent)({
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
                await (0, firestore_1.fbRegisterStripeCustomer)(userId, customerId);
            }
            const sub = await fetchSubscription(stripeKey, subscriptionId);
            const items = (_l = sub.items) === null || _l === void 0 ? void 0 : _l.data;
            const firstItem = Array.isArray(items) && items[0] && typeof items[0] === "object"
                ? items[0] : null;
            const price = firstItem && typeof firstItem.price === "object"
                ? firstItem.price : null;
            const priceId = asString(price === null || price === void 0 ? void 0 : price.id);
            const currentPeriodEnd = typeof sub.current_period_end === "number" ? sub.current_period_end : null;
            const periodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;
            const plan = planFromPriceId(priceId);
            const prev = await (0, firestore_1.fbGetProfile)(userId);
            const prevPlan = (_m = prev === null || prev === void 0 ? void 0 : prev.plan) !== null && _m !== void 0 ? _m : "free";
            const hadSubscription = !!(prev === null || prev === void 0 ? void 0 : prev.stripe_subscription_id);
            await (0, firestore_1.fbUpdateProfile)(userId, Object.assign(Object.assign({}, profilePlanPatch(prevPlan, plan)), { stripe_customer_id: customerId || undefined, stripe_subscription_id: subscriptionId, stripe_price_id: priceId || undefined, stripe_current_period_end: periodEndIso || undefined }));
            // Launch offer bonuses
            if (isLaunchOfferActive()) {
                const isRecovery = asString(metadata.checkout_recovery) === "true";
                if (isRecovery && stripeEventId) {
                    await (0, firestore_1.fbGrantCredits)(userId, {
                        idempotencyKey: `${stripeEventId}:checkout_recovery`,
                        bonusType: "launch",
                        credits: LAUNCH_BONUS_RECOVERY,
                    });
                }
                const isFirstProMonth = plan === "pro" && prevPlan === "free" && !hadSubscription;
                if (isFirstProMonth && stripeEventId) {
                    await (0, firestore_1.fbGrantCredits)(userId, {
                        idempotencyKey: `${stripeEventId}:pro_first_month`,
                        bonusType: "launch",
                        credits: LAUNCH_BONUS_PRO,
                    });
                }
            }
            if (stripeEventId) {
                await (0, firestore_1.fbLogBillingEvent)({
                    stripeEventId: `${stripeEventId}:subscription_activated`,
                    userId,
                    stripeSubscriptionId: subscriptionId,
                    eventType: "subscription_activated",
                    plan,
                    amountCents: priceAmountCents(price),
                    currency: asString(price === null || price === void 0 ? void 0 : price.currency) || "usd",
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
            const metadata = ((_o = dataObj.metadata) !== null && _o !== void 0 ? _o : {});
            const firebaseUid = asString(metadata.firebase_uid);
            // Resolve uid: from metadata first, then from stripe_customers collection
            let userId = firebaseUid;
            if (!userId && customerId) {
                userId = (_p = await (0, firestore_1.fbResolveUidByStripeCustomerId)(customerId)) !== null && _p !== void 0 ? _p : "";
            }
            const items = (_q = dataObj.items) === null || _q === void 0 ? void 0 : _q.data;
            const firstItem = Array.isArray(items) && items[0] && typeof items[0] === "object"
                ? items[0] : null;
            const price = firstItem && typeof firstItem.price === "object"
                ? firstItem.price : null;
            const priceId = asString(price === null || price === void 0 ? void 0 : price.id);
            const currentPeriodEnd = typeof dataObj.current_period_end === "number" ? dataObj.current_period_end : null;
            const periodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;
            if (!userId) {
                res.status(200).send("ok");
                return;
            }
            const active = status === "active" || status === "trialing";
            const plan = active ? planFromPriceId(priceId) : "free";
            const prev = await (0, firestore_1.fbGetProfile)(userId);
            const prevPlan = (_r = prev === null || prev === void 0 ? void 0 : prev.plan) !== null && _r !== void 0 ? _r : "free";
            await (0, firestore_1.fbUpdateProfile)(userId, Object.assign(Object.assign({}, profilePlanPatch(prevPlan, plan)), { stripe_customer_id: customerId || undefined, stripe_subscription_id: active ? subscriptionId : undefined, stripe_price_id: active ? priceId || undefined : undefined, stripe_current_period_end: active ? periodEndIso || undefined : undefined }));
            if (stripeEventId) {
                const canceled = type === "customer.subscription.deleted" || !active;
                await (0, firestore_1.fbLogBillingEvent)({
                    stripeEventId: `${stripeEventId}:${canceled ? "canceled" : "updated"}`,
                    userId,
                    stripeSubscriptionId: subscriptionId,
                    eventType: canceled ? "subscription_canceled" : "subscription_updated",
                    plan: active ? plan : prevPlan,
                    amountCents: priceAmountCents(price),
                    currency: asString(price === null || price === void 0 ? void 0 : price.currency) || "usd",
                    status,
                    metadata: { stripe_type: type },
                });
            }
            res.status(200).send("ok");
            return;
        }
        res.status(200).send("ok");
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        functions.logger.error("stripe-webhook error:", message);
        res.status(500).send(message);
    }
}
//# sourceMappingURL=stripeWebhook.js.map