import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  aceAsyncJobsEnabled,
  aceAsyncTryReleaseTask,
  createAceReleaseTask,
  decodeDataUrl,
  internalJobSecret,
  jobResponsePayload,
  LOOP_AUDIO_BUCKET,
  pollAceTaskOnce,
  resolveAceStemsZipUrl,
  scheduleRunJob,
} from "../_shared/generationJobUtils.ts";
import {
  fbGetProfile,
  fbCheckUsageIdempotent,
  fbBumpUsage,
  fbBumpUsageIdempotent,
  fbGetGenerationJob,
  fbUpdateGenerationJob,
  fbInsertGenerationJob,
  fbGetLoop,
  fbUpdateLoop,
  fbFindPublicLoopByAceTaskId,
  fbGetVoiceProfile,
  fbUploadToStorage,
  fbDownloadFromStorage,
} from "../_shared/firestoreServer.ts";
import { resolveAceLyricsForMeta, extractLyricsFromAceResponseContent } from "../_shared/aceLyricsApi.ts";
import {
  buildAceChatCompletionsHttpBody,
  buildAceChatCompletionsMessage,
  buildAceSampleQuery,
  resolveAceLyricsApiFieldForRequest,
  resolveAceSampleMode,
} from "../_shared/aceSampleMode.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-region",
};

const LIMITS = { free: 10, pro: 75, studio: 250, plus: 1000 } as const;

function normalizeAuthedPlan(plan: string): keyof typeof LIMITS {
  if (plan === "plus" || plan === "studio" || plan === "pro") return plan;
  return "free";
}

/** Génération ×2 en parallèle (dual batch v2) — Studio et Plus uniquement. */
function canDualGenerationPlan(plan: keyof typeof LIMITS): boolean {
  return plan === "studio" || plan === "plus";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Verify a Firebase ID token via Google Identity Toolkit REST API.
 * Falls back to null if not a Firebase token or verification fails.
 * Returns { uid, email } from the Firebase token claims.
 */
async function verifyFirebaseIdToken(token: string): Promise<{ uid: string; email?: string } | null> {
  const firebaseApiKey = Deno.env.get("FIREBASE_API_KEY");
  if (!firebaseApiKey) return null;

  // Only try Firebase verification if token looks like a Firebase ID token (starts with eyJ)
  if (!token.startsWith("eyJ")) return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      },
    );
    if (!res.ok) return null;
    const json = await res.json() as { users?: Array<{ localId: string; email?: string }> };
    const fbUser = json.users?.[0];
    if (!fbUser?.localId) return null;
    return { uid: fbUser.localId, email: fbUser.email };
  } catch {
    return null;
  }
}

/**
 * Get user profile from Supabase using service role key (bypasses RLS).
 * Used when authenticated via Firebase token.
 */
async function getProfileWithServiceKey(supabaseUrl: string, serviceRoleKey: string, userId: string) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=plan,loops_used_this_month,referral_bonus,level_bonus,daily_bonus_month,purchased_bonus&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
    },
  );
  if (!res.ok) return null;
  const rows = await res.json() as Array<Record<string, unknown>>;
  return rows[0] ?? null;
}

/** Chanson avec paroles — ACE peut être lent ; pas de plafond court en async (poll côté client). */
function aceRequestTimeoutMs(input: { instrumental: boolean; isSong?: boolean; lyrics?: string }): number {
  const off = Deno.env.get("ACE_REQUEST_TIMEOUT_MS");
  if (off === "0" || off?.toLowerCase() === "off") return 1_800_000;
  const base = 150_000;
  if (input.instrumental) return base;
  const lyrics = (input.lyrics ?? "").trim();
  if (!lyrics || lyrics === "[Instrumental]") return base;
  if (input.isSong !== true) return base;
  const extra = Math.min(180_000, lyrics.length * 30);
  return Math.min(1_800_000, base + extra);
}

function estimateSongDurationFromLyrics(lyrics: string): number {
  const text = lyrics.trim();
  if (!text) return 60;
  const words = text.split(/\s+/).filter(Boolean).length;
  const lines = text.split(/\n/).filter((l) => l.trim().length > 0).length;
  return Math.min(240, Math.max(45, Math.round(Math.max(words * 2.4, lines * 3.5) + 15)));
}

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function isSafeAceTaskId(tid: string): boolean {
  return !!tid && tid === tid.replace(/[^a-zA-Z0-9_-]/g, "");
}

async function findPublicLoopIdByAceTaskId(
  client: ReturnType<typeof createClient>,
  tid: string,
): Promise<string | null> {
  if (!isSafeAceTaskId(tid)) return null;
  const { data, error } = await client
    .from("loops")
    .select("id")
    .eq("is_public", true)
    .or(
      `stems_url->ace->>taskId.eq.${tid},stems_url->ace->>task_id.eq.${tid},stems_url->>taskId.eq.${tid},stems_url->>task_id.eq.${tid}`,
    )
    .limit(1)
    .maybeSingle();
  if (error || !data?.id) return null;
  return typeof data.id === "string" ? data.id : null;
}

function asNumber(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function clampNumber(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function computeRequestedDurationSec(input: {
  instrumental: boolean;
  durationRaw: number | null;
  bars: number | null;
}): number | null {
  const clampNumber = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
  const fallbackRaw = Deno.env.get("ACE_SONG_AUTO_DURATION_SEC");
  const fallback =
    fallbackRaw === "" || fallbackRaw == null || fallbackRaw === "0" || fallbackRaw.toLowerCase() === "off"
      ? null
      : (() => {
          const n = Number(fallbackRaw);
          return Number.isFinite(n) && n >= 10 ? clampNumber(n, 10, 120) : null;
        })();

  if (input.durationRaw != null && input.durationRaw > 0) {
    return clampNumber(input.durationRaw, 10, 120);
  }
  if (!input.instrumental) {
    return fallback;
  }
  return null;
}

/** ACE quality defaults — keep in sync with src/lib/aceQuality.ts */
const ACE_SHIFT = 3;

/** Playground ACE « negative step » — sync src/lib/aceMelodyComposition.ts */
const MELODY_COMPOSITION_LM_NEGATIVE_PROMPT =
  "drums, drum kit, drum loop, kick drum, snare, clap, hi-hat, hi hats, percussion, 808 bass, trap drums, beat programming, rhythm section, boom bap drums, four on the floor";

function aceMelodyCompositionAceFields(): Record<string, unknown> {
  const neg = MELODY_COMPOSITION_LM_NEGATIVE_PROMPT;
  return { lm_negative_prompt: neg, negative_prompt: neg, lm_cfg_scale: 2.8 };
}
const ACE_INFERENCE_STEPS = 8;
const ACE_RELEASE_MODEL = "acestep-v15-xl-turbo";

function isAceSongQualityV2Enabled(): boolean {
  return Deno.env.get("ACE_SONG_QUALITY_V2") !== "0";
}

/** Legacy release_task. Rollback only: ACE_RELEASE_TASK=1 */
function isAceReleaseTaskEnabled(): boolean {
  return Deno.env.get("ACE_RELEASE_TASK") === "1";
}

function resolveAceQualityFlags(input: {
  thinking: boolean | null;
  useFormat: boolean | null;
  sampleMode: boolean;
}) {
  return {
    thinking: input.thinking !== false,
    useFormat: !input.sampleMode && input.useFormat !== false,
    shift: ACE_SHIFT,
  };
}

function resolveEdgeSampleMode(args: {
  action: string;
  instrumental: boolean;
  melodyComposition?: boolean;
  lyricsUserTrimmed: string;
  captionOverride: string;
  bodySampleMode?: boolean;
}): boolean {
  if (args.action === "format") return false;
  const explicit = args.bodySampleMode === true ? true : undefined;
  return resolveAceSampleMode({
    captionOverride: args.captionOverride,
    instrumental: args.instrumental,
    melodyComposition: args.melodyComposition,
    explicitSampleMode: explicit,
    lyricsTrimmed: args.lyricsUserTrimmed,
  });
}

function resolveEffectiveSampleQuery(args: {
  sampleMode: boolean;
  sampleQuery: string;
  genre: string;
  prompt: string;
  vocalStyle?: string;
}): string {
  const trimmed = args.sampleQuery.trim();
  if (!args.sampleMode) return trimmed;
  return (
    trimmed ||
    buildAceSampleQuery({
      genre: args.genre,
      idea: args.prompt,
      vocalStyle: args.vocalStyle,
    })
  );
}

function toAbsoluteUrl(baseUrl: string, maybePath: string) {
  const t = maybePath.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("/")) return `${baseUrl}${t}`;
  return `${baseUrl}/${t}`;
}

function isHttpUrl(v: unknown): v is string {
  const s = typeof v === "string" ? v.trim() : "";
  return !!s && (s.startsWith("https://") || s.startsWith("http://"));
}

function canStemsPlan(plan: keyof typeof LIMITS): boolean {
  return plan === "plus";
}

async function enrichPlusStemsMeta(
  meta: Record<string, unknown> | null,
  plan: keyof typeof LIMITS,
  aceTargets: Array<{ apiKey: string; baseUrl: string; keyIndex: number }>,
  chatJson: unknown | null,
  signal: AbortSignal,
): Promise<Record<string, unknown> | null> {
  if (!meta || !canStemsPlan(plan)) return meta;
  const existing = typeof meta.stemsZipUrl === "string" ? meta.stemsZipUrl.trim() : "";
  if (existing) return meta;

  const taskId =
    (typeof meta.taskId === "string" && meta.taskId.trim()) ||
    (typeof meta.task_id === "string" && meta.task_id.trim()) ||
    "";
  if (!taskId && !chatJson) return meta;

  const keyIndex = typeof meta.aceKeyIndex === "number" ? meta.aceKeyIndex : 0;
  const target = aceTargets.find((t) => t.keyIndex === keyIndex) ?? aceTargets[0];
  if (!target) return meta;

  const stemsZipUrl = await resolveAceStemsZipUrl({
    baseUrl: target.baseUrl,
    apiKey: target.apiKey,
    taskId,
    chatJson: chatJson ?? undefined,
    signal,
    maxWaitMs: 45_000,
  });
  if (!stemsZipUrl) return meta;
  return { ...meta, stemsZipUrl };
}

function pickStemsZipUrl(baseUrl: string, firstObj: Record<string, unknown> | null, metasObj: Record<string, unknown> | null) {
  const candidates: unknown[] = [];
  if (firstObj) {
    candidates.push(
      firstObj.stemsZipUrl,
      firstObj.stems_zip_url,
      firstObj.stems_zip,
      firstObj.stems_url,
      firstObj.stemsUrl,
      firstObj.zipUrl,
      firstObj.zip_url,
      firstObj.zip,
      firstObj.archiveUrl,
      firstObj.archive_url,
      firstObj.archive,
    );
  }
  if (metasObj) {
    candidates.push(
      metasObj.stemsZipUrl,
      metasObj.stems_zip_url,
      metasObj.stems_zip,
      metasObj.stems_url,
      metasObj.stemsUrl,
      metasObj.zipUrl,
      metasObj.zip_url,
      metasObj.zip,
      metasObj.archiveUrl,
      metasObj.archive_url,
      metasObj.archive,
    );
  }

  for (const c of candidates) {
    if (typeof c !== "string") continue;
    const abs = toAbsoluteUrl(baseUrl, c);
    if (!abs) continue;
    const lower = abs.toLowerCase();
    if (lower.includes(".zip") || lower.includes("stem") || lower.includes("stems")) return abs;
  }
  for (const c of candidates) {
    if (typeof c !== "string") continue;
    const abs = toAbsoluteUrl(baseUrl, c);
    if (isHttpUrl(abs)) return abs;
  }
  return "";
}

async function readTextSafe(res: Response) {
  return await res.text().catch(() => "");
}

function redactAiToken(body: Record<string, unknown>) {
  if (!("ai_token" in body)) return body;
  return { ...body, ai_token: "[redacted]" };
}

function normalizeAceBaseUrl(baseUrlRaw: string) {
  const trimmed = baseUrlRaw.trim().replace(/\/$/, "");
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    if (host === "acemusic.ai") return "https://api.acemusic.ai";
    if (host === "acem-api.acemusic.ai") return "https://api.acemusic.ai";
    if (path.includes("/api/acem")) return "https://api.acemusic.ai";
  } catch {
    // ignore
  }
  return trimmed;
}

