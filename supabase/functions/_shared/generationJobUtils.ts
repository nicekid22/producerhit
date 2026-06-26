import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAceLyricsApiField, resolveAceLyricsForMeta } from "./aceLyricsApi.ts";

export type GenerationJobStatus = "pending" | "running" | "completed" | "failed";

export type GenerationJobRow = {
  id: string;
  user_id: string;
  generation_key: string | null;
  status: GenerationJobStatus;
  mode: string | null;
  ace_task_id: string | null;
  ace_base_url: string | null;
  ace_key_index: number | null;
  audio_url: string | null;
  meta: Record<string, unknown> | null;
  error: string | null;
  payload: Record<string, unknown>;
  updated_at?: string | null;
};

export function aceAsyncJobsEnabled(): boolean {
  return Deno.env.get("ACE_ASYNC_JOBS") !== "0";
}

export function aceAsyncTryReleaseTask(): boolean {
  return Deno.env.get("ACE_ASYNC_TRY_RELEASE_TASK") !== "0";
}

export function internalJobSecret(): string {
  return (Deno.env.get("ACE_INTERNAL_JOB_SECRET") ?? Deno.env.get("ACE_JOB_SECRET") ?? "").trim();
}

export function createServiceSupabase(): SupabaseClient | null {
  const url = (Deno.env.get("SUPABASE_URL") ?? "").trim();
  const key = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function scheduleRunJob(jobId: string): void {
  const url = `${(Deno.env.get("SUPABASE_URL") ?? "").trim()}/functions/v1/generate-loop-ace`;
  const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  const secret = internalJobSecret();
  if (!url || !serviceKey || !secret) {
    console.error("scheduleRunJob: missing SUPABASE_URL, SERVICE_ROLE_KEY or ACE_INTERNAL_JOB_SECRET");
    return;
  }
  void fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
      "x-ace-job-secret": secret,
    },
    body: JSON.stringify({ action: "run_job", jobId }),
  }).catch((e) => console.error("scheduleRunJob fetch failed", e));
}

export function buildAceAudioUrlFromPath(baseUrl: string, filePath: string): string {
  const t = filePath.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const base = baseUrl.replace(/\/$/, "");
  if (t.startsWith("/v1/audio?path=")) return `${base}${t}`;
  if (t.startsWith("v1/audio?path=")) return `${base}/${t}`;
  if (t.startsWith("/")) return `${base}/v1/audio?path=${encodeURIComponent(t)}`;
  return `${base}/v1/audio?path=${encodeURIComponent(t)}`;
}

async function readTextSafe(res: Response) {
  return await res.text().catch(() => "");
}

function toAbsoluteAceUrl(baseUrl: string, maybePath: string) {
  const t = maybePath.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const base = baseUrl.replace(/\/$/, "");
  if (t.startsWith("/")) return `${base}${t}`;
  return `${base}/${t}`;
}

export function pickStemsZipUrl(
  baseUrl: string,
  firstObj: Record<string, unknown> | null,
  metasObj: Record<string, unknown> | null,
): string {
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
    const abs = toAbsoluteAceUrl(baseUrl, c);
    if (!abs) continue;
    const lower = abs.toLowerCase();
    if (lower.includes(".zip") || lower.includes("stem") || lower.includes("stems")) return abs;
  }
  for (const c of candidates) {
    if (typeof c !== "string") continue;
    const abs = toAbsoluteAceUrl(baseUrl, c);
    if (abs.startsWith("http://") || abs.startsWith("https://")) return abs;
  }
  return "";
}

function pickStemsZipUrlFromAceJson(baseUrl: string, json: unknown): string {
  const root = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
  if (!root) return "";
  const fromRoot = pickStemsZipUrl(baseUrl, root, null);
  if (fromRoot) return fromRoot;

  const choices = root.choices;
  const firstChoice = Array.isArray(choices) ? choices[0] : null;
  const msg =
    firstChoice && typeof firstChoice === "object" && firstChoice !== null
      ? ((firstChoice as { message?: unknown }).message as Record<string, unknown> | null)
      : null;
  if (msg) {
    const fromMsg = pickStemsZipUrl(baseUrl, msg, null);
    if (fromMsg) return fromMsg;
    const audioArr = Array.isArray(msg.audio) ? msg.audio : [];
    for (const item of audioArr) {
      if (!item || typeof item !== "object") continue;
      const fromAudio = pickStemsZipUrl(baseUrl, item as Record<string, unknown>, null);
      if (fromAudio) return fromAudio;
    }
  }
  return "";
}

