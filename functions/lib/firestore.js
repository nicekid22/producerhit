"use strict";
// firestore.ts — Firebase Admin SDK helpers for Cloud Functions
// Replaces supabase/functions/_shared/firestoreServer.ts (REST API)
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
exports.fbGetProfile = fbGetProfile;
exports.fbUpdateProfile = fbUpdateProfile;
exports.fbGrantCredits = fbGrantCredits;
exports.fbBumpUsage = fbBumpUsage;
exports.fbLogBillingEvent = fbLogBillingEvent;
exports.fbResolveUidByStripeCustomerId = fbResolveUidByStripeCustomerId;
exports.fbRegisterStripeCustomer = fbRegisterStripeCustomer;
exports.fbGetGenerationJob = fbGetGenerationJob;
exports.fbInsertGenerationJob = fbInsertGenerationJob;
exports.fbUpdateGenerationJob = fbUpdateGenerationJob;
exports.fbGetUsageKey = fbGetUsageKey;
exports.fbInsertUsageKey = fbInsertUsageKey;
exports.fbCheckUsageIdempotent = fbCheckUsageIdempotent;
exports.fbBumpUsageIdempotent = fbBumpUsageIdempotent;
exports.fbResetUsageIfNeeded = fbResetUsageIfNeeded;
exports.fbGetLoop = fbGetLoop;
exports.fbUpdateLoop = fbUpdateLoop;
exports.fbGetVoiceProfile = fbGetVoiceProfile;
exports.fbUploadToStorage = fbUploadToStorage;
exports.fbDownloadFromStorage = fbDownloadFromStorage;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
// ---------------------------------------------------------------------------
// Init (lazy — initialized on first call)
// ---------------------------------------------------------------------------
let _db = null;
let _storage = null;
function getDb() {
    if (!_db) {
        if (!admin.getApps().length)
            admin.initializeApp();
        _db = (0, firestore_1.getFirestore)();
    }
    return _db;
}
function getStorageInstance() {
    if (!_storage) {
        if (!admin.getApps().length)
            admin.initializeApp();
        _storage = (0, storage_1.getStorage)();
    }
    return _storage;
}
// ---------------------------------------------------------------------------
// Profile helpers
// ---------------------------------------------------------------------------
async function fbGetProfile(userId) {
    const doc = await getDb().collection("profiles").doc(userId).get();
    if (!doc.exists)
        return null;
    return doc.data();
}
async function fbUpdateProfile(userId, data) {
    const patch = Object.assign(Object.assign({}, data), { updated_at: new Date().toISOString() });
    await getDb().collection("profiles").doc(userId).set(patch, { merge: true });
    return true;
}
async function fbGrantCredits(userId, opts) {
    var _a;
    const { bonusType, credits } = opts;
    if (credits <= 0)
        return;
    const cap = Math.min(credits, 1000);
    const bonusField = bonusType === "purchased" ? "purchased_bonus" : "referral_bonus";
    const profile = await fbGetProfile(userId);
    const currentBonus = (_a = profile === null || profile === void 0 ? void 0 : profile[bonusField]) !== null && _a !== void 0 ? _a : 0;
    await fbUpdateProfile(userId, { [bonusField]: currentBonus + cap });
    await fbLogBillingEvent({
        stripeEventId: opts.idempotencyKey,
        userId,
        eventType: bonusType === "purchased" ? "credit_pack_purchased" : "bonus_granted",
        metadata: { credits: cap, bonus_type: bonusType },
    });
}
async function fbBumpUsage(userId) {
    const profile = await fbGetProfile(userId);
    if (!profile)
        return false;
    const current = typeof profile.loops_used_this_month === "number" ? profile.loops_used_this_month : 0;
    return fbUpdateProfile(userId, { loops_used_this_month: current + 1 });
}
// ---------------------------------------------------------------------------
// Billing helpers
// ---------------------------------------------------------------------------
async function fbLogBillingEvent(opts) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const docId = opts.stripeEventId.replace(/[^a-zA-Z0-9_-]/g, "_");
    await getDb().collection("billing_revenue_events").doc(docId).set({
        stripe_event_id: opts.stripeEventId,
        user_id: (_a = opts.userId) !== null && _a !== void 0 ? _a : null,
        stripe_subscription_id: (_b = opts.stripeSubscriptionId) !== null && _b !== void 0 ? _b : null,
        stripe_invoice_id: (_c = opts.stripeInvoiceId) !== null && _c !== void 0 ? _c : null,
        event_type: opts.eventType,
        plan: (_d = opts.plan) !== null && _d !== void 0 ? _d : null,
        amount_cents: (_e = opts.amountCents) !== null && _e !== void 0 ? _e : null,
        currency: (_f = opts.currency) !== null && _f !== void 0 ? _f : "usd",
        status: (_g = opts.status) !== null && _g !== void 0 ? _g : null,
        metadata: (_h = opts.metadata) !== null && _h !== void 0 ? _h : {},
        created_at: new Date().toISOString(),
    });
}
async function fbResolveUidByStripeCustomerId(customerId) {
    if (!customerId)
        return null;
    const doc = await getDb().collection("stripe_customers").doc(customerId).get();
    if (!doc.exists)
        return null;
    const data = doc.data();
    return (data === null || data === void 0 ? void 0 : data.uid) ? String(data.uid) : null;
}
async function fbRegisterStripeCustomer(userId, customerId) {
    if (!customerId || !userId)
        return;
    await getDb().collection("stripe_customers").doc(customerId).set({
        uid: userId,
        customer_id: customerId,
        created_at: new Date().toISOString(),
    });
}
// ---------------------------------------------------------------------------
// Generation Jobs
// ---------------------------------------------------------------------------
async function fbGetGenerationJob(jobId) {
    const doc = await getDb().collection("generation_jobs").doc(jobId).get();
    if (!doc.exists)
        return null;
    return Object.assign({ id: doc.id }, doc.data());
}
async function fbInsertGenerationJob(data) {
    var _a;
    const now = new Date().toISOString();
    const sanitizedPayload = JSON.parse(JSON.stringify((_a = data.payload) !== null && _a !== void 0 ? _a : {}));
    await getDb().collection("generation_jobs").doc(data.id).set({
        id: data.id,
        user_id: data.user_id,
        generation_key: data.generation_key,
        status: data.status,
        mode: data.mode,
        payload: sanitizedPayload,
        created_at: now,
        updated_at: now,
    });
    return { ok: true };
}
async function fbUpdateGenerationJob(jobId, patch) {
    await getDb().collection("generation_jobs").doc(jobId).set(Object.assign(Object.assign({}, patch), { updated_at: new Date().toISOString() }), { merge: true });
    return true;
}
// ---------------------------------------------------------------------------
// Usage / Idempotency
// ---------------------------------------------------------------------------
async function fbGetUsageKey(key) {
    const doc = await getDb().collection("generation_usage_keys").doc(key).get();
    return doc.exists;
}
async function fbInsertUsageKey(key, userId) {
    try {
        await getDb().collection("generation_usage_keys").doc(key).set({
            key,
            user_id: userId,
            created_at: new Date().toISOString(),
        });
        return true;
    }
    catch (_a) {
        return false;
    }
}
const LIMITS_LOCAL = { free: 10, pro: 75, studio: 250, plus: 1000 };
async function fbCheckUsageIdempotent(userId, generationKey) {
    var _a;
    const profile = await fbGetProfile(userId);
    if (!profile) {
        console.error("fbCheckUsageIdempotent: profile not found for user:", userId);
        return { ok: true, plan: "free", used: 0, limit: 10 };
    }
    const plan = typeof profile.plan === "string" ? profile.plan : "free";
    const normalized = plan === "plus" || plan === "studio" || plan === "pro" ? plan : "free";
    const used = typeof profile.loops_used_this_month === "number" ? profile.loops_used_this_month : 0;
    const baseLimit = (_a = LIMITS_LOCAL[normalized]) !== null && _a !== void 0 ? _a : 10;
    const bonus = Math.max(0, typeof profile.referral_bonus === "number" ? profile.referral_bonus : 0) +
        Math.max(0, typeof profile.level_bonus === "number" ? profile.level_bonus : 0) +
        Math.max(0, typeof profile.daily_bonus_month === "number" ? profile.daily_bonus_month : 0) +
        Math.max(0, typeof profile.purchased_bonus === "number" ? profile.purchased_bonus : 0);
    const limit = baseLimit + bonus;
    const alreadyCounted = await fbGetUsageKey(generationKey);
    const ok = alreadyCounted || used < limit;
    return { ok, plan, used, limit };
}
async function fbBumpUsageIdempotent(userId, generationKey) {
    const keyOk = await fbInsertUsageKey(generationKey, userId);
    if (keyOk) {
        await fbBumpUsage(userId);
    }
    return keyOk;
}
async function fbResetUsageIfNeeded(userId) {
    const profile = await fbGetProfile(userId);
    if (!profile)
        return;
    const resetAt = typeof profile.loops_reset_at === "string" ? profile.loops_reset_at : null;
    if (!resetAt) {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        await fbUpdateProfile(userId, { loops_reset_at: nextMonth.toISOString() });
        return;
    }
    const resetDate = new Date(resetAt);
    if (isNaN(resetDate.getTime()))
        return;
    if (new Date() >= resetDate) {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        await fbUpdateProfile(userId, {
            loops_used_this_month: 0,
            daily_bonus_month: 0,
            loops_reset_at: nextMonth.toISOString(),
        });
    }
}
// ---------------------------------------------------------------------------
// Loops
// ---------------------------------------------------------------------------
async function fbGetLoop(loopId) {
    const doc = await getDb().collection("loops").doc(loopId).get();
    if (!doc.exists)
        return null;
    return Object.assign({ id: doc.id }, doc.data());
}
async function fbUpdateLoop(loopId, data) {
    await getDb().collection("loops").doc(loopId).set(data, { merge: true });
    return true;
}
// ---------------------------------------------------------------------------
// Voice Profiles
// ---------------------------------------------------------------------------
async function fbGetVoiceProfile(profileId, userId) {
    const doc = await getDb().collection("voice_profiles").doc(profileId).get();
    if (!doc.exists)
        return null;
    const data = doc.data();
    if (!data)
        return null;
    if (String(data.user_id) !== userId)
        return null;
    return {
        storage_path: typeof data.storage_path === "string" ? data.storage_path : undefined,
        name: typeof data.name === "string" ? data.name : undefined,
    };
}
// ---------------------------------------------------------------------------
// Cloud Storage
// ---------------------------------------------------------------------------
async function fbUploadToStorage(bucket, path, bytes, contentType) {
    try {
        const file = getStorageInstance().bucket(bucket).file(path);
        await file.save(Buffer.from(bytes), { contentType, public: true });
        const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
        return { url };
    }
    catch (err) {
        return { error: String(err) };
    }
}
async function fbDownloadFromStorage(bucket, path) {
    var _a;
    try {
        const file = getStorageInstance().bucket(bucket).file(path);
        const [bytes] = await file.download();
        const [metadata] = await file.getMetadata();
        return { bytes: new Uint8Array(bytes), mime: (_a = metadata.contentType) !== null && _a !== void 0 ? _a : "application/octet-stream" };
    }
    catch (err) {
        return { error: String(err) };
    }
}
//# sourceMappingURL=firestore.js.map