"use strict";
// confirmCheckout.ts — Firebase Cloud Function (Node.js)
// Port of supabase/functions/confirm-checkout/index.ts
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmCheckoutHandler = confirmCheckoutHandler;
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("./firestore");
function asString(v) {
    return typeof v === "string" ? v : "";
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
function planFromPriceId(priceId, pricePro, priceStudio, pricePlus, priceProAnnual, priceStudioAnnual, pricePlusAnnual) {
    if (priceId && (priceId === pricePro || priceId === priceProAnnual))
        return "pro";
    if (priceId && (priceId === priceStudio || priceId === priceStudioAnnual))
        return "studio";
    if (priceId && (priceId === pricePlus || priceId === pricePlusAnnual))
        return "plus";
    return "free";
}
async function fetchSubscription(stripeKey, subscriptionId) {
    const fetch = (await Promise.resolve().then(() => __importStar(require("node-fetch")))).default;
    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const json = (await res.json().catch(() => null));
    if (!res.ok)
        throw new functions.https.HttpsError("internal", "Stripe subscription fetch failed");
    return json !== null && json !== void 0 ? json : {};
}
async function confirmCheckoutHandler(request) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Not authenticated");
    }
    const userId = request.auth.uid;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const pricePro = (_a = process.env.STRIPE_PRICE_ID_PRO) !== null && _a !== void 0 ? _a : "";
    const priceStudio = (_b = process.env.STRIPE_PRICE_ID_STUDIO) !== null && _b !== void 0 ? _b : "";
    const pricePlus = (_c = process.env.STRIPE_PRICE_ID_PLUS) !== null && _c !== void 0 ? _c : "";
    const priceProAnnual = (_d = process.env.STRIPE_PRICE_ID_PRO_ANNUAL) !== null && _d !== void 0 ? _d : "";
    const priceStudioAnnual = (_e = process.env.STRIPE_PRICE_ID_STUDIO_ANNUAL) !== null && _e !== void 0 ? _e : "";
    const pricePlusAnnual = (_f = process.env.STRIPE_PRICE_ID_PLUS_ANNUAL) !== null && _f !== void 0 ? _f : "";
    if (!stripeKey)
        throw new functions.https.HttpsError("failed-precondition", "Missing STRIPE_SECRET_KEY");
    const sessionId = asString((_g = request.data) === null || _g === void 0 ? void 0 : _g.sessionId);
    if (!sessionId.startsWith("cs_")) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid sessionId");
    }
    const fetch = (await Promise.resolve().then(() => __importStar(require("node-fetch")))).default;
    const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const session = (await sessionRes.json().catch(() => null));
    if (!sessionRes.ok || !session) {
        throw new functions.https.HttpsError("not-found", "Could not retrieve checkout session");
    }
    const metadata = ((_h = session.metadata) !== null && _h !== void 0 ? _h : {});
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
        await (0, firestore_1.fbGrantCredits)(userId, {
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
    const items = (_j = sub.items) === null || _j === void 0 ? void 0 : _j.data;
    const firstItem = Array.isArray(items) && items[0] && typeof items[0] === "object" ? items[0] : null;
    const price = firstItem && typeof firstItem.price === "object" ? firstItem.price : null;
    const priceId = asString(price === null || price === void 0 ? void 0 : price.id);
    const currentPeriodEnd = typeof sub.current_period_end === "number" ? sub.current_period_end : null;
    const periodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;
    const plan = planFromPriceId(priceId, pricePro, priceStudio, pricePlus, priceProAnnual, priceStudioAnnual, pricePlusAnnual);
    if (plan === "free") {
        throw new functions.https.HttpsError("invalid-argument", "Unknown price");
    }
    const prevProfile = await (0, firestore_1.fbGetProfile)(userId);
    const prevPlan = (_k = prevProfile === null || prevProfile === void 0 ? void 0 : prevProfile.plan) !== null && _k !== void 0 ? _k : "free";
    await (0, firestore_1.fbUpdateProfile)(userId, Object.assign(Object.assign({}, profilePlanPatch(prevPlan, plan)), { stripe_customer_id: customerId || undefined, stripe_subscription_id: subscriptionId, stripe_price_id: priceId || undefined, stripe_current_period_end: periodEndIso || undefined }));
    return { ok: true, plan };
}
//# sourceMappingURL=confirmCheckout.js.map