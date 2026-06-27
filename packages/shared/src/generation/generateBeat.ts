import { buildAceRequestBody } from "./aceRequest";
import { estimateSongDurationFromLyrics } from "./aceDuration";
import type { createGenerationJobsClient } from "./jobs";
import { buildSongUiPrompt, resolveSongVocalLanguage } from "../vocalLanguage";
import { isHttpAudioUrl } from "./stems";
import type { AceMeta, GenerateBeatResult, GenerateLoopAceOptions, GenerateParams } from "./types";

export type SonautoFallbackBody = {
  prompt: string;
  tags: string[];
  duration: number;
  bpm: number;
  instrumental: boolean;
  generationKey?: string;
};

export type GenerateTypeBeatAceDeps = {
  jobsClient: ReturnType<typeof createGenerationJobsClient>;
  asyncJobsEnabled: boolean;
  invokeAceSync: (body: Record<string, unknown>) => Promise<{ audioUrl?: string; meta?: AceMeta | null; error?: string; limitReached?: boolean }>;
  invokeSonauto: (body: SonautoFallbackBody) => Promise<{ audioUrl: string }>;
  buildSonautoFallback?: (params: GenerateParams, generationKey?: string) => SonautoFallbackBody;
  aceKeyPreferIndex?: () => number;
};

function isHttpAceUrl(url: unknown): boolean {
  return isHttpAudioUrl(url);
}

function normalizeAceMeta(
  audioUrl: string,
  rawMeta: Record<string, unknown> | null,
): AceMeta | null {
  if (!rawMeta) return null;
  const taskIdFromMeta =
    (typeof rawMeta.taskId === "string" ? rawMeta.taskId : "") ||
    (typeof rawMeta.task_id === "string" ? rawMeta.task_id : "");
  return {
    ...(rawMeta as unknown as AceMeta),
    taskId: taskIdFromMeta ? taskIdFromMeta.trim() : undefined,
    sessionOnly: rawMeta.sessionOnly === true,
    ...(isHttpAceUrl(rawMeta.httpAudioUrl) ? { httpAudioUrl: String(rawMeta.httpAudioUrl).trim() } : {}),
    ...(!rawMeta.httpAudioUrl && isHttpAceUrl(audioUrl) ? { httpAudioUrl: audioUrl.trim() } : {}),
  };
}

function pickPlayableUrl(audioUrl: string, meta: AceMeta | null | undefined): string {
  const httpFromMeta = typeof meta?.httpAudioUrl === "string" ? meta.httpAudioUrl.trim() : "";
  if (isHttpAceUrl(httpFromMeta)) return httpFromMeta;
  if (isHttpAceUrl(audioUrl)) return audioUrl.trim();
  return audioUrl;
}

export type GenerateLoopAceSharedOptions = GenerateLoopAceOptions & {
  onJobStatus?: (status: import("./types").GenerationJobStatus) => void;
};

export async function generateLoopAceShared(
  params: GenerateParams,
  deps: GenerateTypeBeatAceDeps,
  options?: GenerateLoopAceSharedOptions,
): Promise<{ audioUrl: string; meta?: AceMeta | null }> {
  const body = buildAceRequestBody(params, {
    ...options,
    aceKeyPreferIndex: options?.aceKeyPreferIndex ?? deps.aceKeyPreferIndex?.(),
  });

  if (deps.asyncJobsEnabled) {
    const { jobId } = await deps.jobsClient.startGenerationJob(body);
    const jobResult = await deps.jobsClient.waitForGenerationJob(jobId, {
      onStatus: options?.onJobStatus,
    });
    const audioUrl = jobResult.audioUrl;
    const rawMeta = (jobResult.meta ?? null) as Record<string, unknown> | null;
    const metaObj = rawMeta && typeof rawMeta === "object" ? rawMeta : null;
    const normalizedMeta = metaObj ? normalizeAceMeta(audioUrl, metaObj) : null;
    return { audioUrl: pickPlayableUrl(audioUrl, normalizedMeta), meta: normalizedMeta };
  }

  const data = await deps.invokeAceSync(body);
  if (data.error) {
    const e = new Error(data.error) as Error & { limitReached?: boolean };
    if (data.limitReached) e.limitReached = true;
    throw e;
  }
  const audioUrl = data.audioUrl?.trim();
  if (!audioUrl) throw new Error("No audio URL returned");
  const metaObj = data.meta && typeof data.meta === "object" ? (data.meta as Record<string, unknown>) : null;
  const normalizedMeta = metaObj ? normalizeAceMeta(audioUrl, metaObj) : null;
  return { audioUrl: pickPlayableUrl(audioUrl, normalizedMeta), meta: normalizedMeta };
}

