// generateLoopAce.ts — Firebase Cloud Function (Node.js)
// Calls ACE Step API directly (no more Supabase Edge Function proxy)

import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import * as functions from "firebase-functions";
import { env } from "./env";

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
// LM instruction rules (ported from supabase/functions/_shared/aceChatCompletions.ts)
// ---------------------------------------------------------------------------

const ACE_BEAT_LM_RULES = "Instrumental beat only. No lead vocals, no rapped verses, no lyrics section. Vocal chops allowed only as short non-lyrical texture.";

const ACE_SONG_LM_RULES = [
  "Write singable lyrics with ACE section markers: [intro], [verse], [pre-chorus], [chorus], [bridge], [outro].",
  "Each sung line must be 4-8 syllables maximum.",
  "Repeat the chorus lyrics identically every time.",
  "Vocal delivery: controlled phrasing, clean studio vocal, steady pitch.",
  "Replace any parenthetical stage directions with real short singable lines.",
  "When no user lyrics are provided: invent original song words that fit the genre mood.",
  "**Caption:** must be a short prose musical description (instruments, groove, energy) — not a tag list.",
  "## Lyrics must contain real singable words only — never copy Caption tags, BPM, vocal language, or production instructions.",
].join(" ");

const ACE_AI_COMPOSE_SONG_LM_RULES = [
  "CRITICAL: The singer performs the ## Lyrics you write — not the Caption metadata.",
  "Never put comma-separated tags, technical directions, or the words \"vocal style\" / \"vocal language\" in ## Lyrics.",
  "This is a vocal song with a lead singer — not instrumental, not a beat, not an arrangement sketch.",
].join(" ");

const MELODY_COMPOSITION_ACE_RULES = [
  "TASK: Melody-only sample pack composition for beatmakers (ProducerGrind / Beatstars style).",
  "CRITICAL — generate ZERO drums: no kick, snare, clap, hi-hat, percussion loop, trap drums, 808 bass, or beat programming.",
  "Only melodic/harmonic layers: keys, guitar, synth, pads, optional musical bass line (not 808), optional pitched vocal chops.",
  "This is NOT a beat and NOT a full song with vocals — it is an instrumental composition the producer will chop and add drums to in their DAW.",
  "Do not output any lyrics text. Omit the '## Lyrics' section entirely.",
].join(" ");

/**
 * Build the ACE chat completions message content from frontend payload fields.
 * This mirrors the logic in supabase/functions/_shared/aceChatCompletions.ts
 * and supabase/functions/_shared/aceSampleMode.ts
 */
