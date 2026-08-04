"use strict";
// index.ts — Firebase Cloud Functions entry point
// Exports all functions for deployment via `firebase deploy --only functions`
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
exports.generateLoopAce = exports.ensureProfile = exports.stripeWebhook = exports.createPortal = exports.confirmCheckout = exports.createCheckout = void 0;
const params_1 = require("firebase-functions/params");
// ── Secrets ────────────────────────────────────────────────────
const STRIPE_SECRET_KEY = (0, params_1.defineSecret)("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = (0, params_1.defineSecret)("STRIPE_WEBHOOK_SECRET");
const STRIPE_PRICE_ID_PRO = (0, params_1.defineSecret)("STRIPE_PRICE_ID_PRO");
const STRIPE_PRICE_ID_STUDIO = (0, params_1.defineSecret)("STRIPE_PRICE_ID_STUDIO");
const STRIPE_PRICE_ID_PLUS = (0, params_1.defineSecret)("STRIPE_PRICE_ID_PLUS");
const STRIPE_PRICE_ID_PRO_ANNUAL = (0, params_1.defineSecret)("STRIPE_PRICE_ID_PRO_ANNUAL");
const STRIPE_PRICE_ID_STUDIO_ANNUAL = (0, params_1.defineSecret)("STRIPE_PRICE_ID_STUDIO_ANNUAL");
const STRIPE_PRICE_ID_PLUS_ANNUAL = (0, params_1.defineSecret)("STRIPE_PRICE_ID_PLUS_ANNUAL");
const STRIPE_PRICE_ID_CREDIT_PACK_50 = (0, params_1.defineSecret)("STRIPE_PRICE_ID_CREDIT_PACK_50");
const ACE_API_KEY = (0, params_1.defineSecret)("ACE_API_KEY");
const stripeSecrets = [
    STRIPE_SECRET_KEY,
    STRIPE_PRICE_ID_PRO,
    STRIPE_PRICE_ID_STUDIO,
    STRIPE_PRICE_ID_PLUS,
    STRIPE_PRICE_ID_PRO_ANNUAL,
    STRIPE_PRICE_ID_STUDIO_ANNUAL,
    STRIPE_PRICE_ID_PLUS_ANNUAL,
    STRIPE_PRICE_ID_CREDIT_PACK_50,
];
// ── Import function modules ────────────────────────────────────
const createCheckout_1 = require("./createCheckout");
const confirmCheckout_1 = require("./confirmCheckout");
const createPortal_1 = require("./createPortal");
const stripeWebhook_1 = require("./stripeWebhook");
const ensureProfile_1 = require("./ensureProfile");
const generateLoopAce_1 = require("./generateLoopAce");
const functions = __importStar(require("firebase-functions"));
// ── Export functions with secrets bound ─────────────────────────
exports.createCheckout = functions.https.onCall({ secrets: stripeSecrets }, createCheckout_1.createCheckoutHandler);
exports.confirmCheckout = functions.https.onCall({ secrets: stripeSecrets }, confirmCheckout_1.confirmCheckoutHandler);
exports.createPortal = functions.https.onCall({ secrets: [STRIPE_SECRET_KEY] }, createPortal_1.createPortalHandler);
exports.stripeWebhook = functions.https.onRequest({ secrets: [STRIPE_WEBHOOK_SECRET, ...stripeSecrets] }, stripeWebhook_1.stripeWebhookHandler);
exports.ensureProfile = functions.https.onCall({}, ensureProfile_1.ensureProfileHandler);
exports.generateLoopAce = functions.https.onCall({ secrets: [ACE_API_KEY] }, generateLoopAce_1.generateLoopAceHandler);
//# sourceMappingURL=index.js.map