function splitEnvList(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function loadAceApiKeys(): string[] {
  const raw: string[] = [];
  raw.push(...splitEnvList(Deno.env.get("ACE_STEP_API_KEYS") ?? ""));
  const k1 = (Deno.env.get("ACE_STEP_API_KEY") ?? "").trim();
  if (k1) raw.push(k1);
  for (let i = 2; i <= 10; i++) {
    const ki = (Deno.env.get(`ACE_STEP_API_KEY_${i}`) ?? "").trim();
    if (ki) raw.push(ki);
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const k of raw) {
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function loadAceBaseUrls(): string[] {
  const list = splitEnvList(Deno.env.get("ACE_STEP_BASE_URLS") ?? "").map(normalizeAceBaseUrl);
  if (list.length) return list;
  const out: string[] = [];
  const b1 = normalizeAceBaseUrl((Deno.env.get("ACE_STEP_BASE_URL") ?? "https://api.acemusic.ai").trim());
  if (b1) out.push(b1);
  for (let i = 2; i <= 6; i++) {
    const biRaw = (Deno.env.get(`ACE_STEP_BASE_URL_${i}`) ?? "").trim();
    if (!biRaw) continue;
    const bi = normalizeAceBaseUrl(biRaw);
    if (bi) out.push(bi);
  }
  return out.length ? out : ["https://api.acemusic.ai"];
}

async function handleAceRemixMultipart(req: Request, corsHeaders: Record<string, string>) {
  const requestId = crypto.randomUUID();
  const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").trim();
  const supabaseAnonKey = (Deno.env.get("SUPABASE_ANON_KEY") ?? "").trim();
  const form = await req.formData();
  const generationKey = asString(form.get("generationKey")) || asString(form.get("generation_key"));
  const prompt = asString(form.get("prompt")).trim();
  const lyricsRaw = asString(form.get("lyrics"));
  const taskTypeRaw = asString(form.get("taskType")) || asString(form.get("task_type"));
  const taskType = taskTypeRaw === "repaint" ? "repaint" : "cover";
  const coverStrengthRaw = Number(asString(form.get("coverStrength")) || "0.65");
  const coverStrength = clampNumber(Number.isFinite(coverStrengthRaw) ? coverStrengthRaw : 0.65, 0.15, 1);
  const instrumental = asString(form.get("instrumental")) !== "0";
  const duration = asNumber(form.get("duration"));
  const bpm = asNumber(form.get("bpm"));
  const audioFormatRaw = (asString(form.get("audioFormat")) || asString(form.get("audio_format"))).trim().toLowerCase();
  const src = form.get("src_audio");
  if (!(src instanceof File) || src.size <= 0) {
    return new Response(JSON.stringify({ error: "Missing src_audio file" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (src.size > 12 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: "Audio file too large (max 12 MB)" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!prompt) {
    return new Response(JSON.stringify({ error: "Missing prompt" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ") || !supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const token = authHeader.replace("Bearer ", "").trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const firebaseApiKey = Deno.env.get("FIREBASE_API_KEY") ?? "";

  // 1) Try Firebase Identity Toolkit (primary auth path)
  let userId: string | null = null;
  if (firebaseApiKey && token.startsWith("eyJ")) {
    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: token }) },
      );
      if (res.ok) {
        const json = await res.json() as { users?: Array<{ localId: string }> };
        userId = json.users?.[0]?.localId ?? null;
      }
    } catch {
      // Firebase verification failed
    }
  }
  // 2) Fallback: Supabase auth (legacy users during migration)
  if (!userId) {
    try {
      const authedSupabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
      const { data: supabaseUser } = await authedSupabase.auth.getUser(token);
      userId = supabaseUser?.user?.id ?? null;
    } catch {
      // Supabase auth failed
    }
  }
  // Create service-role client for any remaining Supabase operations
  const authedSupabase = createClient(supabaseUrl, serviceKey || supabaseAnonKey, { auth: { persistSession: false } });

  if (!userId) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fake user object for code that uses user.id
  const user = { id: userId } as { id: string };

  // Check usage via Firestore
  let useIdempotentUsage = false;
  if (generationKey) {
    const usage = await fbCheckCodeAtempotent(userId, generationKey);
    if (!usage.ok) {
      return new Response(
        JSON.stringify({
          error: "Monthly limit reached",
          limitReached: true,
          plan: usage.plan,
          limit: usage.limit,
          used: usage.used,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    useIdempotentUsage = true;
  } else {
    const profile = await fbGetProfile(userId);
    if (profile) {
      const plan = (typeof profile.plan === "string" ? profile.plan : "free") as string;
      const used = typeof profile.loops_used_this_month === "number" ? profile.loops_used_this_month : 0;
      const base = LIMITS[plan as keyof typeof LIMITS] ?? LIMITS.free;
      const bonus =
        Math.max(0, profile.referral_bonus ?? 0) +
        Math.max(0, profile.level_bonus ?? 0) +
        Math.max(0, profile.daily_bonus_month ?? 0) +
        Math.max(0, profile.purchased_bonus ?? 0);
      const limit = base + bonus;
      if (used >= limit) {
        return new Response(JSON.stringify({ error: `Monthly limit reached (${limit} beats for ${plan} plan).`, limitReached: true, plan, limit, used }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
  }

  const profilePlan = await fbGetProfile(userId);
  const authedPlan = normalizeAuthedPlan(typeof profilePlan?.plan === "string" ? profilePlan.plan : "free");
  const requestedAudioFormat =
    audioFormatRaw === "wav" || audioFormatRaw === "flac" || audioFormatRaw === "mp3" ? audioFormatRaw : "mp3";
  const audioFormat = authedPlan === "free" ? "mp3" : requestedAudioFormat;
  const effectiveLyrics = instrumental ? "" : lyricsRaw.trim();
  const aceTargets = getAceTargets(generationKey || requestId);
  if (!aceTargets.length) {
    return new Response(JSON.stringify({ error: "ACE_STEP_API_KEY not set" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 150_000);
  let audioUrl = "";
  let meta: Record<string, unknown> | null = null;

  try {
    const startedAt = Date.now();
    const attemptOnce = async (apiKey: string, baseUrl: string) => {
      const tryMusicGenerate = async () => {
        const musicForm = new FormData();
        musicForm.append("caption", prompt);
        musicForm.append("prompt", prompt);
        musicForm.append("lyrics", instrumental ? "[Instrumental]" : effectiveLyrics || "[Instrumental]");
        musicForm.append("task_type", taskType);
        musicForm.append("src_audio", src, src.name || "source.mp3");
        musicForm.append("audio_cover_strength", String(coverStrength));
        musicForm.append("audio_format", audioFormat);
        musicForm.append("thinking", "false");
        musicForm.append("model", "acestep-v15-xl-turbo");
        if (duration && duration > 0) musicForm.append("duration", String(clampNumber(duration, 10, 240)));
        if (bpm && bpm > 0) musicForm.append("bpm", String(clampNumber(Math.round(bpm), 30, 200)));

        const genRes = await fetch(`${baseUrl}/v1/music/generate`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
          body: musicForm,
          signal: controller.signal,
        });
        const genText = await readTextSafe(genRes);
        if (!genRes.ok) {
          if (isAceHtml404(genRes.status, genText)) throw new Error("ACE_REMIX_ENDPOINT_404");
          throw new Error(`ACE music/generate failed (${genRes.status}): ${genText}`);
        }
        const genJson = JSON.parse(genText) as unknown;
        const jobId = asString(unwrapAceJobPayload(genJson).job_id);
        if (!jobId) throw new Error("ACE music/generate did not return job_id");

        while (Date.now() - startedAt < 140_000) {
          const jobRes = await fetch(`${baseUrl}/v1/jobs/${encodeURIComponent(jobId)}`, {
            method: "GET",
            headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
            signal: controller.signal,
          });
          const jobText = await readTextSafe(jobRes);
          if (!jobRes.ok) {
            if (isAceHtml404(jobRes.status, jobText)) throw new Error("ACE_REMIX_ENDPOINT_404");
            throw new Error(`ACE job poll failed (${jobRes.status}): ${jobText}`);
          }
          const jobData = unwrapAceJobPayload(JSON.parse(jobText) as unknown);
          const status = asString(jobData.status).toLowerCase();
          if (status === "succeeded") {
            const result =
              jobData.result && typeof jobData.result === "object" && jobData.result !== null
                ? (jobData.result as Record<string, unknown>)
                : null;
            const file =
              (result && asString(result.first_audio_path)) ||
              (result && Array.isArray(result.audio_paths) ? asString(result.audio_paths[0]) : "");
            audioUrl = buildAceAudioUrlFromPath(baseUrl, file);
            if (!audioUrl) throw new Error("remix returned no audio file");
            meta = {
              taskId: jobId,
              task_id: jobId,
              prompt,
              lyrics: effectiveLyrics,
              bpm,
              duration,
              audioFormat,
              remixTaskType: taskType,
              coverStrength,
              engine: "ace-music-generate",
            };
            if (result) meta.result = result;
            return;
          }
          if (status === "failed") throw new Error("remix task failed");
          await sleep(2000);
        }
        throw new Error("remix timed out");
      };

      try {
        await tryMusicGenerate();
        return;
      } catch (musicErr) {
        const m = musicErr instanceof Error ? musicErr.message : String(musicErr);
        if (!m.includes("ACE_REMIX_ENDPOINT_404") && !m.includes("404")) throw musicErr;
      }

      const paramObj: Record<string, unknown> = {
        task_type: taskType,
        audio_cover_strength: coverStrength,
        audio_format: audioFormat,
      };
      if (duration && duration > 0) paramObj.duration = clampNumber(duration, 10, 240);
      if (bpm && bpm > 0) paramObj.bpm = clampNumber(Math.round(bpm), 30, 200);

      const releaseForm = new FormData();
      releaseForm.append("env", "production");
      releaseForm.append("ai_token", apiKey);
      releaseForm.append("prompt", prompt);
      releaseForm.append("lyrics", instrumental ? "[Instrumental]" : effectiveLyrics || "[Instrumental]");
      releaseForm.append("model_name", "acestep-v15-xl-turbo");
      releaseForm.append("app", "studio-web");
      releaseForm.append("task_type", taskType);
      releaseForm.append("src_audio", src, src.name || "source.mp3");
      releaseForm.append("param_obj", JSON.stringify(paramObj));

      const createRes = await fetch(`${baseUrl}/release_task`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: releaseForm,
        signal: controller.signal,
      });
      const createText = await readTextSafe(createRes);
      if (!createRes.ok) {
        if (isAceHtml404(createRes.status, createText)) throw new Error("ACE_REMIX_ENDPOINT_404");
        throw new Error(`remix release_task failed (${createRes.status}): ${createText}`);
      }
      const createJson = JSON.parse(createText) as unknown;
      const taskId = asString(
        (createJson as { data?: unknown } | null)?.data && typeof (createJson as { data?: unknown }).data === "object"
          ? ((createJson as { data: { task_id?: unknown } }).data.task_id as unknown)
          : "",
      );
      if (!taskId) throw new Error("ACE API did not return a task_id");

      while (Date.now() - startedAt < 140_000) {
        const pollParams = new URLSearchParams();
        pollParams.append("ai_token", apiKey);
        pollParams.append("task_id_list", JSON.stringify([taskId]));
        pollParams.append("app", "studio-web");
        const pollRes = await fetch(`${baseUrl}/query_result`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
          body: pollParams,
          signal: controller.signal,
        });
        const pollText = await readTextSafe(pollRes);
        if (!pollRes.ok) throw new Error(`ACE query_result failed (${pollRes.status}): ${pollText}`);
        const pollJson = JSON.parse(pollText) as unknown;
        const item = Array.isArray((pollJson as { data?: unknown } | null)?.data) ? (pollJson as { data: unknown[] }).data[0] : null;
        const statusNum = item && typeof (item as { status?: unknown }).status === "number" ? ((item as { status: number }).status as number) : 0;
        if (statusNum === 1) {
          const resultStr = asString((item as { result?: unknown } | null)?.result);
          const results = JSON.parse(resultStr) as unknown;
          const first = Array.isArray(results) ? results[0] : null;
          const firstObj = first && typeof first === "object" && first !== null ? (first as Record<string, unknown>) : null;
          const file = first && typeof (first as { file?: unknown }).file === "string" ? ((first as { file: string }).file as string) : "";
          audioUrl = buildAceAudioUrlFromPath(baseUrl, file);
          if (!audioUrl) throw new Error("remix returned no audio file");
          meta = {
            taskId,
            task_id: taskId,
            prompt,
            lyrics: effectiveLyrics,
            bpm,
            duration,
            audioFormat,
            remixTaskType: taskType,
            coverStrength,
          };
          if (firstObj) meta.result = firstObj;
          return;
        }
        if (statusNum === 2) throw new Error("remix task failed");
        await sleep(2000);
      }
      throw new Error("remix timed out");
    };

    let lastErr: unknown = null;
    for (const t of aceTargets) {
      try {
        await attemptOnce(t.apiKey, t.baseUrl);
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!audioUrl) {
      const msg = lastErr instanceof Error ? lastErr.message : "remix failed";
      if (msg.includes("ACE_REMIX_ENDPOINT_404") || msg.includes("release_task failed (404)")) {
        return new Response(
          JSON.stringify({
            error: ACE_REMIX_UNAVAILABLE_MSG,
            code: "ACE_REMIX_UNAVAILABLE",
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(msg);
    }
  } finally {
    clearTimeout(timer);
  }

  if (useIdempotentUsage && generationKey) {
    await fbBumpUsageIdempotent(userId, generationKey);
  } else {
    await fbBumpUsage(userId);
  }

  return new Response(JSON.stringify({ audioUrl, meta, engine: "ace-step-remix" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function hashToIndex(input: string, mod: number) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return mod > 0 ? h % mod : 0;
}

function isRetryableAceHttpStatus(status: number) {
  if (status === 429) return true;
  if (status >= 500 && status <= 599) return true;
  return false;
}

function isAceHtml404(status: number, body: string) {
  return status === 404 || status === 405 || /<title>404 Not Found<\/title>/i.test(body);
}

function unwrapAceJobPayload(json: unknown): Record<string, unknown> {
  if (!json || typeof json !== "object") return {};
  const root = json as Record<string, unknown>;
  if (root.data && typeof root.data === "object" && root.data !== null) {
    return root.data as Record<string, unknown>;
  }
  return root;
}

const ACE_REMIX_UNAVAILABLE_MSG =
  "Hosted ACE (api.acemusic.ai) does not expose audio-upload remix yet. Use Song/Beat generation, or a self-hosted ACE server with /v1/music/generate or /release_task.";

function buildAceAudioUrlFromPath(baseUrl: string, filePath: string) {
  const t = filePath.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const base = baseUrl.replace(/\/$/, "");
  if (t.startsWith("/v1/audio?path=")) return `${base}${t}`;
  if (t.startsWith("v1/audio?path=")) return `${base}/${t}`;
  if (t.startsWith("/")) return `${base}/v1/audio?path=${encodeURIComponent(t)}`;
  return `${base}/v1/audio?path=${encodeURIComponent(t)}`;
}

function pickAceTaskIdFromJson(json: unknown): string {
  const root = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const dataObj = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : null;
  const choices = root.choices;
  const firstChoice = Array.isArray(choices) ? choices[0] : null;
  const choiceObj =
    firstChoice && typeof firstChoice === "object" && firstChoice !== null ? (firstChoice as Record<string, unknown>) : null;
  const msg =
    choiceObj?.message && typeof choiceObj.message === "object" && choiceObj.message !== null
      ? (choiceObj.message as Record<string, unknown>)
      : null;
  const audioArr = msg && Array.isArray(msg.audio) ? (msg.audio as unknown[]) : [];
  const firstAudio =
    audioArr[0] && typeof audioArr[0] === "object" && audioArr[0] !== null ? (audioArr[0] as Record<string, unknown>) : null;

  const candidates = [
    root.task_id,
    root.taskId,
    root.id,
    dataObj?.task_id,
    dataObj?.taskId,
    choiceObj?.task_id,
    choiceObj?.taskId,
    msg?.task_id,
    msg?.taskId,
    firstAudio?.task_id,
    firstAudio?.taskId,
  ];
  for (const c of candidates) {
    const t = asString(c).trim();
    if (isSafeAceTaskId(t)) return t;
  }
  return "";
}

function pickAceFilePath(obj: Record<string, unknown> | null): string {
  if (!obj) return "";
  for (const key of ["file", "path", "audio_path", "file_path", "audioPath"]) {
    const v = asString(obj[key]).trim();
    if (v && !v.startsWith("data:")) return v;
  }
  const audioUrl = obj.audio_url;
  if (audioUrl && typeof audioUrl === "object" && audioUrl !== null) {
    const au = audioUrl as Record<string, unknown>;
    const url = asString(au.url).trim();
    if (url && !url.startsWith("data:")) return url;
    for (const key of ["path", "file"]) {
      const v = asString(au[key]).trim();
      if (v && !v.startsWith("data:")) return v;
    }
  }
  return "";
}

function parseAceChatCompletionsJson(json: unknown, baseUrl: string) {
  const root = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const choices = root.choices;
  const firstChoice = Array.isArray(choices) ? choices[0] : null;
  const choiceObj =
    firstChoice && typeof firstChoice === "object" && firstChoice !== null ? (firstChoice as Record<string, unknown>) : null;
  const msg =
    choiceObj?.message && typeof choiceObj.message === "object" && choiceObj.message !== null
      ? (choiceObj.message as Record<string, unknown>)
      : null;
  const audioArr = msg && Array.isArray(msg.audio) ? (msg.audio as unknown[]) : [];
  const firstAudio =
    audioArr[0] && typeof audioArr[0] === "object" && audioArr[0] !== null ? (audioArr[0] as Record<string, unknown>) : null;

  const taskId = pickAceTaskIdFromJson(json);
  const pathCandidate = pickAceFilePath(firstAudio) || pickAceFilePath(msg);
  const audioUrlRaw =
    firstAudio && typeof firstAudio.audio_url === "object" && firstAudio.audio_url !== null
      ? asString((firstAudio.audio_url as { url?: unknown }).url).trim()
      : "";

  let httpAudioUrl = "";
  if (audioUrlRaw.startsWith("http://") || audioUrlRaw.startsWith("https://")) {
    httpAudioUrl = audioUrlRaw;
  } else if (pathCandidate) {
    httpAudioUrl = buildAceAudioUrlFromPath(baseUrl, pathCandidate);
  } else if (audioUrlRaw && !audioUrlRaw.startsWith("data:")) {
    httpAudioUrl = buildAceAudioUrlFromPath(baseUrl, audioUrlRaw);
  }

  const dataUrl = audioUrlRaw.startsWith("data:") ? audioUrlRaw : "";
  const audioUrl =
    httpAudioUrl ||
    dataUrl ||
    (pathCandidate ? buildAceAudioUrlFromPath(baseUrl, pathCandidate) : "") ||
    "";

  return {
    audioUrl,
    httpAudioUrl: isHttpUrl(httpAudioUrl) ? httpAudioUrl : "",
    taskId,
    sessionOnly: !isHttpUrl(httpAudioUrl) && !taskId,
  };
}

function parseAllAceChatCompletionsJson(json: unknown, baseUrl: string) {
  const root = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const choices = root.choices;
  const firstChoice = Array.isArray(choices) ? choices[0] : null;
  const choiceObj =
    firstChoice && typeof firstChoice === "object" && firstChoice !== null ? (firstChoice as Record<string, unknown>) : null;
  const msg =
    choiceObj?.message && typeof choiceObj.message === "object" && choiceObj.message !== null
      ? (choiceObj.message as Record<string, unknown>)
      : null;
  const audioArr = msg && Array.isArray(msg.audio) ? (msg.audio as unknown[]) : [];
  const out: ReturnType<typeof parseAceChatCompletionsJson>[] = [];
  for (const item of audioArr) {
    if (!item || typeof item !== "object") continue;
    const firstAudio = item as Record<string, unknown>;
    const pathCandidate = pickAceFilePath(firstAudio) || pickAceFilePath(msg);
    const audioUrlRaw =
      firstAudio && typeof firstAudio.audio_url === "object" && firstAudio.audio_url !== null
        ? asString((firstAudio.audio_url as { url?: unknown }).url).trim()
        : "";
    let httpAudioUrl = "";
    if (audioUrlRaw.startsWith("http://") || audioUrlRaw.startsWith("https://")) {
      httpAudioUrl = audioUrlRaw;
    } else if (pathCandidate) {
      httpAudioUrl = buildAceAudioUrlFromPath(baseUrl, pathCandidate);
    } else if (audioUrlRaw && !audioUrlRaw.startsWith("data:")) {
      httpAudioUrl = buildAceAudioUrlFromPath(baseUrl, audioUrlRaw);
    }
    const dataUrl = audioUrlRaw.startsWith("data:") ? audioUrlRaw : "";
    const audioUrl =
      httpAudioUrl ||
      dataUrl ||
      (pathCandidate ? buildAceAudioUrlFromPath(baseUrl, pathCandidate) : "") ||
      "";
    if (!audioUrl.trim()) continue;
    out.push({
      audioUrl,
      httpAudioUrl: isHttpUrl(httpAudioUrl) ? httpAudioUrl : "",
      taskId: pickAceTaskIdFromJson(json),
      sessionOnly: !isHttpUrl(httpAudioUrl) && !pickAceTaskIdFromJson(json),
    });
  }
  if (out.length) return out;
  const single = parseAceChatCompletionsJson(json, baseUrl);
  return single.audioUrl.trim() ? [single] : [];
}

function pickOneBySeed<T>(items: T[], seed: string): T {
  if (items.length <= 1) return items[0]!;
  return items[hashToIndex(seed, items.length)]!;
}

function parseAceChatContent(content: string) {
  const pick = (re: RegExp) => {
    const m = content.match(re);
    return m && typeof m[1] === "string" ? m[1].trim() : "";
  };
  const caption = pick(/\*\*Caption:\*\*\s*([^\n]+)/i);
  const bpmStr = pick(/\*\*BPM:\*\*\s*([0-9]{2,3})/i);
  const durationStr = pick(/\*\*Duration:\*\*\s*([0-9]{1,3})/i);
  const keyScaleMatch =
    content.match(/\*\*(?:Key|Key Scale|KeyScale):\*\*\s*([^\n]+)/i) ?? content.match(/\*\*Key:\*\*\s*([^\n]+)/i);
  const keyScale = keyScaleMatch?.[1]?.trim() ?? "";
  const tsMatch = content.match(/\*\*(?:Time Signature|TimeSignature):\*\*\s*([^\n]+)/i);
  const timeSignature = tsMatch?.[1]?.trim() ?? "";
  const bpmNum = bpmStr ? Number(bpmStr) : null;
  const durationNum = durationStr ? Number(durationStr) : null;

    let extractedLyrics = extractLyricsFromAceResponseContent(content);

  const fallbackBpmMatch = content.match(/(^|[\s,])([0-9]{2,3})\s*bpm\b/i);
  const fallbackBpm = fallbackBpmMatch?.[2] ? Number(fallbackBpmMatch[2]) : null;
  const fallbackDurMatch = content.match(/(^|[\s,])([0-9]{1,3})\s*s(ec(onds)?)?\b/i);
  const fallbackDuration = fallbackDurMatch?.[2] ? Number(fallbackDurMatch[2]) : null;
  const bpmFinal = bpmNum && isFinite(bpmNum) ? bpmNum : fallbackBpm && isFinite(fallbackBpm) ? fallbackBpm : null;
  const durationFinal =
    durationNum && isFinite(durationNum) ? durationNum : fallbackDuration && isFinite(fallbackDuration) ? fallbackDuration : null;

  return {
    prompt: caption || undefined,
    lyrics: extractedLyrics || undefined,
    bpm: bpmFinal,
    duration: durationFinal,
    keyScale: keyScale || undefined,
    timeSignature: timeSignature || undefined,
  };
}

/** Aligné sur generateLoopAceDirect (localhost) — chat/completions ACE. */
async function generateViaChatCompletionsAce(input: {
  apiKey: string;
  baseUrl: string;
  seedKey: string;
  prompt: string;
  baseCaption: string;
  lyrics: string;
  instrumental: boolean;
  melodyComposition?: boolean;
  genre: string;
  mood: string;
  energyLevel: string;
  autoMeta: boolean;
  key: string;
  scale: string;
  requestedDuration: number | null;
  bpm: number | null;
  keyScale: string;
  timeSignature: string;
  vocalLanguage: string;
  vocalStyle?: string;
  sampleMode?: boolean;
  sampleQuery?: string;
  captionOverride?: string;
  audioFormat: string;
  thinking: boolean;
  useFormat: boolean;
  signal?: AbortSignal;
  batchSize?: number;
  seeds?: number[];
}): Promise<{ audioUrl: string; meta: Record<string, unknown> }> {
  const userLyrics = input.lyrics.trim();
  const sampleMode = input.sampleMode === true;
  const sampleQuery =
    (input.sampleQuery || "").trim() ||
    (sampleMode
      ? buildAceSampleQuery({
          genre: input.genre,
          idea: input.prompt,
          vocalStyle: input.vocalStyle,
        })
      : "");
  const messageContent = buildAceChatCompletionsMessage({
    seedKey: input.seedKey,
    baseCaption: input.baseCaption,
    prompt: input.prompt,
    lyrics: userLyrics,
    instrumental: input.instrumental,
    melodyComposition: input.melodyComposition,
    genre: input.genre,
    mood: input.mood,
    energyLevel: input.energyLevel,
    autoMeta: input.autoMeta,
    bpm: input.bpm,
    key: input.key,
    scale: input.scale,
    timeSignature: input.timeSignature,
    vocalLanguage: input.vocalLanguage,
    vocalStyle: input.vocalStyle,
    sampleMode,
    sampleQuery,
    captionOverride: input.captionOverride,
  });
  const lyricsField = resolveAceLyricsApiFieldForRequest({
    instrumental: input.instrumental,
    lyricsTrimmed: userLyrics,
    sampleMode,
  });
  const metaCaption = sampleMode ? sampleQuery : input.baseCaption || input.prompt;

  const res = await fetch(`${input.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(
      buildAceChatCompletionsHttpBody({
        model: ACE_RELEASE_MODEL,
        thinking: input.thinking,
        useFormat: input.useFormat,
        sampleMode,
        sampleQuery,
        messageContent,
        lyricsField,
        batchSize: input.batchSize,
        audioConfig: {
          instrumental: input.instrumental,
          ...(input.requestedDuration != null ? { duration: input.requestedDuration } : {}),
          bpm: input.bpm && input.bpm > 0 ? input.bpm : null,
          key_scale:
            !input.autoMeta && input.key && input.scale
              ? `${input.key} ${input.scale}`
              : input.keyScale.trim() || null,
          time_signature: input.timeSignature.trim() || null,
          vocal_language: input.vocalLanguage || "en",
          format: input.audioFormat,
          audio_format: input.audioFormat,
          shift: ACE_SHIFT,
          inference_steps: ACE_INFERENCE_STEPS,
          ...(input.seeds?.length
            ? { seed: input.seeds[0], seeds: input.seeds, use_random_seed: false }
            : {}),
        },
        extraFields: input.melodyComposition ? aceMelodyCompositionAceFields() : undefined,
      }),
    ),
    signal: input.signal,
  });
  const text = await readTextSafe(res);
  if (!res.ok) throw new Error(`ACE API chat/completions failed (${res.status}): ${text}`);

  const json = JSON.parse(text) as unknown;
  const parsed = parseAceChatCompletionsJson(json, input.baseUrl);
  if (!parsed.audioUrl) throw new Error("ACE API returned no audio");

  const choices = (json as { choices?: unknown } | null)?.choices;
  const firstChoice = Array.isArray(choices) ? choices[0] : null;
  const messageObj =
    firstChoice && typeof firstChoice === "object" && firstChoice !== null
      ? (firstChoice as { message?: unknown }).message
      : null;
  const content =
    messageObj && typeof messageObj === "object" && messageObj !== null && typeof (messageObj as { content?: unknown }).content === "string"
      ? ((messageObj as { content: string }).content as string)
      : "";
  const parsedContent = content ? parseAceChatContent(content) : {};
  const fallbackKeyScale = !input.autoMeta && input.key && input.scale ? `${input.key} ${input.scale}` : "";

  return {
    audioUrl: (parsed.httpAudioUrl && isHttpUrl(parsed.httpAudioUrl) ? parsed.httpAudioUrl : "") || parsed.audioUrl,
    chatJson: json,
    meta: {
      prompt: parsedContent.prompt || metaCaption,
      lyrics: input.instrumental
        ? ""
        : resolveAceLyricsForMeta({
            parsedLyrics: parsedContent.lyrics,
            userLyrics,
            caption: metaCaption,
          }) || undefined,
      bpm: (parsedContent.bpm && parsedContent.bpm > 0 ? parsedContent.bpm : input.bpm) ?? null,
      duration: (parsedContent.duration && parsedContent.duration > 0 ? parsedContent.duration : input.requestedDuration) ?? null,
      keyScale: parsedContent.keyScale || fallbackKeyScale || input.keyScale.trim() || null,
      timeSignature: parsedContent.timeSignature || input.timeSignature.trim() || null,
      audioFormat: input.audioFormat,
      engine: "chat-completions",
      ...(parsed.taskId ? { taskId: parsed.taskId, task_id: parsed.taskId } : {}),
      ...(parsed.httpAudioUrl ? { httpAudioUrl: parsed.httpAudioUrl } : {}),
      sessionOnly: parsed.sessionOnly,
    },
  };
}

function unwrapAcePayload(json: unknown): Record<string, unknown> {
  if (!json || typeof json !== "object") return {};
  const root = json as Record<string, unknown>;
  if (root.data && typeof root.data === "object" && root.data !== null) return root.data as Record<string, unknown>;
  return root;
}

async function pollAceMusicJob(args: {
  baseUrl: string;
  apiKey: string;
  jobId: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}): Promise<{ audioPath: string; metas: Record<string, unknown> | null }> {
  const startedAt = Date.now();
  const timeoutMs = args.timeoutMs ?? 180_000;
  const base = args.baseUrl.replace(/\/$/, "");

  while (Date.now() - startedAt < timeoutMs) {
    if (args.signal?.aborted) throw new Error("Aborted");
    const res = await fetch(`${base}/v1/jobs/${encodeURIComponent(args.jobId)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${args.apiKey}`, Accept: "application/json" },
      signal: args.signal,
    });
    const text = await readTextSafe(res);
    if (!res.ok) throw new Error(`ACE job poll failed (${res.status}): ${text.slice(0, 400)}`);
    const json = JSON.parse(text) as unknown;
    const data = unwrapAcePayload(json);
    const status = typeof data.status === "string" ? data.status.trim().toLowerCase() : "";
    if (status === "succeeded") {
      const result =
        data.result && typeof data.result === "object" && data.result !== null
          ? (data.result as Record<string, unknown>)
          : null;
      const path =
        (result && typeof result.first_audio_path === "string" ? result.first_audio_path : "") ||
        (result && Array.isArray(result.audio_paths) && typeof result.audio_paths[0] === "string"
          ? (result.audio_paths[0] as string)
          : "");
      if (!path) throw new Error("voice clone job succeeded but no audio path");
      const metas =
        result && typeof result.metas === "object" && result.metas !== null
          ? (result.metas as Record<string, unknown>)
          : null;
      return { audioPath: path, metas };
    }
    if (status === "failed") {
      throw new Error(typeof data.error === "string" ? data.error : "voice clone task failed");
    }
    await sleep(2000);
  }
  throw new Error("voice clone timed out");
}

/** Song avec timbre utilisateur — ACE reference_audio (music/generate). */
async function generateViaMusicGenerateReference(input: {
  apiKey: string;
  baseUrl: string;
  referenceBytes: Uint8Array;
  referenceName: string;
  prompt: string;
  lyrics: string;
  vocalLanguage: string;
  audioFormat: string;
  duration: number | null;
  bpm: number | null;
  timbreStrength: number;
  signal?: AbortSignal;
}): Promise<{ audioUrl: string; meta: Record<string, unknown> }> {
  const base = input.baseUrl.replace(/\/$/, "");
  const effectiveLyrics = resolveAceLyricsApiField({
    instrumental: false,
    lyricsTrimmed: input.lyrics,
  });
  const form = new FormData();
  form.append("caption", input.prompt);
  form.append("prompt", input.prompt);
  form.append("lyrics", effectiveLyrics);
  form.append("task_type", "text2music");
  form.append(
    "reference_audio",
    new Blob([input.referenceBytes], { type: "audio/wav" }),
    input.referenceName || "reference.wav",
  );
  form.append("vocal_language", input.vocalLanguage || "en");
  form.append("audio_format", input.audioFormat || "mp3");
  form.append("thinking", "false");
  form.append("use_format", "false");
  form.append("model", ACE_RELEASE_MODEL);
  form.append("audio_cover_strength", String(clampNumber(input.timbreStrength, 0.2, 1)));
  if (input.duration != null && input.duration > 0) form.append("duration", String(Math.round(input.duration)));
  if (input.bpm != null && input.bpm > 0) form.append("bpm", String(Math.round(input.bpm)));

  const res = await fetch(`${base}/v1/music/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${input.apiKey}`, Accept: "application/json" },
    body: form,
    signal: input.signal,
  });
  const text = await readTextSafe(res);
  if (!res.ok) throw new Error(`ACE voice clone failed (${res.status}): ${text.slice(0, 400)}`);
  const json = JSON.parse(text) as unknown;
  const data = unwrapAcePayload(json);
  const jobId = typeof data.job_id === "string" ? data.job_id.trim() : "";
  if (!jobId) throw new Error("ACE voice clone did not return job_id");

  const polled = await pollAceMusicJob({
    baseUrl: base,
    apiKey: input.apiKey,
    jobId,
    signal: input.signal,
  });
  const audioUrl = toAbsoluteUrl(base, polled.audioPath);
  if (!audioUrl) throw new Error("voice clone returned no audio URL");
  return {
    audioUrl,
    meta: {
      ...(polled.metas ?? {}),
      engine: "music-generate-voice-clone",
      voiceClone: true,
      httpAudioUrl: audioUrl.startsWith("http") ? audioUrl : undefined,
    },
  };
}

function getAceTargets(
  seedKey: string,
  preferIndex?: number,
): Array<{ apiKey: string; baseUrl: string; keyIndex: number }> {
  const keys = loadAceApiKeys();
  if (!keys.length) return [];
  const bases = loadAceBaseUrls();
  const slots = Math.max(keys.length, bases.length);
  const targets: Array<{ apiKey: string; baseUrl: string; keyIndex: number }> = [];
  for (let i = 0; i < slots; i++) {
    const keyIndex = i % keys.length;
    targets.push({ apiKey: keys[keyIndex]!, baseUrl: bases[i % bases.length]!, keyIndex });
  }
  const start =
    typeof preferIndex === "number" && Number.isFinite(preferIndex)
      ? Math.abs(Math.floor(preferIndex)) % targets.length
      : hashToIndex(seedKey, targets.length);
  return [...targets.slice(start), ...targets.slice(0, start)];
}

function isStreamPublicAudioUrl(url: string): boolean {
  const s = url.trim();
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.pathname.includes("/functions/v1/generate-loop-ace") && u.searchParams.get("action") === "stream_public";
  } catch {
    return s.includes("generate-loop-ace") && s.includes("action=stream_public");
  }
}

function parseStemsRecord(stemsUrl: unknown): Record<string, unknown> | null {
  if (!stemsUrl) return null;
  if (typeof stemsUrl === "object" && stemsUrl !== null) return stemsUrl as Record<string, unknown>;
  if (typeof stemsUrl === "string") {
    const raw = stemsUrl.trim();
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return null;
}

function pickHttpAudioFromStems(stemsUrl: unknown): string {
  const obj = parseStemsRecord(stemsUrl);
  if (!obj) return "";
  const ace = obj.ace && typeof obj.ace === "object" ? (obj.ace as Record<string, unknown>) : null;
  const fromAce = typeof ace?.httpAudioUrl === "string" ? ace.httpAudioUrl.trim() : "";
  if (isHttpUrl(fromAce) && !isStreamPublicAudioUrl(fromAce)) return fromAce;
  const direct = typeof obj.httpAudioUrl === "string" ? obj.httpAudioUrl.trim() : "";
  if (isHttpUrl(direct) && !isStreamPublicAudioUrl(direct)) return direct;
  return "";
}

async function handleStreamPublic(reqUrl: URL, corsHeaders: Record<string, string>) {
  const loopId = (reqUrl.searchParams.get("loopId") ?? reqUrl.searchParams.get("loop_id") ?? "").trim();
  if (!loopId) {
    return new Response("Missing loopId", { status: 400, headers: corsHeaders });
  }

  const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").trim();
  const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  if (!supabaseUrl || !serviceKey) {
    return new Response("Server not configured", { status: 500, headers: corsHeaders });
  }

  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await sb
    .from("loops")
    .select("id, is_public, audio_url, stems_url")
    .eq("id", loopId)
    .eq("is_public", true)
    .maybeSingle();

  if (error || !data) {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  const row = data as {
    audio_url?: string | null;
    stems_url?: unknown;
  };

  const httpFromStems = pickHttpAudioFromStems(row.stems_url);
  if (httpFromStems) {
    return Response.redirect(httpFromStems, 302);
  }

  const audioUrl = typeof row.audio_url === "string" ? row.audio_url.trim() : "";
  if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
    if (!isStreamPublicAudioUrl(audioUrl)) {
      return Response.redirect(audioUrl, 302);
    }
  }

  const { data: inlineRow, error: inlineErr } = await sb
    .from("loops")
    .select("provider_audio_inline")
    .eq("id", loopId)
    .eq("is_public", true)
    .maybeSingle();

  if (inlineErr) {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  const inline =
    typeof (inlineRow as { provider_audio_inline?: string | null } | null)?.provider_audio_inline === "string"
      ? (inlineRow as { provider_audio_inline: string }).provider_audio_inline.trim()
      : "";
  if (inline) {
    const decoded = await decodeDataUrl(inline);
    if (decoded?.bytes.byteLength) {
      return new Response(decoded.bytes, {
        headers: {
          ...corsHeaders,
          "Content-Type": decoded.mime,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
  }

  return new Response("No audio", { status: 404, headers: corsHeaders });
}

export async function handleGenerateLoopAceRequest(req: Request): Promise<Response> {
  const reqUrl = new URL(req.url);
  if (req.method === "GET") {
    const action = reqUrl.searchParams.get("action") ?? "";
    if (action === "stream_public") {
      return await handleStreamPublic(reqUrl, corsHeaders);
    }
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    try {
      return await handleAceRemixMultipart(req, corsHeaders);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const requestId = crypto.randomUUID();
    let useIdempotentUsage = false;
    let authedSupabase: ReturnType<typeof createClient> | null = null;
    let authedUserId: string | null = null;
    let authedPlan: "free" | "pro" | "studio" | "plus" = "free";
    // True when the user authenticated via Firebase (Supabase can't decode Firebase JWTs).
    // Hoisted to function scope so all action handlers can read it.
    let isFirebaseUserFlag = false;
    const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").trim();
    const supabaseAnonKey = (Deno.env.get("SUPABASE_ANON_KEY") ?? "").trim();
    const supabaseServiceRoleKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
    const lookupSupabase =
      supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey)
        ? createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, { auth: { persistSession: false } })
        : null;

    const body = (await req.json().catch(() => ({}))) as {
      action?: unknown;
      generationKey?: unknown;
      generation_key?: unknown;
      taskId?: unknown;
      task_id?: unknown;
      loopId?: unknown;
      loop_id?: unknown;
      sourceUrl?: unknown;
      source_url?: unknown;
      audioUrl?: unknown;
      caption?: unknown;
      sampleQuery?: unknown;
      sample_query?: unknown;
      description?: unknown;
      desc?: unknown;
      bpm?: unknown;
      keyScale?: unknown;
      duration?: unknown;
      loopLengthBars?: unknown;
      seed?: unknown;
      lyrics?: unknown;
      instrumental?: unknown;
      vocalLanguage?: unknown;
      timeSignature?: unknown;
      useFormat?: unknown;
      thinking?: unknown;
      sampleMode?: unknown;
      audioFormat?: unknown;
      audio_format?: unknown;
      genre?: unknown;
      mood?: unknown;
      energyLevel?: unknown;
      autoMeta?: unknown;
      key?: unknown;
      scale?: unknown;
      isSong?: unknown;
      requirePersistableUrl?: unknown;
      aceKeyPreferIndex?: unknown;
      dualBatch?: unknown;
      dualSeeds?: unknown;
      generationKeys?: unknown;
      voiceProfileId?: unknown;
      voiceCloneStrength?: unknown;
    };

    const action = String(body?.action ?? "generate");

    if (action === "run_job") {
      const jobSecret = req.headers.get("x-ace-job-secret") ?? "";
      const expectedSecret = internalJobSecret();
      if (!expectedSecret || jobSecret !== expectedSecret) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const jobId = asString(body?.jobId) || asString(body?.job_id);
      if (!jobId) {
        return new Response(JSON.stringify({ error: "Missing jobId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Load job from Firestore
      const job = await fbGetGenerationJob(jobId);
      if (!job) {
        return new Response(JSON.stringify({ error: "Job not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (job.status === "completed" || job.status === "failed") {
        return new Response(JSON.stringify(jobResponsePayload(job)), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const p = job.payload && typeof job.payload === "object" ? job.payload : {};
      const caption = asString(p.caption);
      const sampleQuery =
        asString(p.sampleQuery) || asString(p.sample_query) || asString(p.description) || "";
      const lyricsRaw = asString(p.lyrics);
      const bpm = asNumber(p.bpm);
      const keyScale = asString(p.keyScale);
      const duration = asNumber(p.duration);
      const loopLengthBars = asNumber(p.loopLengthBars);
      const timeSignature = asString(p.timeSignature);
      const thinking = typeof p.thinking === "boolean" ? Boolean(p.thinking) : null;
      const useFormat = typeof p.useFormat === "boolean" ? Boolean(p.useFormat) : null;
      const instrumental = p.instrumental !== false;
      const melodyComposition =
        p.melodyComposition === true ||
        asString(p.melodyComposition) === "true" ||
        (caption.includes("ProducerHit") && /NO drums|no drums|sans drums/i.test(caption));
      const seed = asNumber(p.seed);
      const vocalLanguage = asString(p.vocalLanguage) || "en";
      const vocalStyle = asString(p.vocalStyle).trim();
      const sampleMode = resolveEdgeSampleMode({
        action: "generate",
        instrumental,
        melodyComposition,
        lyricsUserTrimmed: lyricsRaw.trim(),
        captionOverride: asString(p.captionOverride).trim(),
        bodySampleMode: typeof p.sampleMode === "boolean" ? p.sampleMode : undefined,
      });
      const genreStr = asString(p.genre);
      const effectiveSampleQuery = resolveEffectiveSampleQuery({
        sampleMode,
        sampleQuery,
        genre: genreStr,
        prompt: asString(p.prompt) || sampleQuery || caption,
        vocalStyle: vocalStyle || undefined,
      });
      const audioFormatRaw = (asString(p.audioFormat) || asString(p.audio_format)).trim().toLowerCase();
      const audioFormat =
        audioFormatRaw === "wav" || audioFormatRaw === "wav32" || audioFormatRaw === "flac" || audioFormatRaw === "mp3"
          ? audioFormatRaw
          : "mp3";
      const effectiveLyrics = instrumental ? "[Instrumental]" : (lyricsRaw ? lyricsRaw.trim() : "");
      const baseCaption = sampleMode ? effectiveSampleQuery : caption.trim() || sampleQuery.trim();
      const effectivePrompt = (sampleMode ? effectiveSampleQuery : caption).trim();
      if (!effectivePrompt) {
        await fbUpdateGenerationJob(jobId, { status: "failed", error: "Missing caption" });
        const failed = await fbGetGenerationJob(jobId);
        return new Response(JSON.stringify(jobResponsePayload(failed!)), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isSongJob = p.isSong === true;
      const songDurationRaw =
        duration && duration > 0
          ? duration
          : !instrumental && isSongJob && effectiveLyrics.length > 0
            ? estimateSongDurationFromLyrics(effectiveLyrics)
            : null;
      const aceTimeoutMs = aceRequestTimeoutMs({ instrumental, isSong: isSongJob, lyrics: effectiveLyrics });

      const generationKey = job.generation_key ?? "";
      const aceKeyPreferIndex = asNumber(p.aceKeyPreferIndex);
      const seedKey = generationKey || requestId;
      const aceTargets = getAceTargets(seedKey, aceKeyPreferIndex ?? undefined);
      if (!aceTargets.length) {
        await fbUpdateGenerationJob(jobId, { status: "failed", error: "ACE_STEP_API_KEY not set" });
        const failed = await fbGetGenerationJob(jobId);
        return new Response(JSON.stringify(jobResponsePayload(failed!)), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const quality = resolveAceQualityFlags({ thinking, useFormat, sampleMode });
      const requestedDuration = computeRequestedDurationSec({
        instrumental,
        durationRaw: songDurationRaw,
        bpm,
        bars: loopLengthBars,
      });
      const keyValue = keyScale.trim().length > 0 ? keyScale.trim() : "";
      const paramObj: Record<string, unknown> = {};
      if (requestedDuration != null) paramObj.duration = requestedDuration;
      if (bpm && bpm > 0) paramObj.bpm = bpm;
      if (timeSignature.trim().length > 0) paramObj.time_signature = timeSignature.trim();
      if (audioFormat) paramObj.audio_format = audioFormat;
      if (seed && seed > 0) paramObj.seed = seed;
      paramObj.shift = quality.shift;
      paramObj.inference_steps = ACE_INFERENCE_STEPS;

      // Update job status in Firestore
      await fbUpdateGenerationJob(jobId, { status: "running" });

      if (!job.ace_task_id && aceAsyncTryReleaseTask()) {
        let releaseTaskId: string | null = null;
        let releaseBase = "";
        let releaseKeyIndex = 0;
        for (const t of aceTargets) {
          try {
            const created = await createAceReleaseTask({
              baseUrl: t.baseUrl,
              apiKey: t.apiKey,
              effectivePrompt,
              effectiveLyrics,
              instrumental,
              sampleMode,
              sampleQuery,
              vocalLanguage,
              audioFormat,
              paramObj,
              thinking: quality.thinking,
              useFormat: quality.useFormat,
              modelName: ACE_RELEASE_MODEL,
              shift: quality.shift,
              inferenceSteps: ACE_INFERENCE_STEPS,
            });
            if (created?.taskId) {
              releaseTaskId = created.taskId;
              releaseBase = t.baseUrl;
              releaseKeyIndex = t.keyIndex;
              break;
            }
          } catch (e) {
            console.warn("run_job release_task attempt failed", e);
          }
        }
        if (releaseTaskId) {
          const statusPatch = {
            status: "running",
            ace_task_id: releaseTaskId,
            ace_base_url: releaseBase,
            ace_key_index: releaseKeyIndex,
          };
          await fbUpdateGenerationJob(jobId, statusPatch);
          const updated = await fbGetGenerationJob(jobId);
          return new Response(JSON.stringify(jobResponsePayload(updated!)), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const controller = new AbortController();
      const requestTimeoutMs = aceTimeoutMs;
      const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
      try {
        let audioUrl = "";
        let meta: Record<string, unknown> | null = null;
        let lastErr: unknown = null;
        const chatAceArgs = {
          seedKey,
          prompt: effectivePrompt,
          baseCaption: baseCaption || effectivePrompt,
          lyrics: effectiveLyrics,
          instrumental,
          melodyComposition,
          genre: asString(p.genre),
          mood: asString(p.mood),
          energyLevel: asString(p.energyLevel),
          autoMeta: p.autoMeta === true,
          key: asString(p.key),
          scale: asString(p.scale),
          requestedDuration,
          bpm,
          keyScale: keyScale.trim().length > 0 ? keyScale.trim() : "",
          timeSignature,
          vocalLanguage,
          vocalStyle: vocalStyle || undefined,
          audioFormat,
          thinking: quality.thinking,
          useFormat: quality.useFormat,
          sampleMode,
          sampleQuery: effectiveSampleQuery,
          captionOverride: asString(p.captionOverride).trim(),
        };
        for (const t of aceTargets) {
          try {
            const out = await generateViaChatCompletionsAce({
              ...chatAceArgs,
              apiKey: t.apiKey,
              baseUrl: t.baseUrl,
              signal: controller.signal,
            });
            audioUrl = out.audioUrl;
            meta = { ...(out.meta ?? {}), aceKeyIndex: t.keyIndex, asyncJob: true, chatPath: true };
            lastErr = null;
            break;
          } catch (e) {
            lastErr = e;
          }
        }
        if (!audioUrl) {
          const msg = lastErr instanceof Error ? lastErr.message : "ACE chat/completions failed";
          throw new Error(msg);
        }
        const jobUserId = job.user_id;
        if (audioUrl.startsWith("data:")) {
          // Persist inline audio via Firebase Storage
          const decoded = await decodeDataUrl(audioUrl);
          if (decoded?.bytes.byteLength) {
            const ext = decoded.mime.includes("wav") ? "wav" : "mp3";
            const path = `${jobUserId}/job-${jobId}.${ext}`;
            const upload = await fbUploadToStorage(LOOP_AUDIO_BUCKET, path, decoded.bytes, decoded.mime);
            if (upload.url) {
              audioUrl = upload.url;
              meta = {
                ...(meta ?? {}),
                providerDataUrl: audioUrl,
                sessionOnly: false,
              };
            }
          }
            }
          }
        }
        const completionPatch = {
          status: "completed",
          audio_url: audioUrl,
          meta,
        };
        await fbUpdateGenerationJob(jobId, completionPatch);
        if (generationKey) {
          await fbBumpUsageIdempotent(jobUserId, generationKey);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Job failed";
        await fbUpdateGenerationJob(jobId, { status: "failed", error: msg.slice(0, 500) });
      } finally {
        clearTimeout(timer);
      }
      const finalJob = await fbGetGenerationJob(jobId);
      return new Response(JSON.stringify(jobResponsePayload(finalJob!)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requirePersistableUrl = body?.requirePersistableUrl === true;
    const aceKeyPreferIndex = asNumber(body?.aceKeyPreferIndex);
    const generationKey = asString(body?.generationKey) || asString(body?.generation_key);
    const taskIdInput = asString(body?.taskId) || asString(body?.task_id);

    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const url = supabaseUrl;
      const serviceKey = supabaseServiceRoleKey;
      const firebaseApiKey = (Deno.env.get("FIREBASE_API_KEY") ?? "").trim();
      let fbUid: string | null = null;

      // 1) Try Firebase Identity Toolkit (primary auth path)
      if (firebaseApiKey && token.startsWith("eyJ")) {
        try {
          const res = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
            { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: token }) },
          );
          if (res.ok) {
            const json = await res.json() as { users?: Array<{ localId: string }> };
            fbUid = json.users?.[0]?.localId ?? null;
          }
        } catch {
          // Firebase verification failed
        }
      }

      // 2) Fallback: Supabase auth (for legacy users during migration)
      let supabaseUserId: string | null = null;
      if (!fbUid && url && supabaseAnonKey) {
        try {
          const supabase = createClient(url, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
          const { data: supabaseUser } = await supabase.auth.getUser(token);
          supabaseUserId = supabaseUser?.user?.id ?? null;
        } catch {
          // Supabase auth failed
        }
      }

      const effectiveUserId = fbUid ?? supabaseUserId;
      isFirebaseUserFlag = Boolean(fbUid);

      if (effectiveUserId && action !== "format" && action !== "mirror_audio") {
        authedUserId = effectiveUserId;
        // Create Supabase service-role client for any remaining Supabase operations
        if (url && serviceKey) {
          authedSupabase = createClient(url, serviceKey, { auth: { persistSession: false } });
        }
        if (action !== "bump_usage") {
          // Check usage via Firestore. Falls back to Supabase inside
          // fbCheckCodeAtempotent when Firestore profile is missing.
          if (generationKey) {
            const usage = await fbCheckCodeAtempotent(authedUserId, generationKey);
              authedPlan = normalizeAuthedPlan(usage.plan);
              if (!usage.ok) {
                return new Response(
                  JSON.stringify({
                    error: "Monthly limit reached",
                    limitReached: true,
                    plan: usage.plan,
                    limit: usage.limit,
                    used: usage.used,
                  }),
                  { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
                );
              }
              useIdempotentUsage = true;
            } else {
              // No generationKey — read profile directly from Firestore
              const profile = await fbGetProfile(authedUserId);
              if (profile) {
                const plan = (typeof profile.plan === "string" ? profile.plan : "free") as string;
                authedPlan = normalizeAuthedPlan(plan);
                const used = typeof profile.loops_used_this_month === "number" ? profile.loops_used_this_month : 0;
                const baseLimit = LIMITS[plan as keyof typeof LIMITS] ?? LIMITS.free;
                const referralBonus = typeof profile.referral_bonus === "number" ? profile.referral_bonus : 0;
                const levelBonus = typeof profile.level_bonus === "number" ? profile.level_bonus : 0;
                const dailyBonus = typeof profile.daily_bonus_month === "number" ? profile.daily_bonus_month : 0;
                const purchasedBonus = typeof profile.purchased_bonus === "number" ? profile.purchased_bonus : 0;
                const limit = baseLimit + Math.max(0, referralBonus) + Math.max(0, levelBonus) + Math.max(0, dailyBonus) + Math.max(0, purchasedBonus);
                if (used >= limit) {
                  return new Response(
                    JSON.stringify({
                      error: "Monthly limit reached",
                      limitReached: true,
                      plan,
                      limit,
                      used,
                    }),
                    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
                  );
                }
              }
            }
          }
        }
      }
    }

    if (action !== "format" && !authedUserId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "bump_usage") {
      // Bump usage in Firestore
      if (generationKey) {
        await fbBumpUsageIdempotent(authedUserId, generationKey);
      } else {
        await fbBumpUsage(authedUserId);
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "start_job") {
      if (!aceAsyncJobsEnabled()) {
        return new Response(JSON.stringify({ error: "Async jobs disabled" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!generationKey) {
        return new Response(JSON.stringify({ error: "Missing generationKey" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check usage via Firestore
      const usage = await fbCheckCodeAtempotent(authedUserId, generationKey);
      if (!usage?.ok) {
        return new Response(
          JSON.stringify({ error: "Monthly limit reached", limitReached: true, plan: usage.plan, limit: usage.limit, used: usage.used }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const jobId = crypto.randomUUID();
      const instrumentalJob = body?.instrumental !== false;
      const mode = body?.isSong === true || instrumentalJob === false ? "song" : "beat";
      const payload = { ...(body as Record<string, unknown>) };

      // Insert job in Firestore
      const inserted = await fbInsertGenerationJob({
        id: jobId,
        user_id: authedUserId,
        generation_key: generationKey,
        status: "pending",
        mode,
        payload,
      });
      if (!inserted) {
        console.error("start_job: fbInsertGenerationJob failed for", jobId);
        return new Response(JSON.stringify({ error: "Failed to create job in Firestore" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      scheduleRunJob(jobId);
      return new Response(
        JSON.stringify({ jobId, status: "pending", generationKey }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "get_job_audio") {
      const jobId = asString(body?.jobId) || asString(body?.job_id);
      if (!jobId) {
        return new Response(JSON.stringify({ error: "Missing jobId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Load job from Firestore
      const job = await fbGetGenerationJob(jobId);

      if (!job || job.user_id !== authedUserId) {
        return new Response(JSON.stringify({ error: "Job not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (job.status !== "completed") {
        return new Response(JSON.stringify({ error: "Job not ready" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const meta =
        job.meta && typeof job.meta === "object" ? (job.meta as Record<string, unknown>) : null;
      const httpFromMeta = typeof meta?.httpAudioUrl === "string" ? meta.httpAudioUrl.trim() : "";
      if (httpFromMeta.startsWith("http://") || httpFromMeta.startsWith("https://")) {
        return Response.redirect(httpFromMeta, 302);
      }

      const raw = typeof job.audio_url === "string" ? job.audio_url.trim() : "";
      if (!raw) {
        return new Response(JSON.stringify({ error: "No audio" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (raw.startsWith("http://") || raw.startsWith("https://")) {
        return Response.redirect(raw, 302);
      }

      // Download audio from Firebase Cloud Storage
      const download = await fbDownloadFromStorage(LOOP_AUDIO_BUCKET, `${job.user_id}/job-${jobId}.mp3`);
      if (download.bytes) {
        return new Response(download.bytes, {
          headers: {
            ...corsHeaders,
            "Content-Type": download.mime || "audio/mpeg",
            "Cache-Control": "private, max-age=3600",
          },
        });
      }
      // Fallback: try wav
      const downloadWav = await fbDownloadFromStorage(LOOP_AUDIO_BUCKET, `${job.user_id}/job-${jobId}.wav`);
      if (downloadWav.bytes) {
        return new Response(downloadWav.bytes, {
          headers: {
            ...corsHeaders,
            "Content-Type": "audio/wav",
            "Cache-Control": "private, max-age=3600",
          },
        });
      }

      const decoded = await decodeDataUrl(raw);
      if (!decoded) {
        return new Response(JSON.stringify({ error: "Invalid audio" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(decoded.bytes, {
        headers: {
          ...corsHeaders,
          "Content-Type": decoded.mime,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    if (action === "poll_job") {
      const jobId = asString(body?.jobId) || asString(body?.job_id);
      if (!jobId) {
        return new Response(JSON.stringify({ error: "Missing jobId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Load job from Firestore
      let job = await fbGetGenerationJob(jobId);
      if (!job || job.user_id !== authedUserId) {
        return new Response(JSON.stringify({ error: "Job not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (job.status === "running" && (job as { ace_task_id?: string }).ace_task_id && (job as { ace_base_url?: string }).ace_base_url) {
        const p = job.payload && typeof job.payload === "object" ? job.payload : {};
        const aceTargets = getAceTargets((job as { generation_key?: string }).generation_key ?? requestId, asNumber(p.aceKeyPreferIndex) ?? undefined);
        const keyIndex = typeof (job as { ace_key_index?: number }).ace_key_index === "number" ? (job as { ace_key_index: number }).ace_key_index : 0;
        const target = aceTargets.find((t) => t.keyIndex === keyIndex) ?? aceTargets[0];
        if (target) {
          const caption = asString(p.caption);
          const sampleQuery = asString(p.sampleQuery) || asString(p.sample_query) || "";
          const lyricsRaw = asString(p.lyrics);
          const instrumental = p.instrumental !== false;
          const effectiveLyrics = instrumental ? "[Instrumental]" : (lyricsRaw ? lyricsRaw.trim() : "");
          const effectivePrompt = (asString(p.sampleMode) === "true" || p.sampleMode === true
            ? sampleQuery.trim() || caption
            : caption
          ).trim();
          const poll = await pollAceTaskOnce({
            baseUrl: (job as { ace_base_url: string }).ace_base_url,
            apiKey: target.apiKey,
            taskId: (job as { ace_task_id: string }).ace_task_id,
            effectivePrompt,
            effectiveLyrics,
            audioFormat: "mp3",
            requestedDuration: asNumber(p.duration),
            bpm: asNumber(p.bpm),
            keyScale: asString(p.keyScale),
            timeSignature: asString(p.timeSignature),
            seed: asNumber(p.seed),
          });
          if (poll.status === "ready") {
            let finalAudioUrl = poll.audioUrl;
            let pollMeta = poll.meta;

            // Persist inline audio via Firebase Storage
            if (finalAudioUrl?.startsWith("data:")) {
              const decoded = await decodeDataUrl(finalAudioUrl);
              if (decoded?.bytes.byteLength) {
                const ext = decoded.mime.includes("wav") ? "wav" : "mp3";
                const path = `${job!.user_id}/job-${jobId}.${ext}`;
                const upload = await fbUploadToStorage(LOOP_AUDIO_BUCKET, path, decoded.bytes, decoded.mime);
                if (upload.url) {
                  finalAudioUrl = upload.url;
                  pollMeta = {
                    ...(pollMeta ?? {}),
                    providerDataUrl: finalAudioUrl,
                    sessionOnly: false,
                  };
                }
              }
            }
            await fbUpdateGenerationJob(jobId, {
              status: "completed",
              audio_url: finalAudioUrl,
              meta: pollMeta,
            });
            if ((job as { generation_key?: string }).generation_key) {
              await fbBumpUsageIdempotent(authedUserId, (job as { generation_key: string }).generation_key);
            }
            job = await fbGetGenerationJob(jobId);
          } else if (poll.status === "failed") {
            await fbUpdateGenerationJob(jobId, { status: "failed", error: poll.error });
            job = await fbGetGenerationJob(jobId);
          }
        }
      }

      if (job.status === "pending") {
        scheduleRunJob(jobId);
      }

      if (job.status === "running" && !(job as { ace_task_id?: string }).ace_task_id) {
        const updatedAt = (job as { updated_at?: string }).updated_at ? Date.parse((job as { updated_at: string }).updated_at) : 0;
        const staleMs = updatedAt > 0 ? Date.now() - updatedAt : Number.POSITIVE_INFINITY;
        if (staleMs > 3 * 60 * 1000) {
          console.warn("poll_job: orphaned running job, re-scheduling", jobId);
          scheduleRunJob(jobId);
        }
      }

      return new Response(JSON.stringify(jobResponsePayload(job)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const caption = asString(body?.caption);
    const sampleQuery =
      asString(body?.sampleQuery) || asString(body?.sample_query) || asString(body?.description) || asString(body?.desc);
    const lyricsRaw = asString(body?.lyrics);
    const bpm = asNumber(body?.bpm);
    const keyScale = asString(body?.keyScale);
    const duration = asNumber(body?.duration);
    const loopLengthBars = asNumber(body?.loopLengthBars);
    const timeSignature = asString(body?.timeSignature);
    const thinking = typeof body?.thinking === "boolean" ? Boolean(body.thinking) : null;
    const useFormat = typeof body?.useFormat === "boolean" ? Boolean(body.useFormat) : null;
    const instrumental = body?.instrumental !== false;
    const melodyComposition =
      body?.melodyComposition === true ||
      asString(body?.melodyComposition) === "true" ||
      (caption.includes("ProducerHit") && /NO drums|no drums|sans drums/i.test(caption));
    const genre = asString(body?.genre);
    const promptField = asString(body?.prompt);
    const captionOverride = asString(body?.captionOverride).trim();
    const sampleMode = resolveEdgeSampleMode({
      action,
      instrumental,
      melodyComposition,
      lyricsUserTrimmed: lyricsRaw.trim(),
      captionOverride,
      bodySampleMode: typeof body?.sampleMode === "boolean" ? body.sampleMode : undefined,
    });
    const effectiveSampleQuery = resolveEffectiveSampleQuery({
      sampleMode,
      sampleQuery,
      genre,
      prompt: promptField || sampleQuery || caption,
      vocalStyle: asString(body?.vocalStyle).trim() || undefined,
    });
    const seed = asNumber(body?.seed);
    const audioFormatRaw = (asString(body?.audioFormat) || asString(body?.audio_format)).trim().toLowerCase();
    const requestedAudioFormat =
      audioFormatRaw === "wav" || audioFormatRaw === "wav32" || audioFormatRaw === "flac" || audioFormatRaw === "mp3" || audioFormatRaw === "aac" || audioFormatRaw === "opus"
        ? audioFormatRaw
        : "mp3";
    const audioFormat = requirePersistableUrl || authedPlan === "free" ? "mp3" : requestedAudioFormat;
    const voiceProfileId = asString(body?.voiceProfileId).trim();
    const voiceCloneStrength = clampNumber(asNumber(body?.voiceCloneStrength) ?? 0.72, 0.2, 1);

    console.log("ACE-Step request:", {
      requestId,
      action,
      caption: caption.slice(0, 80),
      sampleQuery: effectiveSampleQuery.slice(0, 80),
      bpm,
      keyScale,
      instrumental,
      melodyComposition,
      sampleMode,
      thinking,
      useFormat,
      audioFormat,
      seed,
      requirePersistableUrl,
    });

    const seedKey = generationKey || requestId;
    const aceTargets = getAceTargets(seedKey, aceKeyPreferIndex ?? undefined);
    const aceKeyCount = loadAceApiKeys().length;
    if (!aceTargets.length) throw new Error("ACE_STEP_API_KEY not set");

    if (action === "format") {
      return new Response(
        JSON.stringify({
          caption: caption,
          lyrics: lyricsRaw || "",
          bpm: bpm || null,
          keyScale: keyScale || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "resolve_audio") {
      const tid = taskIdInput.trim();
      if (!tid) throw new Error("Missing taskId");

      if (!authedUserId || !authedSupabase) {
        if (!lookupSupabase) {
          return new Response(JSON.stringify({ error: "Server not configured" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const publicLoopId = await findPublicLoopIdByAceTaskId(lookupSupabase, tid);
        if (!publicLoopId) {
          return new Response(JSON.stringify({ error: "Not allowed" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const seedKey = generationKey || requestId;
      const aceTargets = getAceTargets(seedKey, aceKeyPreferIndex ?? undefined);
      if (!aceTargets.length) throw new Error("ACE_STEP_API_KEY not set");

      const controller = new AbortController();
      const requestTimeoutMs = 25_000;
      const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

      try {
        let audioUrl = "";
        let lastErr: unknown = null;
        for (const t of aceTargets) {
          try {
            const pollUrl = `${t.baseUrl}/query_result`;
            const pollParams = new URLSearchParams();
            pollParams.append("ai_token", t.apiKey);
            pollParams.append("task_id_list", JSON.stringify([tid]));
            pollParams.append("app", "studio-web");
            const pollRes = await fetch(pollUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
              },
              body: pollParams,
              signal: controller.signal,
            });
            const pollText = await readTextSafe(pollRes);
            if (!pollRes.ok) throw new Error(`ACE query_result failed (${pollRes.status}): ${pollText}`);
            const pollJson = JSON.parse(pollText) as unknown;
            const item = Array.isArray((pollJson as { data?: unknown } | null)?.data) ? (pollJson as { data: unknown[] }).data[0] : null;
            const statusNum = item && typeof (item as { status?: unknown }).status === "number" ? ((item as { status: number }).status as number) : 0;
            if (statusNum !== 1) continue;
            const resultStr = asString((item as { result?: unknown } | null)?.result);
            if (!resultStr) continue;
            const results = JSON.parse(resultStr) as unknown;
            const first = Array.isArray(results) ? results[0] : null;
            const file = first && typeof (first as { file?: unknown }).file === "string" ? ((first as { file: string }).file as string) : "";
            audioUrl = buildAceAudioUrlFromPath(t.baseUrl, file);
            if (audioUrl) break;
          } catch (e) {
            lastErr = e;
            continue;
          }
        }
        if (!audioUrl) {
          const msg = lastErr instanceof Error ? lastErr.message : "Audio not found";
          throw new Error(msg);
        }
        const publicLoopId = await fbFindPublicLoopByAceTaskId(tid);
        if (publicLoopId) {
          await fbUpdateLoop(publicLoopId, { audio_url: audioUrl });
        }
        return new Response(JSON.stringify({ audioUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } finally {
        clearTimeout(timer);
      }
    }

    const effectiveLyrics = instrumental ? "[Instrumental]" : (lyricsRaw ? lyricsRaw.trim() : "");
    const baseCaption = sampleMode ? effectiveSampleQuery : caption.trim() || sampleQuery.trim();
    const effectivePrompt = (sampleMode ? effectiveSampleQuery : caption).trim();
    if (!effectivePrompt) throw new Error("Missing caption");

    const isSongRequest = body?.isSong === true;
    const songDurationRaw =
      duration && duration > 0
        ? duration
        : !instrumental && isSongRequest && effectiveLyrics.length > 0
          ? estimateSongDurationFromLyrics(effectiveLyrics)
          : null;
    const aceTimeoutMs = aceRequestTimeoutMs({ instrumental, isSong: isSongRequest, lyrics: effectiveLyrics });

    const dualBatch = body?.dualBatch === true;
    const dualSeedsParsed = (() => {
      const raw = body?.dualSeeds;
      if (!Array.isArray(raw) || raw.length < 2) return null;
      const a = asNumber(raw[0]);
      const b = asNumber(raw[1]);
      if (a == null || b == null) return null;
      return [Math.floor(a), Math.floor(b)] as [number, number];
    })();
    const generationKeysList = (() => {
      const raw = body?.generationKeys;
      if (!Array.isArray(raw)) return [] as string[];
      return raw.map((k) => asString(k).trim()).filter((k) => k.length > 0).slice(0, 2);
    })();

    if (dualBatch && dualSeedsParsed) {
      if (!canDualGenerationPlan(authedPlan)) {
        return new Response(
          JSON.stringify({
            error: "Dual batch generation requires Studio or Plus plan.",
            dualBatchForbidden: true,
            plan: authedPlan,
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (authedUserId) {
        for (const gk of generationKeysList) {
          const usage = await fbCheckCodeAtempotent(authedUserId, gk);
          if (!usage?.ok) {
            return new Response(
              JSON.stringify({
                error: `Monthly limit reached for dual batch.`,
                limitReached: true,
              }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
        }
      }

      const chatAceArgs = {
        seedKey: generationKeysList[0] || generationKey || requestId,
        prompt: effectivePrompt,
        baseCaption: baseCaption || effectivePrompt,
        lyrics: effectiveLyrics,
        instrumental,
        melodyComposition,
        genre: asString(body?.genre),
        mood: asString(body?.mood),
        energyLevel: asString(body?.energyLevel),
        autoMeta: body?.autoMeta === true,
        key: asString(body?.key),
        scale: asString(body?.scale),
        requestedDuration: computeRequestedDurationSec({
          instrumental,
          durationRaw: songDurationRaw,
          bpm,
          bars: loopLengthBars,
        }),
        bpm,
        keyScale: keyScale.trim().length > 0 ? keyScale.trim() : key && scale ? `${key} ${scale}` : keyScale.trim(),
        timeSignature,
        vocalLanguage: asString(body?.vocalLanguage) || "en",
        vocalStyle: asString(body?.vocalStyle).trim() || undefined,
        audioFormat,
        thinking: resolveAceQualityFlags({ thinking, useFormat, sampleMode }).thinking,
        useFormat: resolveAceQualityFlags({ thinking, useFormat, sampleMode }).useFormat,
        sampleMode,
        sampleQuery: effectiveSampleQuery,
        captionOverride,
      };

      const controller = new AbortController();
      const requestTimeoutMs = aceTimeoutMs;
      const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

      try {
        let lastErr: unknown = null;
        for (const t of aceTargets) {
          try {
            const batchSampleMode = chatAceArgs.sampleMode === true;
            const batchSampleQuery =
              (chatAceArgs.sampleQuery || "").trim() ||
              (batchSampleMode
                ? buildAceSampleQuery({
                    genre: chatAceArgs.genre,
                    idea: chatAceArgs.prompt,
                    vocalStyle: chatAceArgs.vocalStyle,
                  })
                : "");
            const batchMessage = buildAceChatCompletionsMessage({
              seedKey: chatAceArgs.seedKey,
              baseCaption: chatAceArgs.baseCaption,
              prompt: chatAceArgs.prompt,
              lyrics: effectiveLyrics,
              instrumental,
              melodyComposition,
              genre: chatAceArgs.genre,
              mood: chatAceArgs.mood,
              energyLevel: chatAceArgs.energyLevel,
              autoMeta: chatAceArgs.autoMeta,
              bpm: chatAceArgs.bpm,
              key: chatAceArgs.key,
              scale: chatAceArgs.scale,
              timeSignature: chatAceArgs.timeSignature,
              vocalLanguage: chatAceArgs.vocalLanguage,
              vocalStyle: chatAceArgs.vocalStyle,
              sampleMode: batchSampleMode,
              sampleQuery: batchSampleQuery,
              captionOverride: chatAceArgs.captionOverride,
            });
            const batchLyricsField = resolveAceLyricsApiFieldForRequest({
              instrumental,
              lyricsTrimmed: effectiveLyrics,
              sampleMode: batchSampleMode,
            });
            const batchMetaCaption = batchSampleMode ? batchSampleQuery : chatAceArgs.baseCaption || chatAceArgs.prompt;
            const res = await fetch(`${t.baseUrl}/v1/chat/completions`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${t.apiKey}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify(
                buildAceChatCompletionsHttpBody({
                  model: ACE_RELEASE_MODEL,
                  thinking: chatAceArgs.thinking,
                  useFormat: chatAceArgs.useFormat,
                  sampleMode: batchSampleMode,
                  sampleQuery: batchSampleQuery,
                  messageContent: batchMessage,
                  lyricsField: batchLyricsField,
                  batchSize: 2,
                  audioConfig: {
                    instrumental,
                    ...(chatAceArgs.requestedDuration != null ? { duration: chatAceArgs.requestedDuration } : {}),
                    bpm: chatAceArgs.bpm && chatAceArgs.bpm > 0 ? chatAceArgs.bpm : null,
                    key_scale: chatAceArgs.keyScale || null,
                    time_signature: chatAceArgs.timeSignature.trim() || null,
                    vocal_language: chatAceArgs.vocalLanguage || "en",
                    format: audioFormat,
                    audio_format: audioFormat,
                    shift: ACE_SHIFT,
                    inference_steps: ACE_INFERENCE_STEPS,
                    seed: dualSeedsParsed[0],
                    seeds: dualSeedsParsed,
                    use_random_seed: false,
                  },
                  extraFields: melodyComposition ? aceMelodyCompositionAceFields() : undefined,
                }),
              ),
              signal: controller.signal,
            });
            const text = await readTextSafe(res);
            if (!res.ok) throw new Error(`ACE dual batch failed (${res.status}): ${text.slice(0, 400)}`);
            const json = JSON.parse(text) as unknown;
            const audios = parseAllAceChatCompletionsJson(json, t.baseUrl);
            if (!audios.length) throw new Error("ACE dual batch returned no audio");

            const choices = (json as { choices?: unknown } | null)?.choices;
            const firstChoice = Array.isArray(choices) ? choices[0] : null;
            const messageObj =
              firstChoice && typeof firstChoice === "object" && firstChoice !== null
                ? (firstChoice as { message?: unknown }).message
                : null;
            const content =
              messageObj &&
              typeof messageObj === "object" &&
              messageObj !== null &&
              typeof (messageObj as { content?: unknown }).content === "string"
                ? ((messageObj as { content: string }).content as string)
                : "";
            const parsedContent = content ? parseAceChatContent(content) : {};

            const results = audios.slice(0, 2).map((parsed, i) => ({
              audioUrl: parsed.httpAudioUrl || parsed.audioUrl,
              seed: dualSeedsParsed[i],
              meta: {
                prompt: parsedContent.prompt || batchMetaCaption,
                lyrics: instrumental
                  ? ""
                  : resolveAceLyricsForMeta({
                      parsedLyrics: parsedContent.lyrics,
                      userLyrics: effectiveLyrics,
                      caption: batchMetaCaption,
                    }) || undefined,
                bpm: parsedContent.bpm ?? (bpm && bpm > 0 ? bpm : null),
                duration: parsedContent.duration ?? chatAceArgs.requestedDuration,
                keyScale: parsedContent.keyScale || chatAceArgs.keyScale || null,
                timeSignature: parsedContent.timeSignature || timeSignature || null,
                audioFormat,
                engine: "chat-completions-dual-batch",
                aceKeyIndex: t.keyIndex,
                aceKeyCount,
                ...(parsed.taskId ? { taskId: parsed.taskId, task_id: parsed.taskId } : {}),
                ...(parsed.httpAudioUrl ? { httpAudioUrl: parsed.httpAudioUrl } : {}),
                sessionOnly: parsed.sessionOnly,
              },
            }));

            if (authedUserId) {
              for (const gk of generationKeysList) {
                await fbBumpUsageIdempotent(authedUserId, gk);
              }
            }

            console.log("ACE dual batch success", { requestId, audioCount: results.length });
            return new Response(
              JSON.stringify({
                results,
                partial: results.length < 2,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          } catch (e) {
            lastErr = e;
          }
        }
        const msg = lastErr instanceof Error ? lastErr.message : "ACE dual batch failed";
        throw new Error(msg);
      } finally {
        clearTimeout(timer);
      }
    }
    const mood = asString(body?.mood);
    const energyLevel = asString(body?.energyLevel);
    const autoMeta = body?.autoMeta === true;
    const key = asString(body?.key);
    const scale = asString(body?.scale);
    const requestedDuration = computeRequestedDurationSec({
      instrumental,
      durationRaw: songDurationRaw,
      bpm,
      bars: loopLengthBars,
    });

    const vocalLanguage = asString(body?.vocalLanguage) || "en";
    const vocalStyle = asString(body?.vocalStyle).trim();
    const keyValue = keyScale.trim().length > 0 ? keyScale.trim() : key && scale ? `${key} ${scale}` : keyScale.trim();
    const quality = resolveAceQualityFlags({ thinking, useFormat, sampleMode });

    const chatAceArgs = {
      seedKey,
      prompt: effectivePrompt,
      baseCaption: baseCaption || effectivePrompt,
      lyrics: effectiveLyrics,
      instrumental,
      melodyComposition,
      genre,
      mood,
      energyLevel,
      autoMeta,
      key,
      scale,
      requestedDuration: requestedDuration ?? null,
      bpm,
      keyScale: keyValue,
      timeSignature,
      vocalLanguage,
      vocalStyle: vocalStyle || undefined,
      audioFormat,
      thinking: quality.thinking,
      useFormat: quality.useFormat,
      sampleMode,
      sampleQuery: effectiveSampleQuery,
      captionOverride,
    };

    const runChatCompletions = async (signal: AbortSignal) => {
      let lastChatErr: unknown = null;
      for (const t of aceTargets) {
        try {
          const out = await generateViaChatCompletionsAce({
            ...chatAceArgs,
            apiKey: t.apiKey,
            baseUrl: t.baseUrl,
            signal,
          });
          return {
            audioUrl: out.audioUrl,
            chatJson: out.chatJson,
            meta: {
              ...(out.meta ?? {}),
              aceKeyIndex: t.keyIndex,
              aceKeyCount,
            },
          };
        } catch (e) {
          lastChatErr = e;
        }
      }
      const msg = lastChatErr instanceof Error ? lastChatErr.message : "ACE chat/completions failed";
      throw new Error(msg);
    };

    const controller = new AbortController();
    const requestTimeoutMs = aceTimeoutMs;
    const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

    let audioUrl = "";
    let meta: Record<string, unknown> | null = null;
    let chatJsonForStems: unknown | null = null;

    try {
      const startedAt = Date.now();
      let lastErr: unknown = null;

      if (!instrumental) {
        let voiceCloneDone = false;
        let voiceProfileNameResolved: string | undefined;
        if (voiceProfileId && authedUserId) {
          // Fetch voice profile from Firestore and use Firebase Storage
          const voiceProfile = await fbGetVoiceProfile(voiceProfileId, authedUserId);
          if (voiceProfile?.storage_path) {
            const download = await fbDownloadFromStorage("voice-profiles", voiceProfile.storage_path);
            if (download.bytes) {
              const refBytes = download.bytes;
              let lastCloneErr: unknown = null;
              for (const t of aceTargets) {
                try {
                  const cloned = await generateViaMusicGenerateReference({
                    apiKey: t.apiKey,
                    baseUrl: t.baseUrl,
                    referenceBytes: refBytes,
                    referenceName: voiceProfile.storage_path.split("/").pop() || "reference.wav",
                    prompt: effectivePrompt || baseCaption,
                    lyrics: effectiveLyrics,
                    vocalLanguage,
                    audioFormat,
                    duration: requestedDuration ?? null,
                    bpm: bpm && bpm > 0 ? bpm : null,
                    timbreStrength: voiceCloneStrength,
                    signal: controller.signal,
                  });
                  audioUrl = cloned.audioUrl;
                  meta = {
                    ...(cloned.meta ?? {}),
                    aceKeyIndex: t.keyIndex,
                    aceKeyCount,
                    voiceProfileId,
                    voiceProfileName: voiceProfile.name,
                    voiceCloneStrength,
                  };
                  voiceCloneDone = true;
                  console.log("Song mode — voice clone OK", { requestId, voiceProfileId });
                  break;
                } catch (e) {
                  lastCloneErr = e;
                }
              }
              if (!voiceCloneDone && lastCloneErr) {
                console.warn("Voice clone failed — fallback chat/completions", lastCloneErr);
              }
            } else {
              console.warn("Voice clone reference not found in Firebase Storage", voiceProfile.storage_path);
            }
          } else {
            console.warn("Voice clone profile not found", voiceProfileId);
          }
        }
        if (!voiceCloneDone) {
          const voiceFallbackMeta = voiceProfileId
            ? {
                voiceCloneRequested: true,
                voiceCloneFallback: true,
                voiceProfileId,
                voiceProfileName: voiceProfileNameResolved,
                voiceCloneStrength,
              }
            : null;
          console.log("Song mode — chat/completions only", { requestId, sampleMode, requirePersistableUrl, voiceProfileId });
          const out = await runChatCompletions(controller.signal);
          audioUrl = out.audioUrl;
          meta = {
            ...(out.meta ?? {}),
            ...(voiceFallbackMeta ?? {}),
          };
          chatJsonForStems = out.chatJson ?? null;
          if (requirePersistableUrl && audioUrl.startsWith("data:audio")) {
            meta = { ...(meta ?? {}), providerDataUrl: audioUrl, sessionOnly: false, aceKeyCount };
          }
        }
      } else if (!isAceReleaseTaskEnabled()) {
        console.log("Beat mode — chat/completions only", { requestId, sampleMode });
        const out = await runChatCompletions(controller.signal);
        audioUrl = out.audioUrl;
        meta = out.meta;
        chatJsonForStems = out.chatJson ?? null;
      } else {
      const keyValueRelease = keyValue;
      const attemptOnce = async (apiKey: string, baseUrl: string) => {
        const paramObj: Record<string, unknown> = {};
        if (requestedDuration != null) paramObj.duration = requestedDuration;
        if (bpm && bpm > 0) paramObj.bpm = bpm;
        if (timeSignature.trim().length > 0) paramObj.time_signature = timeSignature.trim();
        if (keyValueRelease) paramObj.key = keyValueRelease;
        if (audioFormat) paramObj.audio_format = audioFormat;
        if (seed && seed > 0) paramObj.seed = seed;
        paramObj.shift = quality.shift;
        paramObj.inference_steps = ACE_INFERENCE_STEPS;

        const createUrl = `${baseUrl}/release_task`;
        const releaseForm = new FormData();
        releaseForm.append("env", "production");
        releaseForm.append("ai_token", apiKey);
        releaseForm.append("prompt", effectivePrompt);
        releaseForm.append("lyrics", effectiveLyrics);
        releaseForm.append("model_name", ACE_RELEASE_MODEL);
        releaseForm.append("app", "studio-web");
        releaseForm.append("thinking", quality.thinking ? "true" : "false");
        releaseForm.append("use_format", quality.useFormat ? "true" : "false");
        if (sampleMode) {
          releaseForm.append("sample_mode", "true");
          const sq = effectiveSampleQuery.trim();
          if (sq) releaseForm.append("sample_query", sq);
        }
        releaseForm.append("vocal_language", vocalLanguage);
        releaseForm.append("param_obj", JSON.stringify(paramObj));
        console.log("ACE release_task request", {
          requestId,
          instrumental,
          songQualityV2: !instrumental && isAceSongQualityV2Enabled(),
          method: "POST",
          url: createUrl,
          headers: { Accept: "application/json" },
          body: redactAiToken({
            env: "production",
            ai_token: apiKey,
            prompt: effectivePrompt,
            lyrics: effectiveLyrics,
            model_name: ACE_RELEASE_MODEL,
            app: "studio-web",
            thinking: quality.thinking,
            use_format: quality.useFormat,
            sample_mode: sampleMode,
            vocal_language: vocalLanguage,
            param_obj: paramObj,
          }),
        });

        const createRes = await fetch(createUrl, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: releaseForm,
          signal: controller.signal,
        });
        const createText = await readTextSafe(createRes);
        console.log("ACE release_task response", { requestId, status: createRes.status, ok: createRes.ok, body: createText });
        if (!createRes.ok) {
          if (createRes.status === 404) {
            const err = new Error("ACE release_task 404") as Error & { release404?: boolean };
            err.release404 = true;
            throw err;
          }
          const err = new Error(`ACE API release_task failed (${createRes.status}): ${createText}`) as Error & { status?: number };
          err.status = createRes.status;
          throw err;
        }
        const createJson = JSON.parse(createText) as unknown;
        const taskId = asString(
          (createJson as { data?: unknown } | null)?.data && typeof (createJson as { data?: unknown }).data === "object"
            ? ((createJson as { data: { task_id?: unknown } }).data.task_id as unknown)
            : "",
        );
        if (!taskId) throw new Error("ACE API did not return a task_id");
        console.log("ACE task created", { requestId, taskId, plan: authedPlan, duration: requestedDuration });

        while (Date.now() - startedAt < requestTimeoutMs - 5_000) {
          const pollUrl = `${baseUrl}/query_result`;
          const pollParams = new URLSearchParams();
          pollParams.append("ai_token", apiKey);
          pollParams.append("task_id_list", JSON.stringify([taskId]));
          pollParams.append("app", "studio-web");
          console.log("ACE query_result request", {
            requestId,
            method: "POST",
            url: pollUrl,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
            },
            body: redactAiToken({ ai_token: apiKey, task_id_list: [taskId], app: "studio-web" }),
          });

          const pollRes = await fetch(pollUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
            },
            body: pollParams,
            signal: controller.signal,
          });
          const pollText = await readTextSafe(pollRes);
          console.log("ACE query_result response", { requestId, status: pollRes.status, ok: pollRes.ok, body: pollText });
          if (!pollRes.ok) {
            const err = new Error(`ACE API query_result failed (${pollRes.status}): ${pollText}`) as Error & { status?: number };
            err.status = pollRes.status;
            throw err;
          }
          const pollJson = JSON.parse(pollText) as unknown;
          const item = Array.isArray((pollJson as { data?: unknown } | null)?.data) ? (pollJson as { data: unknown[] }).data[0] : null;
          const statusNum = item && typeof (item as { status?: unknown }).status === "number" ? ((item as { status: number }).status as number) : 0;
          if (statusNum === 1) {
            const resultStr = asString((item as { result?: unknown } | null)?.result);
            if (!resultStr) throw new Error("ACE task succeeded but result is empty");
            const results = JSON.parse(resultStr) as unknown;
            const first = Array.isArray(results) ? results[0] : null;
            const firstObj = first && typeof first === "object" && first !== null ? (first as Record<string, unknown>) : null;
            const file = first && typeof (first as { file?: unknown }).file === "string" ? ((first as { file: string }).file as string) : "";
            audioUrl = buildAceAudioUrlFromPath(baseUrl, file);
            if (!audioUrl) throw new Error("ACE task returned no audio file");
            const metasObj =
              firstObj && typeof firstObj.metas === "object" && firstObj.metas !== null ? (firstObj.metas as Record<string, unknown>) : null;
            const stemsZipUrl = pickStemsZipUrl(baseUrl, firstObj, metasObj);
            const lyricsFromResult =
              (firstObj && typeof firstObj.lyrics === "string" ? (firstObj.lyrics as string) : "") ||
              (firstObj && typeof firstObj.text === "string" ? (firstObj.text as string) : "") ||
              (metasObj && typeof metasObj.lyrics === "string" ? (metasObj.lyrics as string) : "");
            const usedSeed =
              metasObj && typeof metasObj.seed === "number"
                ? (metasObj.seed as number)
                : metasObj && typeof metasObj.random_seed === "number"
                  ? (metasObj.random_seed as number)
                  : null;
            const durationFromMetas = metasObj && typeof metasObj.duration === "number" ? (metasObj.duration as number) : null;
            const bpmFromMetas = metasObj && typeof metasObj.bpm === "number" ? (metasObj.bpm as number) : null;
            const keyScaleFromMetas =
              metasObj && typeof metasObj.keyscale === "string"
                ? (metasObj.keyscale as string)
                : metasObj && typeof metasObj.key_scale === "string"
                  ? (metasObj.key_scale as string)
                  : null;
            const timeSignatureFromMetas =
              metasObj && typeof metasObj.timesignature === "string"
                ? (metasObj.timesignature as string)
                : metasObj && typeof metasObj.time_signature === "string"
                  ? (metasObj.time_signature as string)
                  : null;
            meta = {
              taskId,
              task_id: taskId,
              prompt: effectivePrompt,
              lyrics: resolveAceLyricsForMeta({
                parsedLyrics: lyricsFromResult,
                userLyrics: lyricsRaw ? lyricsRaw.trim() : "",
                caption: effectivePrompt,
              }),
              bpm: bpmFromMetas ?? bpm ?? null,
              duration: durationFromMetas ?? requestedDuration ?? null,
              keyScale: keyScaleFromMetas ?? (keyValueRelease || null),
              timeSignature: timeSignatureFromMetas ?? (timeSignature.trim().length > 0 ? timeSignature.trim() : null),
              audioFormat,
              seed: usedSeed,
              stemsZipUrl: stemsZipUrl || null,
              httpAudioUrl: isHttpUrl(audioUrl) ? audioUrl : null,
              sessionOnly: false,
            };
            console.log("ACE task succeeded", { requestId, taskId, elapsedMs: Date.now() - startedAt });
            return;
          }
          if (statusNum === 2) throw new Error("ACE task failed");
          await sleep(2000);
        }
        throw new Error("ACE generation timed out");
      };

      let sawRelease404 = false;
      for (const t of aceTargets) {
        try {
          await attemptOnce(t.apiKey, t.baseUrl);
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
          if ((e as { release404?: boolean }).release404) {
            sawRelease404 = true;
            continue;
          }
          const status = typeof (e as { status?: unknown } | null)?.status === "number" ? ((e as { status: number }).status as number) : 0;
          if (status === 404 || status === 502 || status === 503 || status === 504) {
            sawRelease404 = true;
            continue;
          }
          if (status && !isRetryableAceHttpStatus(status) && status !== 404) break;
          if (audioUrl) break;
        }
      }

      if (!audioUrl && sawRelease404) {
        console.log("ACE release_task 404 on all bases — fallback chat/completions", { requestId, instrumental });
        const out = await runChatCompletions(controller.signal);
        audioUrl = out.audioUrl;
        meta = out.meta;
        chatJsonForStems = out.chatJson ?? null;
        lastErr = null;
      }

      } // beat / instrumental path

      if (audioUrl && canStemsPlan(authedPlan)) {
        meta = await enrichPlusStemsMeta(meta, authedPlan, aceTargets, chatJsonForStems, controller.signal);
      }

      if (!audioUrl) {
        const msg = lastErr instanceof Error ? lastErr.message : "ACE generation failed";
        throw new Error(msg);
      }
    } finally {
      clearTimeout(timer);
    }

    if (authedUserId && action !== "format") {
      if (useIdempotentUsage && generationKey) {
        await fbBumpUsageIdempotent(authedUserId, generationKey);
      } else {
        await fbBumpUsage(authedUserId);
      }
    }

    return new Response(JSON.stringify({ audioUrl, meta }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("ACE-Step Edge Function error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}