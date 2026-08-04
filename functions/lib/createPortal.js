"use strict";
// createPortal.ts — Firebase Cloud Function (Node.js)
// Port of supabase/functions/create-portal/index.ts
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
exports.createPortalHandler = createPortalHandler;
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("./firestore");
async function createPortalHandler(request) {
    var _a, _b;
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Not authenticated");
    }
    const userId = request.auth.uid;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey)
        throw new functions.https.HttpsError("failed-precondition", "Missing STRIPE_SECRET_KEY");
    const fbProfile = await (0, firestore_1.fbGetProfile)(userId);
    const customerId = (_a = fbProfile === null || fbProfile === void 0 ? void 0 : fbProfile.stripe_customer_id) !== null && _a !== void 0 ? _a : "";
    if (!customerId)
        throw new functions.https.HttpsError("failed-precondition", "No Stripe customer");
    const returnUrl = typeof ((_b = request.data) === null || _b === void 0 ? void 0 : _b.returnUrl) === "string" ? request.data.returnUrl : "";
    const fetch = (await Promise.resolve().then(() => __importStar(require("node-fetch")))).default;
    const portalRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${stripeKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            customer: customerId,
            return_url: returnUrl,
        }).toString(),
    });
    const portalJson = (await portalRes.json().catch(() => null));
    const url = typeof (portalJson === null || portalJson === void 0 ? void 0 : portalJson.url) === "string" ? portalJson.url : null;
    if (!url)
        throw new functions.https.HttpsError("failed-precondition", "Stripe response missing portal URL");
    return { url };
}
//# sourceMappingURL=createPortal.js.map