export async function generateTypeBeatAce(
  params: GenerateParams,
  deps: GenerateTypeBeatAceDeps,
  options?: GenerateLoopAceSharedOptions,
): Promise<GenerateBeatResult> {
  const instrumental = options?.instrumental ?? true;
  try {
    const result = await generateLoopAceShared(params, deps, { ...options, instrumental });
    return { audioUrl: result.audioUrl, engine: "ace-step", meta: result.meta ?? null };
  } catch (primaryError) {
    if (!instrumental) {
      const primaryMessage = primaryError instanceof Error ? primaryError.message : String(primaryError);
      throw new Error(`Song generation failed: ${primaryMessage}`);
    }
    try {
      const generationKey = options?.generationKey;
      const sonautoBody =
        deps.buildSonautoFallback?.(params, generationKey) ??
        ({
          prompt: params.prompt?.trim() || `${params.genre} instrumental type beat`,
          tags: ["instrumental", "hip-hop/rap", "trap", "melodic"],
          duration: 90,
          bpm: params.bpm,
          instrumental: true,
          ...(generationKey ? { generationKey } : {}),
        } satisfies SonautoFallbackBody);
      const fallback = await deps.invokeSonauto(sonautoBody);
      return { audioUrl: fallback.audioUrl, engine: "sonauto-fallback" };
    } catch {
      const primaryMessage = primaryError instanceof Error ? primaryError.message : String(primaryError);
      throw new Error(primaryMessage || "Generation failed — please try again");
    }
  }
}

export function loopLengthToBars(loopLength: string): number {
  const m = loopLength.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 8;
}

export function defaultBeatName(genre: string, bpm: number): string {
  return `${genre} · ${bpm} BPM`;
}

export function defaultSongName(genre: string): string {
  return `${genre} · Song`;
}

export function toSongGenerateParams(input: {
  genre: string;
  description: string;
  vocalStyle?: string;
  loopLength?: string;
}): GenerateParams {
  const description = input.description.trim();
  const uiPrompt = description
    ? buildSongUiPrompt(input.genre, description, input.vocalStyle)
    : "";
  return {
    genre: input.genre,
    influence: "No Influence",
    key: "",
    scale: "",
    bpm: 0,
    loopLengthBars: loopLengthToBars(input.loopLength ?? "16 bars"),
    swing: 0,
    mood: "",
    energyLevel: "",
    reverb: "Medium",
    prompt: uiPrompt,
  };
}

export function toGenerateParams(input: {
  genre: string;
  bpm: number;
  prompt?: string;
  mood?: string;
  influence?: string;
  key?: string;
  scale?: string;
  loopLength?: string;
  energyLevel?: string;
  reverb?: string;
  swing?: number;
}): GenerateParams {
  return {
    genre: input.genre,
    influence: input.influence ?? "No Influence",
    key: input.key ?? "A",
    scale: input.scale ?? "Minor",
    bpm: input.bpm,
    loopLengthBars: loopLengthToBars(input.loopLength ?? "8 bars"),
    swing: input.swing ?? 0,
    mood: input.mood ?? "Dark",
    energyLevel: input.energyLevel ?? "Medium",
    reverb: input.reverb ?? "Medium",
    prompt: input.prompt ?? "",
  };
}
