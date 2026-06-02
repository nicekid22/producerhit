/**
 * Remix ACE — API v1.5 (music/generate + jobs) avec repli release_task.
 * Sur api.acemusic.ai (2026), release_task et music/generate peuvent être absents ;
 * seul text2music via /v1/chat/completions est garanti.
 */

import { buildAceAudioUrlFromPath } from "@/lib/aceChatCompletions";
import type { AceRemixInput } from "@/lib/aceRemix";

export class AceRemixUnavailableError extends Error {
  readonly code = "ACE_REMIX_UNAVAILABLE" as const;

  constructor(message: string) {
    super(message);
    this.name = "AceRemixUnavailableError";
  }
}

export const ACE_REMIX_UNAVAILABLE_COPY = {
  fr: "Le remix avec fichier source n'est pas disponible sur l'API ACE hébergée pour le moment (endpoints upload retirés). Utilise Song ou Beat pour créer une nouvelle piste, ou configure un serveur ACE self-hosted.",
  en: "Source-audio remix isn't available on hosted ACE right now (upload endpoints removed). Use Song or Beat to create a new track, or point ACE_STEP_BASE_URL to a self-hosted ACE server.",
} as const;

export function isAceHtml404(status: number, body: string): boolean {
  return status === 404 || status === 405 || /<title>404 Not Found<\/title>/i.test(body);
}

export function unwrapAcePayload(json: unknown): Record<string, unknown> {
  if (!json || typeof json !== "object") return {};
  const root = json as Record<string, unknown>;
  if (root.data && typeof root.data === "object" && root.data !== null) {
    return root.data as Record<string, unknown>;
  }
  return root;
}

function clampNumber(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function buildRemixFormFields(input: AceRemixInput): {
  taskType: string;
  prompt: string;
  lyrics: string;
  audioFormat: string;
  form: FormData;
} {
  const taskType = input.taskType ?? "cover";
  const coverStrength = clampNumber(input.coverStrength ?? 0.65, 0.15, 1);
  const instrumental = input.instrumental !== false;
  const lyrics = instrumental ? "[Instrumental]" : (input.lyrics ?? "").trim();
  const prompt = input.prompt.trim();
  if (!prompt) throw new Error("Missing remix prompt");

  const audioFormatRaw = (input.audioFormat || "mp3").trim().toLowerCase();
  const audioFormat =
    audioFormatRaw === "wav" || audioFormatRaw === "flac" || audioFormatRaw === "mp3" ? audioFormatRaw : "mp3";

  const form = new FormData();
  form.append("caption", prompt);
  form.append("prompt", prompt);
  form.append("lyrics", lyrics || "[Instrumental]");
  form.append("task_type", taskType);
  form.append("src_audio", input.audioFile, input.audioFile.name || "source.mp3");
  form.append("audio_cover_strength", String(coverStrength));
  form.append("audio_format", audioFormat);
  form.append("thinking", "false");
  form.append("model", "acestep-v15-xl-turbo");
  if (input.durationSec != null && input.durationSec > 0) {
    form.append("duration", String(clampNumber(input.durationSec, 10, 240)));
  }
  if (input.bpm != null && input.bpm > 0) {
    form.append("bpm", String(clampNumber(Math.round(input.bpm), 30, 200)));
  }
  return { taskType, prompt, lyrics, audioFormat, form };
}

export async function submitAceMusicGenerateJob(args: {
  baseUrl: string;
  apiKey: string;
  input: AceRemixInput;
  signal?: AbortSignal;
}): Promise<string> {
  const { form } = buildRemixFormFields(args.input);
  const res = await fetch(`${args.baseUrl.replace(/\/$/, "")}/v1/music/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      Accept: "application/json",
    },
    body: form,
    signal: args.signal,
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    if (isAceHtml404(res.status, text)) {
      throw new AceRemixUnavailableError(`music/generate 404`);
    }
    throw new Error(`ACE music/generate failed (${res.status}): ${text.slice(0, 400)}`);
  }
  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    throw new Error("ACE music/generate returned invalid JSON");
  }
  const data = unwrapAcePayload(json);
  const jobId = typeof data.job_id === "string" ? data.job_id.trim() : "";
  if (!jobId) throw new Error("ACE music/generate did not return job_id");
  return jobId;
}

export async function pollAceMusicJob(args: {
  baseUrl: string;
  apiKey: string;
  jobId: string;
  timeoutMs?: number;
  onProgress?: (elapsedMs: number) => void;
  signal?: AbortSignal;
}): Promise<{ audioPath: string; metas: Record<string, unknown> | null }> {
  const startedAt = Date.now();
  const timeoutMs = args.timeoutMs ?? 150_000;
  const base = args.baseUrl.replace(/\/$/, "");

  while (Date.now() - startedAt < timeoutMs) {
    if (args.signal?.aborted) throw new Error("Aborted");
    args.onProgress?.(Date.now() - startedAt);

    const res = await fetch(`${base}/v1/jobs/${encodeURIComponent(args.jobId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        Accept: "application/json",
      },
      signal: args.signal,
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      if (isAceHtml404(res.status, text)) throw new AceRemixUnavailableError(`jobs 404`);
      throw new Error(`ACE job poll failed (${res.status}): ${text.slice(0, 400)}`);
    }

    let json: unknown;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      throw new Error("ACE job poll returned invalid JSON");
    }
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
      if (!path) throw new Error("remix job succeeded but no audio path");
      const metas =
        result && typeof result.metas === "object" && result.metas !== null
          ? (result.metas as Record<string, unknown>)
          : null;
      return { audioPath: path, metas };
    }
    if (status === "failed") {
      const errMsg = typeof data.error === "string" ? data.error : "remix task failed";
      throw new Error(errMsg);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("remix timed out");
}

export async function runAceRemixViaMusicGenerate(args: {
  baseUrl: string;
  apiKey: string;
  input: AceRemixInput;
  onProgress?: (elapsedMs: number) => void;
  signal?: AbortSignal;
}): Promise<{ audioUrl: string; jobId: string; metas: Record<string, unknown> | null }> {
  const jobId = await submitAceMusicGenerateJob(args);
  const polled = await pollAceMusicJob({ ...args, jobId });
  const audioUrl = buildAceAudioUrlFromPath(args.baseUrl, polled.audioPath);
  if (!audioUrl) throw new Error("remix returned no audio URL");
  return { audioUrl, jobId, metas: polled.metas };
}
