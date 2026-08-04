import type { AceMeta } from "@/lib/audioApi";
import {
  AceRemixUnavailableError,
  ACE_REMIX_UNAVAILABLE_COPY,
  isAceHtml404,
  runAceRemixViaMusicGenerate,
} from "@/lib/aceRemixApi";

export { AceRemixUnavailableError, ACE_REMIX_UNAVAILABLE_COPY } from "@/lib/aceRemixApi";

export type AceRemixTaskType = "cover" | "repaint";

export type AceRemixInput = {
  audioFile: File;
  prompt: string;
  lyrics?: string;
  taskType?: AceRemixTaskType;
  coverStrength?: number;
  durationSec?: number | null;
  bpm?: number | null;
  instrumental?: boolean;
  audioFormat?: string;
  generationKey?: string;
};

export type AceRemixResult = {
  audioUrl: string;
  meta: AceMeta | null;
};

export const REMIX_MAX_FILE_BYTES = 12 * 1024 * 1024;

export const REMIX_ACCEPT = "audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/flac,audio/aac,.mp3,.wav,.flac,.aac";

export function validateRemixFile(file: File): string | null {
  if (!file) return "missing_file";
  if (file.size > REMIX_MAX_FILE_BYTES) return "file_too_large";
  const name = file.name.toLowerCase();
  const ok =
    file.type.startsWith("audio/") ||
    name.endsWith(".mp3") ||
    name.endsWith(".wav") ||
    name.endsWith(".flac") ||
    name.endsWith(".aac");
  if (!ok) return "invalid_type";
  return null;
}

export function normalizeAceBaseUrl(baseUrlRaw: string) {
  const trimmed = baseUrlRaw.trim().replace(/\/$/, "");
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    if (host === "acemusic.ai") return "https://api.acemusic.ai";
    if (host === "acem-api.acemusic.ai") return "https://api.acemusic.ai";
    if (path.includes("/api/acem")) return "https://api.acemusic.ai";
  } catch {
    void 0;
  }
  return trimmed;
}

export function buildAceAudioUrl(baseUrl: string, filePath: string) {
  const t = filePath.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("/v1/audio?path=")) return `${baseUrl}${t}`;
  if (t.startsWith("v1/audio?path=")) return `${baseUrl}/${t}`;
  if (t.startsWith("/")) return `${baseUrl}/v1/audio?path=${encodeURIComponent(t)}`;
  return `${baseUrl}/v1/audio?path=${encodeURIComponent(t)}`;
}