function buildMessageContent(body: Record<string, unknown>): string {
  const caption = String(body.caption ?? "").trim();
  const lyrics = String(body.lyrics ?? "").trim();
  const instrumental = body.instrumental !== false;
  const sampleMode = body.sampleMode === true || body.sample_mode === true;
  const sampleQuery = String(body.sampleQuery ?? body.sample_query ?? "").trim();
  const melodyComposition = body.melodyComposition === true;
  const genre = String(body.genre ?? "").trim();
  const mood = String(body.mood ?? "").trim();
  const energyLevel = String(body.energyLevel ?? "").trim();
  const bpm = typeof body.bpm === "number" ? body.bpm : 0;
  const key = String(body.key ?? "").trim();
  const scale = String(body.scale ?? "").trim();
  const timeSignature = String(body.timeSignature ?? body.time_signature ?? "").trim();
  const vocalLanguage = String(body.vocalLanguage ?? body.vocal_language ?? "en").trim();
  const vocalStyle = String(body.vocalStyle ?? "").trim();
  const autoMeta = body.autoMeta === true;

  // Sample mode: simple natural language query
  if (sampleMode) {
    let msg = sampleQuery || caption;
    if (caption && caption !== msg) {
      const head = caption.slice(0, Math.min(40, caption.length)).toLowerCase();
      if (!msg.toLowerCase().includes(head)) {
        msg = `${msg}\n\nProduction style tags (sound design only — the singer must NOT recite these words in lyrics): ${caption}`;
      }
    }
    if (vocalLanguage && vocalLanguage !== "en") {
      const labels: Record<string, string> = { fr: "French", es: "Spanish", pt: "Portuguese", it: "Italian", de: "German", ja: "Japanese", ko: "Korean", zh: "Chinese", ar: "Arabic", ru: "Russian" };
      const label = labels[vocalLanguage] ?? vocalLanguage.toUpperCase();
      msg = `${msg}\n\nAll ## Lyrics must be written entirely in ${label} (native words, not English).`;
    }
    return msg;
  }

  // Normal mode: build parts array
  const parts: string[] = [];
  const baseCaption = caption || String(body.prompt ?? "").trim();

  if (melodyComposition) {
    parts.push(baseCaption);
    parts.push(MELODY_COMPOSITION_ACE_RULES);
    if (mood) parts.push(`Mood: ${mood}.`);
    if (energyLevel) parts.push(`Energy: ${energyLevel}.`);
    if (!autoMeta && bpm > 0) parts.push(`BPM: ${bpm}.`);
    if (!autoMeta && key && scale) parts.push(`Key: ${key} ${scale}.`);
    if (timeSignature) parts.push(`Time signature: ${timeSignature}.`);
    if (genre) parts.push(`In the generated Metadata caption, explicitly include the genre: "${genre}".`);
    return parts.join("\n\n");
  }

  if (instrumental) {
    parts.push(baseCaption);
    parts.push(ACE_BEAT_LM_RULES);
    if (mood) parts.push(`Mood: ${mood}.`);
    if (energyLevel) parts.push(`Energy: ${energyLevel}.`);
  } else {
    parts.push(baseCaption);
    parts.push(ACE_SONG_LM_RULES);
    if (!lyrics) {
      parts.push(ACE_AI_COMPOSE_SONG_LM_RULES);
    }
    if (lyrics) {
      parts.push(`Lyrics:\n${lyrics}`);
    }
    if (vocalLanguage) parts.push(`Vocal language: ${vocalLanguage}.`);
    if (vocalLanguage && vocalLanguage !== "en") {
      const labels: Record<string, string> = { fr: "French", es: "Spanish", pt: "Portuguese", it: "Italian", de: "German", ja: "Japanese", ko: "Korean", zh: "Chinese", ar: "Arabic", ru: "Russian" };
      const label = labels[vocalLanguage] ?? vocalLanguage.toUpperCase();
      parts.push(`All ## Lyrics must be written entirely in ${label} (native words, not English).`);
    }
    if (vocalStyle) parts.push(`Vocal delivery style: ${vocalStyle}.`);
  }

  if (!autoMeta && bpm > 0) parts.push(`BPM: ${bpm}.`);
  if (autoMeta) {
    const bankBpm = baseCaption.match(/(\d{2,3})\s*bpm/i)?.[1];
    if (bankBpm) parts.push(`Target BPM: ${bankBpm} — keep drill/trap tempo, do not slow down into mid-tempo pop.`);
  }
  if (!autoMeta && key && scale) parts.push(`Key: ${key} ${scale}.`);
  if (timeSignature) parts.push(`Time signature: ${timeSignature}.`);
  if (genre) parts.push(`In the generated Metadata caption, explicitly include the genre: "${genre}".`);
  if (/\bdrill\b/i.test(genre)) {
    parts.push("Music MUST be drill (sliding 808, dark minor melody, syncopated hi-hats, sparse piano or strings) — NOT dance-pop, NOT four-on-the-floor house, NOT bright euphoric pop synths.");
  }
  if (/\btrapsoul\b/i.test(genre)) {
    parts.push("Music MUST be trap soul (808 bass, trap hi-hats, R&B vocal pocket) — NOT acoustic pop ballad, NOT music-box arpeggios, NOT brushed jazz drums or upright bass singer-songwriter.");
  }
  if (genre === "Dancehall") {
    parts.push('In the generated Metadata caption, explicitly include the words: "dancehall" and "riddim".');
  }

  return parts.join("\n\n");
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
  const aceKey = env("ACE_API_KEY");
  if (!aceKey) {
    throw new functions.https.HttpsError("failed-precondition", "ACE API key not configured");
  }

  // Build ACE request body from the frontend payload
  // The frontend sends: caption, lyrics, instrumental, sampleMode, etc.
  // The ACE API expects: messages: [{ role: "user", content: "..." }]
  const sampleMode = body.sampleMode === true || body.sample_mode === true;
  const messageContent = buildMessageContent(body);

  // Build audio_config from frontend fields
  const instrumental = body.instrumental !== false;
  const bpm = typeof body.bpm === "number" ? body.bpm : 0;
  const keyScale = String(body.keyScale ?? "").trim();
  const timeSignature = String(body.timeSignature ?? body.time_signature ?? "").trim();
  const vocalLanguage = String(body.vocalLanguage ?? body.vocal_language ?? "en").trim();
  const audioFormat = String(body.audioFormat ?? "mp3").trim();
  const duration = typeof body.duration === "number" ? body.duration : undefined;

  const audioConfig: Record<string, unknown> = {
    instrumental,
    ...(duration != null ? { duration } : {}),
    bpm: bpm > 0 ? bpm : null,
    key_scale: keyScale || null,
    time_signature: timeSignature || null,
    vocal_language: vocalLanguage,
    format: audioFormat,
    audio_format: audioFormat,
    shift: 3,
    inference_steps: 8,
  };

  // Seeds
  const seeds = body.seeds as number[] | undefined;
  if (seeds?.length) {
    audioConfig.seed = seeds[0];
    audioConfig.seeds = seeds;
    audioConfig.use_random_seed = false;
  }

  const aceBody: AceRequest = {
    model: String(body.model ?? "acestep-v15-xl-base"),
    thinking: body.thinking !== false,
    use_format: (body.useFormat ?? body.use_format) !== false,
    messages: [{ role: "user", content: messageContent }],
    task_type: String(body.task_type ?? "text2music"),
    audio_config: audioConfig,
    stream: false,
  };

  if (body.lyrics) aceBody.lyrics = body.lyrics as string;
  if (sampleMode) {
    aceBody.sample_mode = true;
    const sq = String(body.sampleQuery ?? body.sample_query ?? "").trim();
    if (sq) aceBody.sample_query = sq;
  }
  if (body.batch_size) aceBody.batch_size = body.batch_size as number;
  if (seeds?.length) aceBody.seeds = seeds;

  const generationKey = (body.generationKey as string) ?? (body.generation_key as string) ?? null;

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