/** Poll ACE query_result pour récupérer stemsZipUrl après chat/completions (plan Plus). */
export async function resolveAceStemsZipUrl(args: {
  baseUrl: string;
  apiKey: string;
  taskId: string;
  chatJson?: unknown;
  signal?: AbortSignal;
  maxWaitMs?: number;
}): Promise<string> {
  const fromChat = args.chatJson ? pickStemsZipUrlFromAceJson(args.baseUrl, args.chatJson) : "";
  if (fromChat) return fromChat;
  if (!args.taskId.trim()) return "";

  const deadline = Date.now() + (args.maxWaitMs ?? 45_000);
  const base = args.baseUrl.replace(/\/$/, "");
  while (Date.now() < deadline) {
    const pollParams = new URLSearchParams();
    pollParams.append("ai_token", args.apiKey);
    pollParams.append("task_id_list", JSON.stringify([args.taskId.trim()]));
    pollParams.append("app", "studio-web");
    const pollRes = await fetch(`${base}/query_result`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: pollParams,
      signal: args.signal,
    });
    const pollText = await readTextSafe(pollRes);
    if (!pollRes.ok) {
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }
    let pollJson: unknown;
    try {
      pollJson = JSON.parse(pollText);
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }
    const item = Array.isArray((pollJson as { data?: unknown } | null)?.data)
      ? (pollJson as { data: unknown[] }).data[0]
      : null;
    const statusNum =
      item && typeof (item as { status?: unknown }).status === "number"
        ? ((item as { status: number }).status as number)
        : 0;
    if (statusNum === 2) break;
    if (statusNum !== 1) {
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }
    const resultStr =
      typeof (item as { result?: unknown } | null)?.result === "string"
        ? ((item as { result: string }).result as string)
        : "";
    if (!resultStr) break;
    let results: unknown;
    try {
      results = JSON.parse(resultStr);
    } catch {
      break;
    }
    const first = Array.isArray(results) ? results[0] : null;
    const firstObj = first && typeof first === "object" && first !== null ? (first as Record<string, unknown>) : null;
    const metasObj =
      firstObj && typeof firstObj.metas === "object" && firstObj.metas !== null
        ? (firstObj.metas as Record<string, unknown>)
        : null;
    const stemsZipUrl = pickStemsZipUrl(args.baseUrl, firstObj, metasObj);
    if (stemsZipUrl) return stemsZipUrl;
    break;
  }
  return "";
}

export type AcePollResult =
  | { status: "pending" }
  | { status: "failed"; error: string }
  | { status: "ready"; audioUrl: string; meta: Record<string, unknown> };