function clampNumber(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function parseAceMetaFromResult(args: {
  baseUrl: string;
  taskId: string;
  prompt: string;
  lyrics: string;
  audioFormat: string;
  firstObj: Record<string, unknown> | null;
  fallbackBpm?: number | null;
  fallbackDuration?: number | null;
}): AceMeta {
  const metasObj =
    args.firstObj && typeof args.firstObj.metas === "object" && args.firstObj.metas !== null
      ? (args.firstObj.metas as Record<string, unknown>)
      : null;
  const lyricsFromResult = args.firstObj && typeof args.firstObj.lyrics === "string" ? args.firstObj.lyrics : "";
  const seed =
    metasObj && typeof metasObj.seed === "number"
      ? metasObj.seed
      : metasObj && typeof metasObj.random_seed === "number"
        ? metasObj.random_seed
        : null;
  const duration = metasObj && typeof metasObj.duration === "number" ? metasObj.duration : args.fallbackDuration ?? null;
  const bpm = metasObj && typeof metasObj.bpm === "number" ? metasObj.bpm : args.fallbackBpm ?? null;
  const keyScale =
    metasObj && typeof metasObj.keyscale === "string"
      ? metasObj.keyscale
      : metasObj && typeof metasObj.key_scale === "string"
        ? metasObj.key_scale
        : undefined;
  const timeSignature =
    metasObj && typeof metasObj.timesignature === "string"
      ? metasObj.timesignature
      : metasObj && typeof metasObj.time_signature === "string"
        ? metasObj.time_signature
        : undefined;

  return {
    taskId: args.taskId,
    prompt: args.prompt,
    lyrics: lyricsFromResult || args.lyrics || undefined,
    bpm: bpm && isFinite(bpm) ? bpm : null,
    duration: duration && isFinite(duration) ? duration : null,
    keyScale,
    timeSignature,
    audioFormat: args.audioFormat,
    seed: typeof seed === "number" && isFinite(seed) ? seed : null,
  };
}

export async function pollAceTask(args: {
  baseUrl: string;
  apiKey: string;
  taskId: string;
  timeoutMs?: number;
  onProgress?: (elapsedMs: number) => void;
}): Promise<{ filePath: string; firstObj: Record<string, unknown> | null }> {
  const startedAt = Date.now();
  const timeoutMs = args.timeoutMs ?? 150_000;

  while (Date.now() - startedAt < timeoutMs) {
    args.onProgress?.(Date.now() - startedAt);
    const pollParams = new URLSearchParams();
    pollParams.append("ai_token", args.apiKey);
    pollParams.append("task_id_list", JSON.stringify([args.taskId]));
    pollParams.append("app", "studio-web");
    const pollRes = await fetch(`${args.baseUrl}/query_result`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: pollParams,
    });
    const pollText = await pollRes.text().catch(() => "");
    if (!pollRes.ok) throw new Error(`ACE query_result failed (${pollRes.status}): ${pollText}`);

    const pollJson = JSON.parse(pollText) as unknown;
    const item = Array.isArray((pollJson as { data?: unknown } | null)?.data) ? (pollJson as { data: unknown[] }).data[0] : null;
    const statusNum = item && typeof (item as { status?: unknown }).status === "number" ? (item as { status: number }).status : 0;

    if (statusNum === 1) {
      const resultStr = typeof (item as { result?: unknown } | null)?.result === "string" ? (item as { result: string }).result : "";
      const results = JSON.parse(resultStr) as unknown;
      const first = Array.isArray(results) ? results[0] : null;
      const firstObj = first && typeof first === "object" && first !== null ? (first as Record<string, unknown>) : null;
      const file = first && typeof (first as { file?: unknown }).file === "string" ? (first as { file: string }).file : "";
      if (!file) throw new Error("remix returned no audio file");
      return { filePath: file, firstObj };
    }
    if (statusNum === 2) throw new Error("remix task failed");
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("remix timed out");
}

export async function releaseAceRemixTask(args: {
  baseUrl: string;
  apiKey: string;
  input: AceRemixInput;
}): Promise<{ taskId: string }> {
  const { input } = args;
  const err = validateRemixFile(input.audioFile);
  if (err === "file_too_large") throw new Error("Audio file too large (max 12 MB)");
  if (err) throw new Error("Invalid audio file");

  const taskType = input.taskType ?? "cover";
  const coverStrength = clampNumber(input.coverStrength ?? 0.65, 0.15, 1);
  const instrumental = input.instrumental !== false;
  const lyrics = instrumental ? "[Instrumental]" : (input.lyrics ?? "").trim();
  const prompt = input.prompt.trim();
  if (!prompt) throw new Error("Missing remix prompt");

  const audioFormatRaw = (input.audioFormat || "mp3").trim().toLowerCase();
  const audioFormat =
    audioFormatRaw === "wav" || audioFormatRaw === "flac" || audioFormatRaw === "mp3" ? audioFormatRaw : "mp3";

  const paramObj: Record<string, unknown> = {
    task_type: taskType,
    audio_cover_strength: coverStrength,
    audio_format: audioFormat,
  };
  if (input.durationSec != null && input.durationSec > 0) paramObj.duration = clampNumber(input.durationSec, 10, 240);
  if (input.bpm != null && input.bpm > 0) paramObj.bpm = clampNumber(Math.round(input.bpm), 30, 200);

  const form = new FormData();
  form.append("env", "production");
  form.append("ai_token", args.apiKey);
  form.append("prompt", prompt);
  form.append("lyrics", lyrics || "[Instrumental]");
  form.append("model_name", "acestep-v15-xl-base");
  form.append("app", "studio-web");
  form.append("task_type", taskType);
  form.append("src_audio", input.audioFile, input.audioFile.name || "source.mp3");
  form.append("param_obj", JSON.stringify(paramObj));

  const createRes = await fetch(`${args.baseUrl}/release_task`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: form,
  });
  const createText = await createRes.text().catch(() => "");
  if (!createRes.ok) {
    if (isAceHtml404(createRes.status, createText)) {
      throw new AceRemixUnavailableError("release_task 404");
    }
    throw new Error(`remix release_task failed (${createRes.status}): ${createText.slice(0, 400)}`);
  }

  const createJson = JSON.parse(createText) as unknown;
  const taskId =
    (createJson as { data?: unknown } | null)?.data && typeof (createJson as { data?: unknown }).data === "object"
      ? String(((createJson as { data: { task_id?: unknown } }).data.task_id as unknown) ?? "")
      : "";
  if (!taskId) throw new Error("ACE did not return a task_id");
  return { taskId };
}

