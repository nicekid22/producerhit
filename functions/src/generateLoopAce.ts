// generateLoopAce.ts — Firebase Cloud Function (Node.js)
// Calls ACE Step API directly (no more Supabase Edge Function proxy)

import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import * as functions from "firebase-functions";

const ACE_BASE_URL = "https://api.acemusic.ai";

// ---------------------------------------------------------------------------
// Auth + Usage helpers (lightweight, inlined to avoid circular deps)
// ---------------------------------------------------------------------------

function getDb() {
  if (!admin.getApps().length) admin.initializeApp();
  return getFirestore();
}

const LIMITS: Record<string, number> = { free: 10, pro: 75, studio: 250, plus: 1000 };

async function verifyToken(request: { auth?: { uid: string } }): Promise<string | null> {
  if (request.auth?.uid) return request.auth.uid;
  return null;
}

async function checkAndBumpUsage(uid: string, generationKey: string | null): Promise<{ ok: boolean; plan: string; used: number; limit: number }> {
  const db = getDb();
  const profileSnap = await db.collection("profiles").doc(uid).get();
  if (!profileSnap.exists) return { ok: true, plan: "free", used: 0, limit: 10 };

  const p = profileSnap.data()!;
  const plan = typeof p.plan === "string" ? p.plan : "free";
  const normalized = LIMITS[plan] !== undefined ? plan : "free";
  const used = typeof p.loops_used_this_month === "number" ? p.loops_used_this_month : 0;
  const baseLimit = LIMITS[normalized] ?? 10;
  const bonus =
    Math.max(0, typeof p.referral_bonus === "number" ? p.referral_bonus : 0) +
    Math.max(0, typeof p.level_bonus === "number" ? p.level_bonus : 0) +
    Math.max(0, typeof p.daily_bonus_month === "number" ? p.daily_bonus_month : 0) +
    Math.max(0, typeof p.purchased_bonus === "number" ? p.purchased_bonus : 0);
  const limit = baseLimit + bonus;

  // Idempotency check
  if (generationKey) {
    const keyDoc = await db.collection("generation_usage_keys").doc(generationKey).get();
    if (keyDoc.exists) return { ok: true, plan, used, limit };
  }

  const ok = used < limit;
  return { ok, plan, used, limit };
}

async function bumpUsage(uid: string, generationKey: string | null): Promise<void> {
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
    const current = snap.data()?.loops_used_this_month ?? 0;
    await profileRef.update({ loops_used_this_month: current + 1 });
  }
}

// ---------------------------------------------------------------------------
// ACE API call
// ---------------------------------------------------------------------------

interface AceRequest {
  model?: string;
  thinking?: boolean;
  use_format?: boolean;
  messages?: Array<{ role: string; content: string }>;
  task_type?: string;
  audio_config?: Record<string, unknown>;
  stream?: boolean;
  lyrics?: string;
  sample_mode?: boolean;
  sample_query?: string;
  batch_size?: number;
  seeds?: number[];
}

async function callAceApi(aceKey: string, body: AceRequest): Promise<Record<string, unknown>> {
  const fetch = (await import("node-fetch")).default;
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
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`ACE API returned non-JSON: ${text.slice(0, 500)}`);
  }
}

function extractAudioUrl(result: Record<string, unknown>): string | null {
  // Try choices[0].message.audio[0]
  const choices = result.choices as Array<Record<string, unknown>> | undefined;
  if (choices?.[0]) {
    const msg = choices[0].message as Record<string, unknown> | undefined;
    const audio = msg?.audio as Array<Record<string, unknown>> | undefined;
    if (audio?.[0]) {
      const url = audio[0].audio_url ?? audio[0].url ?? audio[0].path;
      if (typeof url === "string") return url;
    }
  }
  // Try root level
  const audioUrl = result.audio_url ?? result.url;
  if (typeof audioUrl === "string") return audioUrl;
  return null;
}

function extractMeta(result: Record<string, unknown>): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  const choices = result.choices as Array<Record<string, unknown>> | undefined;
  const content = (choices?.[0] as Record<string, unknown>)?.message as Record<string, unknown> | undefined;
  const contentStr = typeof content?.content === "string" ? content.content : "";

  // Extract metadata from content string
  const bpmMatch = contentStr.match(/BPM:\s*(\d+)/i);
  if (bpmMatch) meta.bpm = Number(bpmMatch[1]);

  const durMatch = contentStr.match(/Duration:\s*(\d+)/i);
  if (durMatch) meta.duration = Number(durMatch[1]);

  const keyMatch = contentStr.match(/Key:\s*([A-Ga-g][#b]?\s*(?:major|minor|maj|min)?)/i);
  if (keyMatch) meta.keyScale = keyMatch[1].trim();

  const tsMatch = contentStr.match(/Time(?:\s*Signature)?:\s*(\d+\/\d+)/i);
  if (tsMatch) meta.timeSignature = tsMatch[1];

  // Extract task_id
  const firstChoice = choices?.[0] as Record<string, unknown> | undefined;
  const msgObj = firstChoice?.message as Record<string, unknown> | undefined;
  const taskId = result.task_id ?? firstChoice?.task_id ?? msgObj?.task_id;
  if (taskId) meta.taskId = String(taskId);

  return meta;
}

// ---------------------------------------------------------------------------
// Cloud Function handler
// ---------------------------------------------------------------------------

export async function generateLoopAceHandler(request: { auth?: { uid: string; token?: Record<string, unknown> }; data: Record<string, unknown> }) {
  const uid = await verifyToken(request);
  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "Not authenticated");
  }

  const body = request.data as Record<string, unknown>;
  const action = String(body.action ?? "generate");

  // ── Handle poll/get_job_audio actions (for async jobs) ────────
  if (action === "poll_job" || action === "get_job_audio") {
    // These are handled by the Edge Function — for now return error
    // TODO: implement job polling in Cloud Functions
    throw new functions.https.HttpsError("unimplemented", "Job polling not yet implemented in Cloud Functions");
  }

  // ── Generate ─────────────────────────────────────────────────
  const aceKey = process.env.ACE_API_KEY ?? "";
  if (!aceKey) {
    throw new functions.https.HttpsError("failed-precondition", "ACE API key not configured");
  }

  // Build ACE request body from the frontend payload
  const aceBody: AceRequest = {
    model: String(body.model ?? "acestep-v15-xl-base"),
    thinking: body.thinking !== false,
    use_format: body.use_format !== false,
    messages: (body.messages as Array<{ role: string; content: string }>) ?? [],
    task_type: String(body.task_type ?? "text2music"),
    audio_config: (body.audio_config as Record<string, unknown>) ?? {},
    stream: false,
  };

  if (body.lyrics) aceBody.lyrics = body.lyrics as string;
  if (body.sample_mode) aceBody.sample_mode = true;
  if (body.sample_query) aceBody.sample_query = body.sample_query as string;
  if (body.batch_size) aceBody.batch_size = body.batch_size as number;
  if (body.seeds) aceBody.seeds = body.seeds as number[];

  const generationKey = (body.generation_key as string) ?? null;

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
