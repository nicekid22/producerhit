"use strict";
// createCheckout.ts — Firebase Cloud Function (Node.js)
// Port of supabase/functions/create-checkout/index.ts
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
exports.createCheckoutHandler = createCheckoutHandler;
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("./firestore");
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PLAN_NAMES = { pro: "Pro", studio: "Studio", plus: "Plus" };
const PAID_PLANS = new Set(["pro", "studio", "plus"]);
const CREDIT_PACKS = {
    credit_pack_50: { credits: 50, label: "50 generations" },
};
function planRank(plan) {
    if (plan === "plus")
        return 3;
    if (plan === "studio")
        return 2;
    if (plan === "pro")
        return 1;
    return 0;
}
function asString(v) {
    return typeof v === "string" ? v : "";
}
// ---------------------------------------------------------------------------
// Stripe helpers (REST API)
// ---------------------------------------------------------------------------
async function fetchSubscription(stripeKey, subscriptionId) {
    var _a, _b;
    const fetch = (await Promise.resolve().then(() => __importStar(require("node-fetch")))).default;
    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const json = (await res.json().catch(() => null));
    if (!res.ok) {
        const msg = json && typeof json === "object" && "error" in json
            ? String((_b = (_a = json.error) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : "Stripe subscription fetch failed")
            : "Stripe subscription fetch failed";
        throw new functions.https.HttpsError("internal", msg);
    }
    return json !== null && json !== void 0 ? json : {};
}
async function upgradeExistingSubscription(stripeKey, subscriptionId, priceId, plan, userId) {
    var _a, _b, _c;
    const fetch = (await Promise.resolve().then(() => __importStar(require("node-fetch")))).default;
    const sub = await fetchSubscription(stripeKey, subscriptionId);
    const status = asString(sub.status);
    if (status !== "active" && status !== "trialing") {
        throw new functions.https.HttpsError("failed-precondition", "Subscription is not active");
    }
    const items = (_a = sub.items) === null || _a === void 0 ? void 0 : _a.data;
    const firstItem = Array.isArray(items) && items[0] && typeof items[0] === "object" ? items[0] : null;
    const itemId = asString(firstItem === null || firstItem === void 0 ? void 0 : firstItem.id);
    if (!itemId)
        throw new functions.https.HttpsError("internal", "Missing subscription item");
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
    const updateJson = (await updateRes.json().catch(() => null));
    if (!updateRes.ok) {
        const msg = updateJson && typeof updateJson === "object" && "error" in updateJson
            ? String((_c = (_b = updateJson.error) === null || _b === void 0 ? void 0 : _b.message) !== null && _c !== void 0 ? _c : "Stripe subscription update failed")
            : "Stripe subscription update failed";
        throw new functions.https.HttpsError("internal", msg);
    }
    return updateJson !== null && updateJson !== void 0 ? updateJson : {};
}
function subscriptionPriceId(sub) {
    var _a;
    const items = (_a = sub.items) === null || _a === void 0 ? void 0 : _a.data;
    const firstItem = Array.isArray(items) && items[0] && typeof items[0] === "object" ? items[0] : null;
    const price = firstItem && typeof firstItem.price === "object" ? firstItem.price : null;
    return asString(price === null || price === void 0 ? void 0 : price.id);
}
async function syncProfilePlanFB(userId, plan, customerId, subscriptionId, priceId, currentPeriodEnd) {
    const periodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;
    await (0, firestore_1.fbUpdateProfile)(userId, {
        plan,
        stripe_customer_id: customerId || undefined,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId || undefined,
        stripe_current_period_end: periodEndIso || undefined,
    });
    if (customerId) {
        await (0, firestore_1.fbRegisterStripeCustomer)(userId, customerId);
    }
}
function planFromEnvPriceId(priceId, pricePro, priceStudio, pricePlus, priceProAnnual, priceStudioAnnual, pricePlusAnnual) {
    if (priceId && (priceId === pricePro || priceId === priceProAnnual))
        return "pro";
    if (priceId && (priceId === priceStudio || priceId === priceStudioAnnual))
        return "studio";
    if (priceId && (priceId === pricePlus || priceId === pricePlusAnnual))
        return "plus";
    return "free";
}
function priceIdForPlan(plan, interval, pricePro, priceStudio, pricePlus, priceProAnnual, priceStudioAnnual, pricePlusAnnual) {
    const annual = interval === "year";
    if (plan === "pro")
        return annual ? priceProAnnual : pricePro;
    if (plan === "studio")
        return annual ? priceStudioAnnual : priceStudio;
    if (plan === "plus")
        return annual ? pricePlusAnnual : pricePlus;
    return "";
}
async function clearStaleBillingFB(userId) {
    await (0, firestore_1.fbUpdateProfile)(userId, {
        plan: "free",
        stripe_subscription_id: undefined,
        stripe_price_id: undefined,
        stripe_current_period_end: undefined,
    });
}
async function createStripeCheckoutSession(stripeKey, params, stripeVersion) {
    const fetch = (await Promise.resolve().then(() => __importStar(require("node-fetch")))).default;
    const headers = {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
    };
    if (stripeVersion)
        headers["Stripe-Version"] = stripeVersion;
    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers,
        body: params.toString(),
    });
    const session = (await stripeRes.json().catch(() => null));
    return { ok: stripeRes.ok, session };
}
function stripeErrorMessage(session) {
    var _a;
    return typeof ((_a = session === null || session === void 0 ? void 0 : session.error) === null || _a === void 0 ? void 0 : _a.message) === "string" ? session.error.message : "Stripe error";
}
// ---------------------------------------------------------------------------
// Branding
// ---------------------------------------------------------------------------
function brandingPalette(visualTheme, cloudAccent, plan) {
    var _a;
    if (visualTheme === "cloud") {
        const buttons = {
            transparent: "#8a9cff",
            green: "#7ec850",
            red: "#e87858",
            blue: "#58a8e8",
        };
        return { background: "#f5f5f7", button: (_a = buttons[cloudAccent]) !== null && _a !== void 0 ? _a : buttons.transparent };
    }
    if (visualTheme === "warm-glass") {
        return { background: "#261008", button: "#d4845a" };
    }
    return {
        background: "#0f0d18",
        button: plan === "pro" ? "#5eb8ff" : "#9d7cff",
    };
}
function applyCheckoutBranding(params, plan, visualTheme, cloudAccent) {
    const palette = brandingPalette(visualTheme, cloudAccent, plan);
    params.set("branding_settings[background_color]", palette.background);
    params.set("branding_settings[button_color]", palette.button);
    params.set("branding_settings[font_family]", "inter");
    params.set("branding_settings[border_style]", "rounded");
    params.set("branding_settings[display_name]", "ProducerHit");
}
function stripCheckoutBranding(params) {
    const next = new URLSearchParams(params);
    for (const key of [...next.keys()]) {
        if (key.startsWith("branding_settings"))
            next.delete(key);
    }
    return next;
}
function buildEmbeddedReturnUrl(successUrl) {
    if (successUrl.includes("{CHECKOUT_SESSION_ID}"))
        return successUrl;
    const join = successUrl.includes("?") ? "&" : "?";
    return `${successUrl}${join}session_id={CHECKOUT_SESSION_ID}`;
}
// ---------------------------------------------------------------------------
// Build checkout params
// ---------------------------------------------------------------------------
function buildCreditPackCheckoutParams(priceId, product, credits, userId, customerId, customerEmail, visualTheme, cloudAccent, locale) {
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
    if (customerId)
        params.set("customer", customerId);
    else if (customerEmail)
        params.set("customer_email", customerEmail);
    params.set("locale", locale === "fr" ? "fr" : "auto");
    if (locale === "fr") {
        params.set("custom_text[submit][message]", "Confirmer l'achat");
    }
    applyCheckoutBranding(params, "pro", visualTheme, cloudAccent);
    return params;
}
function buildBaseCheckoutParams(priceId, plan, userId, customerId, customerEmail, visualTheme, cloudAccent, locale, checkoutRecovery = false) {
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
    if (customerId)
        params.set("customer", customerId);
    else if (customerEmail)
        params.set("customer_email", customerEmail);
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
async function createEmbeddedCheckoutSession(stripeKey, baseParams, successUrl) {
    var _a;
    const attempts = [
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
    let lastCode;
    for (const params of attempts) {
        const { ok, session } = await createStripeCheckoutSession(stripeKey, params);
        const clientSecret = typeof (session === null || session === void 0 ? void 0 : session.client_secret) === "string" ? session.client_secret : null;
        if (ok && clientSecret)
            return { clientSecret };
        lastError = stripeErrorMessage(session);
        lastCode = typeof ((_a = session === null || session === void 0 ? void 0 : session.error) === null || _a === void 0 ? void 0 : _a.code) === "string" ? session.error.code : undefined;
    }
    return { error: lastError, code: lastCode };
}
async function createHostedCheckoutSession(stripeKey, baseParams, successUrl, cancelUrl) {
    var _a;
    const attempts = [
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
    let lastCode;
    for (const params of attempts) {
        const { ok, session } = await createStripeCheckoutSession(stripeKey, params);
        const checkoutUrl = typeof (session === null || session === void 0 ? void 0 : session.url) === "string" ? session.url : null;
        if (ok && checkoutUrl)
            return { url: checkoutUrl };
        lastError = stripeErrorMessage(session);
        lastCode = typeof ((_a = session === null || session === void 0 ? void 0 : session.error) === null || _a === void 0 ? void 0 : _a.code) === "string" ? session.error.code : undefined;
    }
    return { error: lastError, code: lastCode };
}
// ---------------------------------------------------------------------------
// Cloud Function: createCheckout
// ---------------------------------------------------------------------------
async function createCheckoutHandler(request) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Not authenticated");
    }
    const userId = request.auth.uid;
    const userEmail = (_b = (_a = request.auth.token) === null || _a === void 0 ? void 0 : _a.email) !== null && _b !== void 0 ? _b : undefined;
    const body = request.data;
    const plan = String((_c = body.plan) !== null && _c !== void 0 ? _c : "");
    const product = String((_d = body.product) !== null && _d !== void 0 ? _d : "");
    const successUrl = String((_e = body.successUrl) !== null && _e !== void 0 ? _e : "");
    const cancelUrl = String((_f = body.cancelUrl) !== null && _f !== void 0 ? _f : "");
    const uiMode = String((_g = body.uiMode) !== null && _g !== void 0 ? _g : "embedded");
    const visualTheme = String((_h = body.visualTheme) !== null && _h !== void 0 ? _h : "prism");
    const cloudAccent = String((_j = body.cloudAccent) !== null && _j !== void 0 ? _j : "transparent");
    const checkoutLocale = String((_k = body.locale) !== null && _k !== void 0 ? _k : "auto");
    const checkoutRecovery = body.checkoutRecovery === true || body.checkoutRecovery === "true";
    const billingIntervalRaw = String((_l = body.billingInterval) !== null && _l !== void 0 ? _l : "month");
    const billingInterval = billingIntervalRaw === "year" ? "year" : "month";
    const embedded = uiMode === "embedded";
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const pricePro = (_m = process.env.STRIPE_PRICE_ID_PRO) !== null && _m !== void 0 ? _m : "";
    const priceStudio = (_o = process.env.STRIPE_PRICE_ID_STUDIO) !== null && _o !== void 0 ? _o : "";
    const pricePlus = (_p = process.env.STRIPE_PRICE_ID_PLUS) !== null && _p !== void 0 ? _p : "";
    const priceProAnnual = (_q = process.env.STRIPE_PRICE_ID_PRO_ANNUAL) !== null && _q !== void 0 ? _q : "";
    const priceStudioAnnual = (_r = process.env.STRIPE_PRICE_ID_STUDIO_ANNUAL) !== null && _r !== void 0 ? _r : "";
    const pricePlusAnnual = (_s = process.env.STRIPE_PRICE_ID_PLUS_ANNUAL) !== null && _s !== void 0 ? _s : "";
    const priceCreditPack50 = (_t = process.env.STRIPE_PRICE_ID_CREDIT_PACK_50) !== null && _t !== void 0 ? _t : "";
    if (!successUrl.startsWith("http")) {
        throw new functions.https.HttpsError("invalid-argument", "Missing successUrl");
    }
    if (!embedded && !cancelUrl.startsWith("http")) {
        throw new functions.https.HttpsError("invalid-argument", "Missing cancelUrl");
    }
    const fbProfile = await (0, firestore_1.fbGetProfile)(userId);
    const customerId = (_u = fbProfile === null || fbProfile === void 0 ? void 0 : fbProfile.stripe_customer_id) !== null && _u !== void 0 ? _u : "";
    // ── Credit Pack ──────────────────────────────────────────────
    if (product === "credit_pack_50") {
        if (!stripeKey || !priceCreditPack50) {
            return { mock: true, message: "Credit packs not configured yet" };
        }
        const pack = CREDIT_PACKS.credit_pack_50;
        const baseParams = buildCreditPackCheckoutParams(priceCreditPack50, product, pack.credits, userId, customerId, userEmail !== null && userEmail !== void 0 ? userEmail : "", visualTheme, cloudAccent, checkoutLocale);
        if (embedded) {
            const er = await createEmbeddedCheckoutSession(stripeKey, baseParams, successUrl);
            if ("clientSecret" in er)
                return { clientSecret: er.clientSecret, uiMode: "embedded", product };
            const hr = await createHostedCheckoutSession(stripeKey, baseParams, successUrl, cancelUrl);
            if ("url" in hr)
                return { url: hr.url, uiMode: "hosted", fallback: true, product };
            throw new functions.https.HttpsError("failed-precondition", hr.error);
        }
        const hr = await createHostedCheckoutSession(stripeKey, baseParams, successUrl, cancelUrl);
        if ("url" in hr)
            return { url: hr.url, uiMode: "hosted", product };
        throw new functions.https.HttpsError("failed-precondition", hr.error);
    }
    // ── Subscription ─────────────────────────────────────────────
    if (!stripeKey || !pricePro || !priceStudio || !pricePlus) {
        return { mock: true, message: "Stripe not configured yet" };
    }
    const planName = PLAN_NAMES[plan];
    if (!planName)
        throw new functions.https.HttpsError("invalid-argument", "Invalid plan: " + plan);
    const priceId = priceIdForPlan(plan, billingInterval, pricePro, priceStudio, pricePlus, priceProAnnual, priceStudioAnnual, pricePlusAnnual);
    if (!priceId) {
        if (billingInterval === "year") {
            throw new functions.https.HttpsError("unimplemented", "Annual billing not configured. Please choose monthly or contact support.");
        }
        throw new functions.https.HttpsError("invalid-argument", "Invalid plan: " + plan);
    }
    let subscriptionId = (_v = fbProfile === null || fbProfile === void 0 ? void 0 : fbProfile.stripe_subscription_id) !== null && _v !== void 0 ? _v : "";
    let currentPlan = (_w = fbProfile === null || fbProfile === void 0 ? void 0 : fbProfile.plan) !== null && _w !== void 0 ? _w : "free";
    if (subscriptionId) {
        let subActive = false;
        let subRecord = null;
        try {
            subRecord = await fetchSubscription(stripeKey, subscriptionId);
            const status = asString(subRecord.status);
            subActive = status === "active" || status === "trialing";
        }
        catch (_x) {
            subActive = false;
        }
        if (!subActive) {
            await clearStaleBillingFB(userId);
            subscriptionId = "";
            currentPlan = "free";
        }
        else if (subRecord && !PAID_PLANS.has(currentPlan)) {
            const subPriceId = subscriptionPriceId(subRecord);
            const healedPlan = planFromEnvPriceId(subPriceId, pricePro, priceStudio, pricePlus, priceProAnnual, priceStudioAnnual, pricePlusAnnual);
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
    const baseParams = buildBaseCheckoutParams(priceId, plan, userId, customerId, userEmail !== null && userEmail !== void 0 ? userEmail : "", visualTheme, cloudAccent, checkoutLocale, checkoutRecovery);
    if (embedded) {
        const er = await createEmbeddedCheckoutSession(stripeKey, baseParams, successUrl);
        if ("clientSecret" in er)
            return { clientSecret: er.clientSecret, uiMode: "embedded" };
        const hr = await createHostedCheckoutSession(stripeKey, baseParams, successUrl, cancelUrl);
        if ("url" in hr)
            return { url: hr.url, uiMode: "hosted", fallback: true };
        throw new functions.https.HttpsError("failed-precondition", hr.error);
    }
    const hr = await createHostedCheckoutSession(stripeKey, baseParams, successUrl, cancelUrl);
    if ("url" in hr)
        return { url: hr.url, uiMode: "hosted" };
    throw new functions.https.HttpsError("failed-precondition", hr.error);
}
//# sourceMappingURL=createCheckout.js.map