async function runAceRemixViaReleaseTask(args: {
  baseUrl: string;
  apiKey: string;
  input: AceRemixInput;
  onProgress?: (elapsedMs: number) => void;
}): Promise<AceRemixResult> {
  const { taskId } = await releaseAceRemixTask(args);
  const polled = await pollAceTask({
    baseUrl: args.baseUrl,
    apiKey: args.apiKey,
    taskId,
    onProgress: args.onProgress,
  });
  const audioUrl = buildAceAudioUrl(args.baseUrl, polled.filePath);
  const audioFormat = (args.input.audioFormat || "mp3").toLowerCase();
  return {
    audioUrl,
    meta: parseAceMetaFromResult({
      baseUrl: args.baseUrl,
      taskId,
      prompt: args.input.prompt.trim(),
      lyrics: args.input.instrumental !== false ? "" : (args.input.lyrics ?? ""),
      audioFormat,
      firstObj: polled.firstObj,
      fallbackBpm: args.input.bpm ?? null,
      fallbackDuration: args.input.durationSec ?? null,
    }),
  };
}

/** Essaye music/generate puis release_task (legacy self-hosted). */
export async function runAceRemix(args: {
  baseUrl: string;
  apiKey: string;
  input: AceRemixInput;
  onProgress?: (elapsedMs: number) => void;
}): Promise<AceRemixResult> {
  const errors: string[] = [];

  try {
    const viaMusic = await runAceRemixViaMusicGenerate(args);
    const audioFormat = (args.input.audioFormat || "mp3").toLowerCase();
    const metas = viaMusic.metas;
    return {
      audioUrl: viaMusic.audioUrl,
      meta: {
        taskId: viaMusic.jobId,
        prompt: args.input.prompt.trim(),
        lyrics: args.input.instrumental !== false ? "" : (args.input.lyrics ?? ""),
        audioFormat,
        bpm: typeof metas?.bpm === "number" ? metas.bpm : (args.input.bpm ?? null),
        duration: typeof metas?.duration === "number" ? metas.duration : (args.input.durationSec ?? null),
        keyScale:
          typeof metas?.keyscale === "string"
            ? metas.keyscale
            : typeof metas?.key_scale === "string"
              ? metas.key_scale
              : undefined,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(msg);
    if (!(e instanceof AceRemixUnavailableError) && !msg.includes("404")) throw e;
  }

  try {
    return await runAceRemixViaReleaseTask(args);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(msg);
    if (!(e instanceof AceRemixUnavailableError) && !msg.includes("404")) throw e;
  }

  throw new AceRemixUnavailableError(ACE_REMIX_UNAVAILABLE_COPY.en);
}

export async function fileFromAudioUrl(url: string, fallbackName = "source.mp3"): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load source audio");
  const blob = await res.blob();
  const type = blob.type || "audio/mpeg";
  return new File([blob], fallbackName, { type });
}