/** Un seul poll ACE query_result — rapide (<10s), pour boucle client 3s. */
export async function pollAceTaskOnce(args: {
  baseUrl: string;
  apiKey: string;
  taskId: string;
  effectivePrompt: string;
  effectiveLyrics: string;
  audioFormat: string;
  requestedDuration: number | null;
  bpm: number | null;
  keyScale: string;
  timeSignature: string;
  seed: number | null;
  signal?: AbortSignal;
}): Promise<AcePollResult> {
  const pollParams = new URLSearchParams();
  pollParams.append("ai_token", args.apiKey);
  pollParams.append("task_id_list", JSON.stringify([args.taskId]));
  pollParams.append("app", "studio-web");
  const pollRes = await fetch(`${args.baseUrl.replace(/\/$/, "")}/query_result`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: pollParams,
    signal: args.signal,
  });
  const pollText = await readTextSafe(pollRes);
  if (!pollRes.ok) {
    return { status: "pending" };
  }
  let pollJson: unknown;
  try {
    pollJson = JSON.parse(pollText);
  } catch {
    return { status: "pending" };
  }
  const item = Array.isArray((pollJson as { data?: unknown } | null)?.data)
    ? (pollJson as { data: unknown[] }).data[0]
    : null;
  const statusNum =
    item && typeof (item as { status?: unknown }).status === "number"
      ? ((item as { status: number }).status as number)
      : 0;
  if (statusNum === 2) {
    return { status: "failed", error: "ACE task failed" };
  }
  if (statusNum !== 1) return { status: "pending" };

  const resultStr =
    typeof (item as { result?: unknown } | null)?.result === "string"
      ? ((item as { result: string }).result as string)
      : "";
  if (!resultStr) return { status: "pending" };

  let results: unknown;
  try {
    results = JSON.parse(resultStr);
  } catch {
    return { status: "pending" };
  }
  const first = Array.isArray(results) ? results[0] : null;
  const firstObj = first && typeof first === "object" && first !== null ? (first as Record<string, unknown>) : null;
  const file =
    first && typeof (first as { file?: unknown }).file === "string"
      ? ((first as { file: string }).file as string)
      : "";
  const audioUrl = buildAceAudioUrlFromPath(args.baseUrl, file);
  if (!audioUrl) return { status: "pending" };

  const metasObj =
    firstObj && typeof firstObj.metas === "object" && firstObj.metas !== null
      ? (firstObj.metas as Record<string, unknown>)
      : null;
  const lyricsFromResult =
    firstObj && typeof firstObj.lyrics === "string" ? (firstObj.lyrics as string) : "";
  const stemsZipUrl = pickStemsZipUrl(args.baseUrl, firstObj, metasObj);
  const meta: Record<string, unknown> = {
    taskId: args.taskId,
    task_id: args.taskId,
    prompt: args.effectivePrompt,
    lyrics: resolveAceLyricsForMeta({
      parsedLyrics: lyricsFromResult,
      userLyrics: args.effectiveLyrics.trim(),
      caption: args.effectivePrompt,
    }),
    bpm: metasObj && typeof metasObj.bpm === "number" ? metasObj.bpm : args.bpm,
    duration: metasObj && typeof metasObj.duration === "number" ? metasObj.duration : args.requestedDuration,
    keyScale:
      metasObj && typeof metasObj.keyscale === "string"
        ? metasObj.keyscale
        : metasObj && typeof metasObj.key_scale === "string"
          ? metasObj.key_scale
          : args.keyScale || null,
    timeSignature: args.timeSignature.trim() || null,
    audioFormat: args.audioFormat,
    seed: args.seed,
    ...(stemsZipUrl ? { stemsZipUrl } : {}),
    httpAudioUrl: audioUrl.startsWith("http") ? audioUrl : null,
    sessionOnly: false,
    asyncJob: true,
  };
  return { status: "ready", audioUrl, meta };
}

export async function loadGenerationJob(
  client: SupabaseClient,
  jobId: string,
): Promise<GenerationJobRow | null> {
  const { data, error } = await client
    .from("generation_jobs")
    .select(
      "id, user_id, generation_key, status, mode, ace_task_id, ace_base_url, ace_key_index, audio_url, meta, error, payload, updated_at",
    )
    .eq("id", jobId)
    .maybeSingle();
  if (error || !data) return null;
  return data as GenerationJobRow;
}

export async function updateGenerationJob(
  client: SupabaseClient,
  jobId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await client.from("generation_jobs").update(patch).eq("id", jobId);
  if (error) console.error("updateGenerationJob", error.message);
}

export const LOOP_AUDIO_BUCKET = "loop-audio";
/** Évite de renvoyer 4+ Mo de base64 dans les réponses JSON poll_job. */
const INLINE_AUDIO_MAX_JSON_CHARS = 400_000;

function decodeDataUrlSync(dataUrl: string): { bytes: Uint8Array; mime: string } | null {
  const raw = dataUrl.trim();
  const m = raw.match(/^data:([^;,]+)?(?:;[^,]*)?;base64,(.+)$/i);
  if (!m) return null;
  try {
    const mime = m[1] || "audio/mpeg";
    const bin = atob(m[2]!);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { bytes, mime };
  } catch {
    return null;
  }
}

/** data: URLs ACE (~4 Mo) — fetch natif Deno, plus fiable que atob sur gros payloads edge. */
export async function decodeDataUrl(dataUrl: string): Promise<{ bytes: Uint8Array; mime: string } | null> {
  const raw = dataUrl.trim();
  if (!raw.startsWith("data:")) return null;
  const mimeMatch = raw.match(/^data:([^;,]+)/i);
  const fallbackMime = mimeMatch?.[1] || "audio/mpeg";
  try {
    const res = await fetch(raw);
    if (!res.ok) return decodeDataUrlSync(raw);
    const buf = await res.arrayBuffer();
    if (!buf.byteLength) return null;
    const headerMime = res.headers.get("content-type")?.split(";")[0]?.trim();
    return {
      bytes: new Uint8Array(buf),
      mime: headerMime || fallbackMime,
    };
  } catch {
    return decodeDataUrlSync(raw);
  }
}

