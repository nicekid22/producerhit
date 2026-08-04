"use strict";
// generateLoopAce.ts — Firebase Cloud Function (Node.js)
// Calls ACE Step API directly (no more Supabase Edge Function proxy)
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
exports.generateLoopAceHandler = generateLoopAceHandler;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const functions = __importStar(require("firebase-functions"));
const ACE_BASE_URL = "https://api.acemusic.ai";
// ---------------------------------------------------------------------------
// Auth + Usage helpers (lightweight, inlined to avoid circular deps)
// ---------------------------------------------------------------------------
function getDb() {
    if (!admin.getApps().length)
        admin.initializeApp();
    return (0, firestore_1.getFirestore)();
}
const LIMITS = { free: 10, pro: 75, studio: 250, plus: 1000 };
async function verifyToken(request) {
    var _a;
    if ((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)
        return request.auth.uid;
    return null;
}
async function checkAndBumpUsage(uid, generationKey) {
    var _a;
    const db = getDb();
    const profileSnap = await db.collection("profiles").doc(uid).get();
    if (!profileSnap.exists)
        return { ok: true, plan: "free", used: 0, limit: 10 };
    const p = profileSnap.data();
    const plan = typeof p.plan === "string" ? p.plan : "free";
    const normalized = LIMITS[plan] !== undefined ? plan : "free";
    const used = typeof p.loops_used_this_month === "number" ? p.loops_used_this_month : 0;
    const baseLimit = (_a = LIMITS[normalized]) !== null && _a !== void 0 ? _a : 10;
    const bonus = Math.max(0, typeof p.referral_bonus === "number" ? p.referral_bonus : 0) +
        Math.max(0, typeof p.level_bonus === "number" ? p.level_bonus : 0) +
        Math.max(0, typeof p.daily_bonus_month === "number" ? p.daily_bonus_month : 0) +
        Math.max(0, typeof p.purchased_bonus === "number" ? p.purchased_bonus : 0);
    const limit = baseLimit + bonus;
    // Idempotency check
    if (generationKey) {
        const keyDoc = await db.collection("generation_usage_keys").doc(generationKey).get();
        if (keyDoc.exists)
            return { ok: true, plan, used, limit };
    }
    const ok = used < limit;
    return { ok, plan, used, limit };
}
async function bumpUsage(uid, generationKey) {
    var _a, _b;
    const db = getDb();
    if (generationKey) {
        await db.collection("generation_usage_keys").doc(generationKey).set({
            key: generationKey,
            user_id: uid,
            created_at: new Date().toISOString(),
        });
    }
    const profileRef = db.collection("profiles").doc(uid);
    const snap = await profileRef.get();
    if (snap.exists) {
        const current = (_b = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.loops_used_this_month) !== null && _b !== void 0 ? _b : 0;
        await profileRef.update({ loops_used_this_month: current + 1 });
    }
}
async function callAceApi(aceKey, body) {
    const fetch = (await Promise.resolve().then(() => __importStar(require("node-fetch")))).default;
    const res = await fetch(`${ACE_BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${aceKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(body),
        timeout: 120000, // 2 min timeout
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
        throw new Error(`ACE API error ${res.status}: ${text.slice(0, 500)}`);
    }
    try {
        return JSON.parse(text);
    }
    catch (_a) {
        throw new Error(`ACE API returned non-JSON: ${text.slice(0, 500)}`);
    }
}
function extractAudioUrl(result) {
    var _a, _b, _c;
    // Try choices[0].message.audio[0]
    const choices = result.choices;
    if (choices === null || choices === void 0 ? void 0 : choices[0]) {
        const msg = choices[0].message;
        const audio = msg === null || msg === void 0 ? void 0 : msg.audio;
        if (audio === null || audio === void 0 ? void 0 : audio[0]) {
            const url = (_b = (_a = audio[0].audio_url) !== null && _a !== void 0 ? _a : audio[0].url) !== null && _b !== void 0 ? _b : audio[0].path;
            if (typeof url === "string")
                return url;
        }
    }
    // Try root level
    const audioUrl = (_c = result.audio_url) !== null && _c !== void 0 ? _c : result.url;
    if (typeof audioUrl === "string")
        return audioUrl;
    return null;
}
function extractMeta(result) {
    var _a, _b, _c;
    const meta = {};
    const choices = result.choices;
    const content = (_a = choices === null || choices === void 0 ? void 0 : choices[0]) === null || _a === void 0 ? void 0 : _a.message;
    const contentStr = typeof (content === null || content === void 0 ? void 0 : content.content) === "string" ? content.content : "";
    // Extract metadata from content string
    const bpmMatch = contentStr.match(/BPM:\s*(\d+)/i);
    if (bpmMatch)
        meta.bpm = Number(bpmMatch[1]);
    const durMatch = contentStr.match(/Duration:\s*(\d+)/i);
    if (durMatch)
        meta.duration = Number(durMatch[1]);
    const keyMatch = contentStr.match(/Key:\s*([A-Ga-g][#b]?\s*(?:major|minor|maj|min)?)/i);
    if (keyMatch)
        meta.keyScale = keyMatch[1].trim();
    const tsMatch = contentStr.match(/Time(?:\s*Signature)?:\s*(\d+\/\d+)/i);
    if (tsMatch)
        meta.timeSignature = tsMatch[1];
    // Extract task_id
    const firstChoice = choices === null || choices === void 0 ? void 0 : choices[0];
    const msgObj = firstChoice === null || firstChoice === void 0 ? void 0 : firstChoice.message;
    const taskId = (_c = (_b = result.task_id) !== null && _b !== void 0 ? _b : firstChoice === null || firstChoice === void 0 ? void 0 : firstChoice.task_id) !== null && _c !== void 0 ? _c : msgObj === null || msgObj === void 0 ? void 0 : msgObj.task_id;
    if (taskId)
        meta.taskId = String(taskId);
    return meta;
}
// ---------------------------------------------------------------------------
// Cloud Function handler
// ---------------------------------------------------------------------------
async function generateLoopAceHandler(request) {
    var _a, _b, _c, _d, _e, _f, _g;
    const uid = await verifyToken(request);
    if (!uid) {
        throw new functions.https.HttpsError("unauthenticated", "Not authenticated");
    }
    const body = request.data;
    const action = String((_a = body.action) !== null && _a !== void 0 ? _a : "generate");
    // ── Handle poll/get_job_audio actions (for async jobs) ────────
    if (action === "poll_job" || action === "get_job_audio") {
        // These are handled by the Edge Function — for now return error
        // TODO: implement job polling in Cloud Functions
        throw new functions.https.HttpsError("unimplemented", "Job polling not yet implemented in Cloud Functions");
    }
    // ── Generate ─────────────────────────────────────────────────
    const aceKey = (_b = process.env.ACE_API_KEY) !== null && _b !== void 0 ? _b : "";
    if (!aceKey) {
        throw new functions.https.HttpsError("failed-precondition", "ACE API key not configured");
    }
    // Build ACE request body from the frontend payload
    const aceBody = {
        model: String((_c = body.model) !== null && _c !== void 0 ? _c : "acestep-v15-xl-turbo"),
        thinking: body.thinking !== false,
        use_format: body.use_format !== false,
        messages: (_d = body.messages) !== null && _d !== void 0 ? _d : [],
        task_type: String((_e = body.task_type) !== null && _e !== void 0 ? _e : "text2music"),
        audio_config: (_f = body.audio_config) !== null && _f !== void 0 ? _f : {},
        stream: false,
    };
    if (body.lyrics)
        aceBody.lyrics = body.lyrics;
    if (body.sample_mode)
        aceBody.sample_mode = true;
    if (body.sample_query)
        aceBody.sample_query = body.sample_query;
    if (body.batch_size)
        aceBody.batch_size = body.batch_size;
    if (body.seeds)
        aceBody.seeds = body.seeds;
    const generationKey = (_g = body.generation_key) !== null && _g !== void 0 ? _g : null;
    // Check usage
    const usage = await checkAndBumpUsage(uid, generationKey);
    if (!usage.ok) {
        return {
            error: "Monthly limit reached",
            limitReached: true,
            plan: usage.plan,
            limit: usage.limit,
            used: usage.used,
        };
    }
    // Call ACE
    const result = await callAceApi(aceKey, aceBody);
    // Extract audio URL
    const audioUrl = extractAudioUrl(result);
    if (!audioUrl) {
        throw new functions.https.HttpsError("internal", "ACE returned no audio URL");
    }
    // Build full URL if relative
    const fullAudioUrl = audioUrl.startsWith("http") ? audioUrl : `${ACE_BASE_URL}${audioUrl}`;
    // Extract metadata
    const meta = extractMeta(result);
    // Bump usage
    await bumpUsage(uid, generationKey);
    return { audioUrl: fullAudioUrl, meta };
}
//# sourceMappingURL=generateLoopAce.js.map