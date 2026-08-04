"use strict";
// ensureProfile.ts — Firebase Cloud Function (Node.js)
// Port of supabase/functions/ensure-profile/index.ts
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
exports.ensureProfileHandler = ensureProfileHandler;
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("./firestore");
function referralCode() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < 8; i++)
        out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}
async function ensureProfileHandler(request) {
    var _a, _b;
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const uid = request.auth.uid;
    const email = (_b = (_a = request.auth.token) === null || _a === void 0 ? void 0 : _a.email) !== null && _b !== void 0 ? _b : null;
    const existing = await (0, firestore_1.fbGetProfile)(uid);
    if (existing) {
        return { ok: true, status: "exists", id: uid };
    }
    await (0, firestore_1.fbUpdateProfile)(uid, {
        plan: "free",
        loops_used_this_month: 0,
        referral_code: referralCode(),
        referral_bonus: 0,
        level_bonus: 0,
        daily_bonus_month: 0,
        purchased_bonus: 0,
        email: email || undefined,
    });
    return { ok: true, status: "created", id: uid };
}
//# sourceMappingURL=ensureProfile.js.map