/** Upload data:audio vers loop-audio pour lecture HTTP immédiate (prod async jobs). */
export async function persistInlineJobAudioUrl(
  svc: SupabaseClient,
  userId: string,
  jobId: string,
  audioUrl: string,
): Promise<{ audioUrl: string; providerDataUrl?: string }> {
  const raw = audioUrl.trim();
  if (!raw.startsWith("data:")) return { audioUrl: raw };
  const decoded = await decodeDataUrl(raw);
  if (!decoded?.bytes.byteLength) return { audioUrl: raw };
  const ext = decoded.mime.includes("wav") ? "wav" : "mp3";
  const path = `${userId}/job-${jobId}.${ext}`;
  const { error } = await svc.storage.from(LOOP_AUDIO_BUCKET).upload(path, decoded.bytes, {
    upsert: true,
    contentType: decoded.mime,
    cacheControl: "public, max-age=604800",
  });
  if (error) {
    console.warn("persistInlineJobAudioUrl", error.message);
    return { audioUrl: raw };
  }
  const { data } = svc.storage.from(LOOP_AUDIO_BUCKET).getPublicUrl(path);
  const publicUrl = data?.publicUrl?.trim() || "";
  if (!publicUrl) return { audioUrl: raw };
  return { audioUrl: publicUrl, providerDataUrl: raw };
}

export function jobResponsePayload(job: GenerationJobRow) {
  const meta = job.meta ?? undefined;
  const httpFromMeta =
    meta && typeof meta === "object" && typeof meta.httpAudioUrl === "string"
      ? meta.httpAudioUrl.trim()
      : "";
  let audioUrl = typeof job.audio_url === "string" ? job.audio_url.trim() : "";
  if (httpFromMeta.startsWith("http")) {
    audioUrl = httpFromMeta;
  } else if (audioUrl.startsWith("data:") && audioUrl.length > INLINE_AUDIO_MAX_JSON_CHARS) {
    return {
      jobId: job.id,
      status: job.status,
      audioInline: true,
      meta,
      error: job.error ?? undefined,
      generationKey: job.generation_key ?? undefined,
    };
  }
  return {
    jobId: job.id,
    status: job.status,
    audioUrl: audioUrl || undefined,
    meta,
    error: job.error ?? undefined,
    generationKey: job.generation_key ?? undefined,
  };
}

/** Crée une tâche ACE release_task — retourne task_id ou null si 404. */
export async function createAceReleaseTask(args: {
  baseUrl: string;
  apiKey: string;
  effectivePrompt: string;
  effectiveLyrics: string;
  instrumental: boolean;
  sampleMode: boolean;
  sampleQuery: string;
  vocalLanguage: string;
  audioFormat: string;
  paramObj: Record<string, unknown>;
  thinking: boolean;
  useFormat: boolean;
  modelName: string;
  shift: number;
  inferenceSteps: number;
}): Promise<{ taskId: string } | null> {
  const baseUrl = args.baseUrl.replace(/\/$/, "");
  const releaseForm = new FormData();
  releaseForm.append("env", "production");
  releaseForm.append("ai_token", args.apiKey);
  releaseForm.append("prompt", args.effectivePrompt);
  releaseForm.append(
    "lyrics",
    resolveAceLyricsApiField({
      instrumental: args.instrumental,
      lyricsTrimmed: args.effectiveLyrics.trim(),
    }),
  );
  releaseForm.append("model_name", args.modelName);
  releaseForm.append("app", "studio-web");
  releaseForm.append("thinking", args.thinking ? "true" : "false");
  releaseForm.append("use_format", args.useFormat ? "true" : "false");
  if (args.sampleMode) {
    releaseForm.append("sample_mode", "true");
    const sq = args.sampleQuery.trim();
    if (sq) releaseForm.append("sample_query", sq);
  }
  releaseForm.append("vocal_language", args.vocalLanguage);
  releaseForm.append("param_obj", JSON.stringify(args.paramObj));

  const createRes = await fetch(`${baseUrl}/release_task`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: releaseForm,
  });
  const createText = await readTextSafe(createRes);
  if (!createRes.ok) {
    if (createRes.status === 404) return null;
    throw new Error(`ACE release_task failed (${createRes.status}): ${createText.slice(0, 400)}`);
  }
  let createJson: unknown;
  try {
    createJson = JSON.parse(createText);
  } catch {
    throw new Error("ACE release_task invalid JSON");
  }
  const taskId =
    (createJson as { data?: unknown } | null)?.data && typeof (createJson as { data?: unknown }).data === "object"
      ? String(((createJson as { data: { task_id?: unknown } }).data.task_id as unknown) ?? "").trim()
      : "";
  if (!taskId) throw new Error("ACE API did not return a task_id");
  return { taskId };
}
