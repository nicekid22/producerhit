import { loadBrowserAceApiKeys, pickBrowserAceApiKey, usesDirectAceFromBrowser } from "@/lib/aceBrowserKeys";
import { nextAceKeyPreferIndex } from "@/lib/aceKeyRotation";
import { supabase } from "@/lib/supabaseClient";
import { aceMelodyCompositionAceFields } from "@/lib/aceMelodyComposition";
import { buildAceCaption, buildRichPrompt, buildSonautoTags, type GenerateParams } from "@/lib/promptBuilder";
import {
  buildAceChatCompletionsMessage,
  buildAceChatCompletionsHttpBody,
  buildAceSampleQuery,
  buildAceRequestBody,
  normalizeAceGenerationPayload,
  resolveAceLyricsApiFieldForRequest,
  resolveAceLyricsForMeta,
  resolveAceSampleMode,
  extractLyricsFromAceResponseContent,
} from "@producerhit/shared";
import { appendAceQualityToParamObj, ACE_RELEASE_MODEL, ACE_QUALITY_DEFAULTS, isAceReleaseTaskEnabled, resolveAceQualityFlags } from "@/lib/aceQuality";
import { parseAceChatCompletionsResponse, parseAllAceChatCompletionsAudios } from "@/lib/aceChatCompletions";
import type { AceDualBatchResponse } from "@/lib/aceDualBatch";
import { computeAceRequestedDurationSec, acePollTimeoutMs } from "@/lib/aceDuration";
import { resolveAceAudioUrl } from "@/lib/publicLoops";

export type AceMeta = {
  taskId?: string;
  task_id?: string;
  sessionOnly?: boolean;
  /** Index de rotation clé ACE (load-balancing multi-clés). */
  aceKeyIndex?: number;
  aceKeyCount?: number;
  /** Data URL ACE pour stream communauté (sans bucket Storage). */
  providerDataUrl?: string;
  /** URL HTTP ACE persistable en DB (community / rejouer ~7j) */
  httpAudioUrl?: string;
  prompt?: string;
  lyrics?: string;
  bpm?: number | null;
  duration?: number | null;
  keyScale?: string;
  timeSignature?: string;
  audioFormat?: string;
  seed?: number | null;
  stemsZipUrl?: string;
  /** ACE music/generate + reference_audio — timbre utilisateur appliqué */
  voiceClone?: boolean;
  voiceCloneFallback?: boolean;
  voiceCloneRequested?: boolean;
  voiceProfileId?: string;
  voiceProfileName?: string;
  voiceCloneStrength?: number;
  engine?: string;
};

export type AceFormatResult = {
  caption: string;
  lyrics: string;
  bpm?: number | null;
  duration?: number | null;
  keyScale?: string;
  vocalLanguage?: string;
  timeSignature?: string;
};

function buildAceAudioUrl(baseUrl: string, filePath: string) {
  const t = filePath.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("/v1/audio?path=")) return `${baseUrl}${t}`;
  if (t.startsWith("v1/audio?path=")) return `${baseUrl}/${t}`;
  if (t.startsWith("/")) return `${baseUrl}/v1/audio?path=${t}`;
  return `${baseUrl}/v1/audio?path=${t}`;
}

function normalizeAceBaseUrl(baseUrlRaw: string) {
  const trimmed = baseUrlRaw.trim();
  const noTrailingSlash = trimmed.replace(/\/$/, "");
  try {
    const u = new URL(noTrailingSlash);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    if (host === "acemusic.ai") return "https://api.acemusic.ai";
    if (host === "acem-api.acemusic.ai") return "https://api.acemusic.ai";
    if (path.includes("/api/acem")) return "https://api.acemusic.ai";
  } catch {
    // ignore
  }
  return noTrailingSlash;
}

async function invokeSupabaseFunctionOnce<T>(args: {
  name: string;
  body: unknown;
  accessToken?: string;
  signal?: AbortSignal;
}): Promise<{ data: T | null; errorText: string | null; limitReached?: boolean }> {
  const forcedRegion = import.meta.env.VITE_SUPABASE_FUNCTION_REGION as string | undefined;
  if (!forcedRegion) {
    const { data, error } = await supabase.functions.invoke(args.name, {
      body: args.body,
      headers: args.accessToken ? { Authorization: `Bearer ${args.accessToken}` } : {},
    });
    if (error) {
      const extracted = await extractInvokeError(error);
      return { data: null, errorText: extracted.message, limitReached: extracted.limitReached };
    }
    return { data: (data as T | null) ?? null, errorText: null };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const url = `${supabaseUrl}/functions/v1/${args.name}?forceFunctionRegion=${encodeURIComponent(forcedRegion)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${args.accessToken ?? anonKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(args.body ?? {}),
    signal: args.signal,
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    const statusHint =
      res.status === 504 || res.status === 546
        ? `Edge timeout (${res.status})`
        : `Edge Function error (${res.status})`;
    return { data: null, errorText: text || statusHint };
  }
  try {
    return { data: (JSON.parse(text) as T) ?? null, errorText: null };
  } catch {
    return { data: null, errorText: "Invalid JSON from Edge Function" };
  }
}

/** Pas de timeout client — on laisse l'Edge / ACE finir ; messages user via generationErrors. */
async function invokeSupabaseFunction<T>(args: {
  name: string;
  body: unknown;
  accessToken?: string;
}): Promise<{ data: T | null; errorText: string | null; limitReached?: boolean }> {
  try {
    return await invokeSupabaseFunctionOnce<T>({
      name: args.name,
      body: args.body,
      accessToken: args.accessToken,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, errorText: message };
  }
}

async function extractInvokeError(error: unknown): Promise<{ message: string; limitReached?: boolean }> {
  const anyError = error as unknown as { message?: string; context?: unknown };
  const errContext = anyError.context as unknown;

  const fromParsed = (parsed: unknown) => {
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as { error?: unknown; limitReached?: unknown; message?: unknown };
    const message =
      (typeof obj.error === "string" ? obj.error : null) ||
      (typeof obj.message === "string" ? obj.message : null);
    const limitReached = obj.limitReached === true ? true : undefined;
    return message ? { message, limitReached } : null;
  };

  if (errContext && typeof errContext === "object" && typeof (errContext as Response).text === "function") {
    try {
      const res = errContext as Response;
      const text = await res.text();
      if (text) {
        try {
          const extracted = fromParsed(JSON.parse(text) as unknown);
          if (extracted) return extracted;
        } catch {
          return { message: text.slice(0, 500) };
        }
      }
      if (res.status === 504 || res.status === 546) {
        return { message: `Edge timeout (${res.status})` };
      }
      if (res.status >= 500) {
        return { message: `Erreur serveur Edge (${res.status}). Réessaie dans un instant.` };
      }
    } catch {
      // ignore
    }
  }

  const errBody = (anyError.context as { body?: unknown } | undefined)?.body;
  if (typeof errBody === "string") {
    try {
      const extracted = fromParsed(JSON.parse(errBody) as unknown);
      if (extracted) return extracted;
    } catch {
      if (errBody.trim()) return { message: errBody.slice(0, 500) };
    }
  }

  const extracted = fromParsed(errBody);
  if (extracted) return extracted;

  const fallback = anyError.message ?? "Edge Function error";
  if (fallback.includes("non-2xx")) {
    return { message: "Edge Function non-2xx" };
  }
  return { message: fallback };
}

type GenerateLoopAceOptions = {
  instrumental?: boolean;
  lyrics?: string;
  vocalLanguage?: string;
  autoMeta?: boolean;
  useFormat?: boolean;
  thinking?: boolean;
  duration?: number;
  timeSignature?: string;
  sampleMode?: boolean;
  sampleQuery?: string;
  isSong?: boolean;
  audioFormat?: string;
  seed?: number;
  generationKey?: string;
  /** Index de clé ACE (navigateur : VITE_ACE_STEP_API_KEYS ; Edge : rotation serveur). */
  aceKeyPreferIndex?: number;
  /** Passe par l’Edge Function (release_task serveur) pour une URL HTTP en DB — requis pour is_public. */
  requirePersistableUrl?: boolean;
  /** Prompt ACE complet (ex. Sample Lab) — remplace buildAceCaption. */
  captionOverride?: string;
  /** Composition mélodique sample pack — ne pas préfixer par « beat with drums » (edge + direct ACE). */
  melodyComposition?: boolean;
  /** Profil vocal sauvegardé — ACE reference_audio (timbre clone). */
  voiceProfileId?: string;
  voiceCloneStrength?: number;
  /** Style de livraison vocal (Singer, Rapper, etc.). */
  vocalStyle?: string;
};


function isHttpAceUrl(url: unknown): url is string {
  const s = typeof url === "string" ? url.trim() : "";
  return s.startsWith("http://") || s.startsWith("https://");
}

async function enrichPersistableAceResult(
  audioUrl: string,
  meta: AceMeta | null,
  requirePersistableUrl: boolean,
): Promise<{ audioUrl: string; meta: AceMeta | null }> {
  if (!requirePersistableUrl) return { audioUrl, meta };

  const httpFromMeta = typeof meta?.httpAudioUrl === "string" ? meta.httpAudioUrl.trim() : "";
  const httpFromUrl = isHttpAceUrl(audioUrl) ? audioUrl.trim() : "";
  let http = isHttpAceUrl(httpFromMeta) ? httpFromMeta : httpFromUrl;

  const taskId =
    (typeof meta?.taskId === "string" ? meta.taskId.trim() : "") ||
    (typeof meta?.task_id === "string" ? meta.task_id.trim() : "");

  if (!http && taskId) {
    const resolved = await resolveAceAudioUrl(taskId).catch(() => "");
    if (isHttpAceUrl(resolved)) http = resolved.trim();
  }

  if (http) {
    return {
      audioUrl: http,
      meta: { ...(meta ?? {}), httpAudioUrl: http, sessionOnly: false, ...(taskId ? { taskId } : {}) },
    };
  }

  const dataUrl = typeof audioUrl === "string" && audioUrl.trim().startsWith("data:audio/") ? audioUrl.trim() : "";
  if (dataUrl) {
    return {
      audioUrl: dataUrl,
      meta: { ...(meta ?? {}), providerDataUrl: dataUrl, sessionOnly: false, ...(taskId ? { taskId } : {}) },
    };
  }

  return {
    audioUrl,
    meta: { ...(meta ?? {}), sessionOnly: true, ...(taskId ? { taskId } : {}) },
  };
}

async function bumpAceUsage(generationKey?: string) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    await supabase.functions.invoke("generate-loop-ace", {
      body: {
        action: "bump_usage",
        ...(typeof generationKey === "string" && generationKey.trim() ? { generationKey: generationKey.trim() } : {}),
      },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
  } catch (e) {
    console.warn("bump_usage failed:", e);
  }
}

async function generateLoopAceDirect(
  params: GenerateParams,
  options?: GenerateLoopAceOptions,
): Promise<{ audioUrl: string; meta?: AceMeta | null }> {
  const aceKeys = loadBrowserAceApiKeys();
  const keyCount = aceKeys.length;
  const preferStart =
    typeof options?.aceKeyPreferIndex === "number" && Number.isFinite(options.aceKeyPreferIndex)
      ? Math.abs(Math.floor(options.aceKeyPreferIndex)) % Math.max(keyCount, 1)
      : nextAceKeyPreferIndex() % Math.max(keyCount, 1);
  const baseUrlRaw = (import.meta.env.VITE_ACE_STEP_BASE_URL as string | undefined) ?? "https://api.acemusic.ai";
  const baseUrl = normalizeAceBaseUrl(baseUrlRaw);
  if (!keyCount) throw new Error("Missing VITE_ACE_STEP_API_KEY");
  const aceApiKey = aceKeys[preferStart]!;

  const isSong = options?.isSong ?? !options?.instrumental;
  const promptParams = options?.autoMeta ? { ...params, bpm: 0, key: "", scale: "" } : params;
  const instrumental = options?.instrumental ?? true;
  const vocalLanguage = options?.vocalLanguage ?? "en";
  const captionOverride = options?.captionOverride?.trim() ?? "";
  const lyricsRaw = options?.lyrics ?? "";
  const melodyComposition = options?.melodyComposition === true;
  const aceMode = melodyComposition ? "melody" : instrumental ? "beat" : "song";
  const contractBpm =
    options?.autoMeta || !Number.isFinite(params.bpm) || params.bpm <= 0 ? null : Math.round(params.bpm);
  const normalized = normalizeAceGenerationPayload({
    mode: aceMode,
    caption:
      captionOverride ||
      buildAceCaption(promptParams, { isSong, instrumental, autoMeta: Boolean(options?.autoMeta), vocalLanguage }),
    lyrics: lyricsRaw.trim(),
    instrumental,
    bpm: contractBpm,
    key: params.key,
    scale: params.scale,
    vocalLanguage,
    source: captionOverride ? "manual" : "catalog",
  });
  const baseCaption = normalized.caption;

  const lyrics = normalized.lyrics || (instrumental ? "[Instrumental]" : lyricsRaw.trim());
  const effectiveLyrics = lyrics;
  const userLyricsTrimmed = lyricsRaw.trim();
  const effectiveSampleMode = resolveAceSampleMode({
    captionOverride,
    instrumental,
    melodyComposition,
    explicitSampleMode: options?.sampleMode,
    lyricsTrimmed: userLyricsTrimmed,
  });
  const effectiveSampleQuery = effectiveSampleMode
    ? options?.sampleQuery?.trim() ||
      buildAceSampleQuery({
        genre: params.genre,
        idea: params.prompt,
        vocalStyle: options?.vocalStyle,
      })
    : "";
  const releasePrompt = effectiveSampleMode ? effectiveSampleQuery : baseCaption;
  const quality = resolveAceQualityFlags({
    thinking: options?.thinking,
    useFormat: options?.useFormat,
    sampleMode: effectiveSampleMode,
  });
  const audioFormatRaw = (options?.audioFormat || "").trim().toLowerCase();
  const audioFormat =
    audioFormatRaw === "wav" || audioFormatRaw === "wav32" || audioFormatRaw === "flac" || audioFormatRaw === "mp3" || audioFormatRaw === "aac" || audioFormatRaw === "opus"
      ? audioFormatRaw
      : "mp3";

  const parseChatContent = (
    content: string,
  ): Pick<AceMeta, "prompt" | "lyrics" | "bpm" | "duration" | "keyScale" | "timeSignature"> => {
    const pick = (re: RegExp) => {
      const m = content.match(re);
      return m && typeof m[1] === "string" ? m[1].trim() : "";
    };
    const caption = pick(/\*\*Caption:\*\*\s*([^\n]+)/i);
    const bpmStr = pick(/\*\*BPM:\*\*\s*([0-9]{2,3})/i);
    const durationStr = pick(/\*\*Duration:\*\*\s*([0-9]{1,3})/i);
    const keyScaleMatch = content.match(/\*\*(?:Key|Key Scale|KeyScale):\*\*\s*([^\n]+)/i) ?? content.match(/\*\*Key:\*\*\s*([^\n]+)/i);
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
  };

  const durationRaw =
    typeof options?.duration === "number" && Number.isFinite(options.duration) && options.duration > 0
      ? options.duration
      : null;
  const requestedDuration = computeAceRequestedDurationSec({ instrumental, durationRaw });

  const generateViaChatCompletions = async (): Promise<{ audioUrl: string; meta: AceMeta | null }> => {
    const messageContent = buildAceChatCompletionsMessage({
      seedKey: String(preferStart),
      baseCaption,
      prompt: params.prompt || "",
      lyrics: userLyricsTrimmed,
      instrumental,
      melodyComposition,
      genre: params.genre || "",
      mood: params.mood || "",
      energyLevel: params.energyLevel || "",
      autoMeta: Boolean(options?.autoMeta),
      bpm: !options?.autoMeta && params.bpm > 0 ? params.bpm : null,
      key: params.key || "",
      scale: params.scale || "",
      timeSignature: options?.timeSignature || "",
      vocalLanguage,
      vocalStyle: options?.vocalStyle?.trim() || undefined,
      sampleMode: effectiveSampleMode,
      sampleQuery: effectiveSampleQuery,
      captionOverride,
    });

    const lyricsField = resolveAceLyricsApiFieldForRequest({
      instrumental,
      lyricsTrimmed: userLyricsTrimmed,
      sampleMode: effectiveSampleMode,
    });

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aceApiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(
        buildAceChatCompletionsHttpBody({
          model: ACE_RELEASE_MODEL,
          thinking: quality.thinking,
          useFormat: quality.useFormat,
          sampleMode: effectiveSampleMode,
          sampleQuery: effectiveSampleQuery,
          messageContent,
          lyricsField,
          audioConfig: {
            instrumental,
            ...(requestedDuration != null ? { duration: requestedDuration } : {}),
            bpm: !options?.autoMeta && params.bpm > 0 ? params.bpm : null,
            key_scale: !options?.autoMeta && params.key && params.scale ? `${params.key} ${params.scale}` : null,
            time_signature: options?.timeSignature || null,
            vocal_language: vocalLanguage,
            format: audioFormat,
            audio_format: audioFormat,
            shift: ACE_QUALITY_DEFAULTS.shift,
            inference_steps: ACE_QUALITY_DEFAULTS.inferenceSteps,
          },
          extraFields: melodyComposition ? aceMelodyCompositionAceFields() : undefined,
        }),
      ),
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) throw new Error(`ACE API chat/completions failed (${res.status}): ${text}`);

    const json = JSON.parse(text) as unknown;
    const parsedAudio = parseAceChatCompletionsResponse(json, baseUrl);
    if (!parsedAudio.audioUrl) throw new Error("ACE API returned no audio");

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
    const parsed = content ? parseChatContent(content) : {};
    const fallbackBpm = !options?.autoMeta && params.bpm > 0 ? params.bpm : null;
    const fallbackKeyScale = !options?.autoMeta && params.key && params.scale ? `${params.key} ${params.scale}` : "";
    const metaCaption = effectiveSampleMode ? effectiveSampleQuery : baseCaption;
    const meta: AceMeta = {
      prompt: parsed.prompt || metaCaption,
      lyrics: instrumental ? "" : resolveAceLyricsForMeta({
        parsedLyrics: parsed.lyrics,
        userLyrics: userLyricsTrimmed,
        caption: metaCaption,
      }) || undefined,
      bpm: (parsed.bpm && parsed.bpm > 0 ? parsed.bpm : fallbackBpm) ?? null,
      duration: (parsed.duration && parsed.duration > 0 ? parsed.duration : requestedDuration) ?? null,
      keyScale: (parsed.keyScale || fallbackKeyScale || undefined) ?? undefined,
      timeSignature: (parsed.timeSignature || options?.timeSignature || undefined) ?? undefined,
      audioFormat,
      aceKeyIndex: preferStart,
      aceKeyCount: keyCount,
      ...(parsedAudio.taskId ? { taskId: parsedAudio.taskId } : {}),
      ...(parsedAudio.httpAudioUrl ? { httpAudioUrl: parsedAudio.httpAudioUrl } : {}),
      sessionOnly: parsedAudio.sessionOnly && !parsedAudio.httpAudioUrl,
    };
    return { audioUrl: parsedAudio.httpAudioUrl || parsedAudio.audioUrl, meta };
  };

  const clampNumber = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  const paramObj: Record<string, unknown> = {};
  if (requestedDuration != null) paramObj.duration = requestedDuration;
  if (!options?.autoMeta && params.bpm > 0) paramObj.bpm = params.bpm;
  if (!options?.autoMeta && params.key && params.scale) paramObj.key = `${params.key} ${params.scale}`;
  if (options?.timeSignature) paramObj.time_signature = options.timeSignature;
  if (audioFormat) paramObj.audio_format = audioFormat;
  if (typeof options?.seed === "number" && Number.isFinite(options.seed)) paramObj.seed = options.seed;
  appendAceQualityToParamObj(paramObj);

  if (!isAceReleaseTaskEnabled()) {
    const out = await generateViaChatCompletions();
    await bumpAceUsage(options?.generationKey);
    return out;
  }

  const createForm = new FormData();
  createForm.append("env", "production");
  createForm.append("ai_token", aceApiKey);
  createForm.append("prompt", releasePrompt);
  const releaseLyricsField = resolveAceLyricsApiFieldForRequest({
    instrumental,
    lyricsTrimmed: userLyricsTrimmed,
    sampleMode: effectiveSampleMode,
  });
  if (releaseLyricsField !== undefined) createForm.append("lyrics", releaseLyricsField);
  createForm.append("model_name", ACE_RELEASE_MODEL);
  createForm.append("app", "studio-web");
  createForm.append("thinking", quality.thinking ? "true" : "false");
  createForm.append("use_format", quality.useFormat ? "true" : "false");
  if (effectiveSampleMode) {
    createForm.append("sample_mode", "true");
    const sq = effectiveSampleQuery.trim();
    if (sq) createForm.append("sample_query", sq);
  }
  createForm.append("vocal_language", vocalLanguage);
  createForm.append("param_obj", JSON.stringify(paramObj));

  const createRes = await fetch(`${baseUrl}/release_task`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: createForm,
  });
  const createText = await createRes.text().catch(() => "");
  if (!createRes.ok) {
    if (createRes.status === 404) {
      const out = await generateViaChatCompletions();
      await bumpAceUsage(options?.generationKey);
      return { audioUrl: out.audioUrl, meta: out.meta };
    }
    throw new Error(`ACE API release_task failed (${createRes.status}): ${createText}`);
  }
  const createJson = JSON.parse(createText) as unknown;
  const taskId =
    (createJson as { data?: unknown } | null)?.data && typeof (createJson as { data?: unknown }).data === "object"
      ? String(((createJson as { data: { task_id?: unknown } }).data.task_id as unknown) ?? "")
      : "";
  if (!taskId) throw new Error("ACE API did not return a task_id");

  const startedAt = Date.now();
  const pollTimeoutMs = acePollTimeoutMs({ instrumental, isSong, lyrics: effectiveLyrics });
  let audioUrl = "";
  let meta: AceMeta | null = null;
  for (;;) {
    if (pollTimeoutMs != null && Date.now() - startedAt >= pollTimeoutMs) break;
    const pollParams = new URLSearchParams();
    pollParams.append("ai_token", aceApiKey);
    pollParams.append("task_id_list", JSON.stringify([taskId]));
    pollParams.append("app", "studio-web");
    const pollRes = await fetch(`${baseUrl}/query_result`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: pollParams,
    });
    const pollText = await pollRes.text().catch(() => "");
    if (!pollRes.ok) throw new Error(`ACE API query_result failed (${pollRes.status}): ${pollText}`);

    const pollJson = JSON.parse(pollText) as unknown;
    const item = Array.isArray((pollJson as { data?: unknown } | null)?.data) ? (pollJson as { data: unknown[] }).data[0] : null;
    const statusNum = item && typeof (item as { status?: unknown }).status === "number" ? ((item as { status: number }).status as number) : 0;
    if (statusNum === 1) {
      const resultStr = typeof (item as { result?: unknown } | null)?.result === "string" ? ((item as { result: string }).result as string) : "";
      const results = JSON.parse(resultStr) as unknown;
      const first = Array.isArray(results) ? results[0] : null;
      const firstObj = first && typeof first === "object" && first !== null ? (first as Record<string, unknown>) : null;
      const file = first && typeof (first as { file?: unknown }).file === "string" ? ((first as { file: string }).file as string) : "";
      audioUrl = buildAceAudioUrl(baseUrl, file);
      const metasObj = firstObj && typeof firstObj.metas === "object" && firstObj.metas !== null ? (firstObj.metas as Record<string, unknown>) : null;
      const bpm = metasObj && typeof metasObj.bpm === "number" ? (metasObj.bpm as number) : null;
      const duration = metasObj && typeof metasObj.duration === "number" ? (metasObj.duration as number) : null;
      const seed =
        metasObj && typeof metasObj.seed === "number"
          ? (metasObj.seed as number)
          : metasObj && typeof metasObj.random_seed === "number"
            ? (metasObj.random_seed as number)
            : null;
      const keyScale =
        metasObj && typeof metasObj.keyscale === "string"
          ? (metasObj.keyscale as string)
          : metasObj && typeof metasObj.key_scale === "string"
            ? (metasObj.key_scale as string)
            : null;
      const timeSignature =
        metasObj && typeof metasObj.timesignature === "string"
          ? (metasObj.timesignature as string)
          : metasObj && typeof metasObj.time_signature === "string"
            ? (metasObj.time_signature as string)
            : null;
      const lyricsFromResult = firstObj && typeof firstObj.lyrics === "string" ? (firstObj.lyrics as string) : "";
      meta = {
        taskId,
        prompt: baseCaption,
        lyrics: resolveAceLyricsForMeta({
          parsedLyrics: lyricsFromResult,
          userLyrics: userLyricsTrimmed,
          caption: baseCaption,
        }) || undefined,
        bpm: bpm && isFinite(bpm) ? bpm : null,
        duration: duration && isFinite(duration) ? duration : null,
        keyScale: keyScale || undefined,
        timeSignature: timeSignature || undefined,
        audioFormat,
        seed: typeof seed === "number" && isFinite(seed) ? seed : null,
        httpAudioUrl: audioUrl.startsWith("http") ? audioUrl : undefined,
      };
      break;
    }
    if (statusNum === 2) throw new Error("ACE task failed");
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (!audioUrl) throw new Error("ACE generation timed out");

  await bumpAceUsage(options?.generationKey);
  return { audioUrl, meta };
}

export async function generateLoop(params: GenerateParams, isSong?: boolean, generationKey?: string): Promise<string> {
  const prompt = buildRichPrompt(params, isSong);
  const tags = buildSonautoTags(params);
  const duration = 90;
  const instrumental = true;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const body = {
    prompt,
    tags,
    duration,
    bpm: params.bpm,
    instrumental,
    ...(typeof generationKey === "string" && generationKey.trim().length > 0 ? { generationKey: generationKey.trim() } : {}),
  };

  const { data, errorText } = await invokeSupabaseFunction<{ audioUrl?: string; error?: string; limitReached?: boolean }>(
    {
      name: "generate-loop",
      body,
      accessToken: session?.access_token,
    },
  );
  if (errorText) throw new Error(errorText);

  if ((data as { error?: string; limitReached?: boolean } | null)?.error) {
    const d = data as { error: string; limitReached?: boolean };
    const e = new Error(d.error) as Error & { limitReached?: boolean };
    e.limitReached = d.limitReached;
    throw e;
  }
  const audioUrl = (data as { audioUrl?: string } | null)?.audioUrl;
  if (!audioUrl) throw new Error("No audio URL returned");
  return audioUrl;
}

export async function formatAceInput(input: {
  caption: string;
  lyrics?: string;
  bpm?: number;
  keyScale?: string;
  duration?: number;
  vocalLanguage?: string;
  timeSignature?: string;
}): Promise<AceFormatResult> {
  // /format_input does not exist on api.acemusic.ai
  // Return caption as-is — ACEMusic will auto-generate lyrics during generation
  return {
    caption: input.caption,
    lyrics: input.lyrics ?? "",
    bpm: input.bpm ?? null,
    duration: input.duration ?? null,
    keyScale: input.keyScale ?? "",
    vocalLanguage: input.vocalLanguage ?? "en",
    timeSignature: input.timeSignature ?? "",
  };
}

export async function generateLoopAce(
  params: GenerateParams,
  options?: GenerateLoopAceOptions,
): Promise<{ audioUrl: string; meta?: AceMeta | null }> {
  if (usesDirectAceFromBrowser()) return await generateLoopAceDirect(params, options);

  const captionOverride = options?.captionOverride?.trim() ?? "";
  const promptParams = options?.autoMeta ? { ...params, bpm: 0, key: "", scale: "" } : params;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const body = buildAceRequestBody(promptParams, {
    ...options,
    aceKeyPreferIndex:
      typeof options?.aceKeyPreferIndex === "number" && Number.isFinite(options.aceKeyPreferIndex)
        ? Math.abs(Math.floor(options.aceKeyPreferIndex))
        : nextAceKeyPreferIndex(),
  });
  if (options?.melodyComposition === true) {
    body.melodyComposition = true;
    Object.assign(body, aceMelodyCompositionAceFields());
  }

  const { asyncGenerationJobsEnabled, startGenerationJob, waitForGenerationJob } = await import(
    "@/lib/generationJobs"
  );
  if (asyncGenerationJobsEnabled() && session?.access_token) {
    const { jobId } = await startGenerationJob(body);
    const jobResult = await waitForGenerationJob(jobId);
    const audioUrl = jobResult.audioUrl;
    const rawMeta = (jobResult.meta ?? null) as Record<string, unknown> | null;
    const metaObj = rawMeta && typeof rawMeta === "object" ? rawMeta : null;
    const taskIdFromMeta =
      (typeof metaObj?.taskId === "string" ? metaObj.taskId : "") ||
      (typeof metaObj?.task_id === "string" ? metaObj.task_id : "");
    let normalizedMeta: AceMeta | null = metaObj
      ? ({
          ...(metaObj as unknown as AceMeta),
          taskId: taskIdFromMeta ? taskIdFromMeta.trim() : undefined,
          sessionOnly: metaObj.sessionOnly === true,
          ...(isHttpAceUrl(metaObj.httpAudioUrl) ? { httpAudioUrl: String(metaObj.httpAudioUrl).trim() } : {}),
          ...(!metaObj.httpAudioUrl && isHttpAceUrl(audioUrl) ? { httpAudioUrl: audioUrl.trim() } : {}),
        } as AceMeta)
      : null;
    if (options?.requirePersistableUrl) {
      return enrichPersistableAceResult(audioUrl, normalizedMeta, true);
    }
    return { audioUrl, meta: normalizedMeta };
  }

  const { data, errorText, limitReached } = await invokeSupabaseFunction<{
    audioUrl?: string;
    meta?: AceMeta | null;
    error?: string;
    limitReached?: boolean;
  }>({
    name: "generate-loop-ace",
    body,
    accessToken: session?.access_token,
  });
  if (errorText) {
    const e = new Error(errorText) as Error & { limitReached?: boolean };
    if (limitReached) e.limitReached = true;
    throw e;
  }

  if ((data as { error?: string; limitReached?: boolean } | null)?.error) {
    const d = data as { error: string; limitReached?: boolean };
    const e = new Error(d.error) as Error & { limitReached?: boolean };
    e.limitReached = d.limitReached;
    throw e;
  }

  const audioUrl = (data as { audioUrl?: string } | null)?.audioUrl;
  if (!audioUrl) throw new Error("No audio URL returned");
  const rawMeta = ((data as { meta?: unknown } | null)?.meta ?? null) as unknown;
  const metaObj = rawMeta && typeof rawMeta === "object" ? (rawMeta as Record<string, unknown>) : null;
  const taskIdFromMeta =
    (typeof metaObj?.taskId === "string" ? metaObj.taskId : "") ||
    (typeof metaObj?.task_id === "string" ? metaObj.task_id : "");
  let normalizedMeta: AceMeta | null =
    metaObj
      ? ({
          ...(metaObj as unknown as AceMeta),
          taskId: taskIdFromMeta ? taskIdFromMeta.trim() : undefined,
          sessionOnly: metaObj.sessionOnly === true,
          ...(isHttpAceUrl(metaObj.httpAudioUrl) ? { httpAudioUrl: String(metaObj.httpAudioUrl).trim() } : {}),
          ...(!metaObj.httpAudioUrl && isHttpAceUrl(audioUrl) ? { httpAudioUrl: audioUrl.trim() } : {}),
        } as AceMeta)
      : null;
  if (options?.requirePersistableUrl) {
    return enrichPersistableAceResult(audioUrl, normalizedMeta, true);
  }
  return {
    audioUrl,
    meta: normalizedMeta,
  };
}

export type GenerateLoopAceDualBatchOptions = GenerateLoopAceOptions & {
  dualSeeds: [number, number];
  generationKeys: [string, string];
};

function metaFromAceChatJson(
  json: unknown,
  parsed: { audioUrl: string; httpAudioUrl: string | null; taskId: string | null; sessionOnly: boolean },
  ctx: {
    baseCaption: string;
    effectiveLyrics: string;
    userLyrics: string;
    instrumental: boolean;
    audioFormat: string;
    requestedDuration: number | null;
    fallbackBpm: number | null;
    fallbackKeyScale: string;
    timeSignature?: string;
    aceKeyIndex?: number;
    aceKeyCount?: number;
    seed?: number;
  },
): AceMeta {
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
  type ParsedChatMeta = {
    prompt?: string;
    lyrics?: string;
    bpm?: number | null;
    duration?: number | null;
    keyScale?: string;
    timeSignature?: string;
  };
  const parsedContent: ParsedChatMeta = content
    ? (() => {
        const pick = (re: RegExp) => {
          const m = content.match(re);
          return m && typeof m[1] === "string" ? m[1].trim() : "";
        };
        const bpmStr = pick(/\*\*BPM:\*\*\s*([0-9]{2,3})/i);
        const durationStr = pick(/\*\*Duration:\*\*\s*([0-9]{1,3})/i);
        const keyScaleMatch =
          content.match(/\*\*(?:Key|Key Scale|KeyScale):\*\*\s*([^\n]+)/i) ?? content.match(/\*\*Key:\*\*\s*([^\n]+)/i);
        return {
          prompt: pick(/\*\*Caption:\*\*\s*([^\n]+)/i) || undefined,
          lyrics: extractLyricsFromAceResponseContent(content) || undefined,
          bpm: bpmStr ? Number(bpmStr) : null,
          duration: durationStr ? Number(durationStr) : null,
          keyScale: keyScaleMatch?.[1]?.trim() || undefined,
          timeSignature:
            content.match(/\*\*(?:Time Signature|TimeSignature):\*\*\s*([^\n]+)/i)?.[1]?.trim() || undefined,
        };
      })()
    : {};

  return {
    prompt: parsedContent.prompt || ctx.baseCaption,
    lyrics: ctx.instrumental
      ? ""
      : resolveAceLyricsForMeta({
          parsedLyrics: parsedContent.lyrics,
          userLyrics: ctx.userLyrics,
          caption: ctx.baseCaption,
        }) || undefined,
    bpm: (parsedContent.bpm && parsedContent.bpm > 0 ? parsedContent.bpm : ctx.fallbackBpm) ?? null,
    duration: (parsedContent.duration && parsedContent.duration > 0 ? parsedContent.duration : ctx.requestedDuration) ?? null,
    keyScale: parsedContent.keyScale || ctx.fallbackKeyScale || undefined,
    timeSignature: parsedContent.timeSignature || ctx.timeSignature || undefined,
    audioFormat: ctx.audioFormat,
    seed: ctx.seed ?? null,
    aceKeyIndex: ctx.aceKeyIndex,
    aceKeyCount: ctx.aceKeyCount,
    ...(parsed.taskId ? { taskId: parsed.taskId } : {}),
    ...(parsed.httpAudioUrl ? { httpAudioUrl: parsed.httpAudioUrl } : {}),
    sessionOnly: parsed.sessionOnly && !parsed.httpAudioUrl,
  };
}

/** Un seul POST /v1/chat/completions avec batch_size=2 (2 seeds). */
export async function generateLoopAceDualBatch(
  params: GenerateParams,
  options: GenerateLoopAceDualBatchOptions,
): Promise<AceDualBatchResponse> {
  const [seed1, seed2] = options.dualSeeds;
  const seeds: [number, number] = [seed1, seed2];

  if (usesDirectAceFromBrowser()) {
    const aceKeys = loadBrowserAceApiKeys();
    const keyCount = aceKeys.length;
    const preferStart =
      typeof options.aceKeyPreferIndex === "number" && Number.isFinite(options.aceKeyPreferIndex)
        ? Math.abs(Math.floor(options.aceKeyPreferIndex)) % Math.max(keyCount, 1)
        : nextAceKeyPreferIndex() % Math.max(keyCount, 1);
    const baseUrl = normalizeAceBaseUrl(
      (import.meta.env.VITE_ACE_STEP_BASE_URL as string | undefined) ?? "https://api.acemusic.ai",
    );
    const aceApiKey = aceKeys[preferStart]!;
    if (!keyCount) throw new Error("Missing VITE_ACE_STEP_API_KEY");

    const isSong = options?.isSong ?? !options?.instrumental;
    const promptParams = options?.autoMeta ? { ...params, bpm: 0, key: "", scale: "" } : params;
    const instrumental = options?.instrumental ?? true;
    const vocalLanguage = options?.vocalLanguage ?? "en";
    const captionOverride = options?.captionOverride?.trim() ?? "";
    const lyricsRaw = options?.lyrics ?? "";
    const melodyComposition = options?.melodyComposition === true;
    const contractBpm =
      options?.autoMeta || !Number.isFinite(params.bpm) || params.bpm <= 0 ? null : Math.round(params.bpm);
    const normalized = normalizeAceGenerationPayload({
      mode: melodyComposition ? "melody" : instrumental ? "beat" : "song",
      caption:
        captionOverride ||
        buildAceCaption(promptParams, {
          isSong,
          instrumental,
          autoMeta: Boolean(options?.autoMeta),
          vocalLanguage,
        }),
      lyrics: lyricsRaw.trim(),
      instrumental,
      bpm: contractBpm,
      key: params.key,
      scale: params.scale,
      vocalLanguage,
      source: captionOverride ? "manual" : "catalog",
    });
    const baseCaption = normalized.caption;
    const effectiveLyrics = normalized.lyrics || (instrumental ? "[Instrumental]" : lyricsRaw.trim());
    const batchUserLyrics = lyricsRaw.trim();
    const effectiveSampleMode = resolveAceSampleMode({
      captionOverride,
      instrumental,
      melodyComposition,
      explicitSampleMode: options?.sampleMode,
      lyricsTrimmed: batchUserLyrics,
    });
    const effectiveSampleQuery = effectiveSampleMode
      ? options?.sampleQuery?.trim() ||
        buildAceSampleQuery({
          genre: params.genre,
          idea: params.prompt,
          vocalStyle: options?.vocalStyle,
        })
      : "";
    const quality = resolveAceQualityFlags({
      thinking: options?.thinking,
      useFormat: options?.useFormat,
      sampleMode: effectiveSampleMode,
    });
    const audioFormatRaw = (options?.audioFormat || "").trim().toLowerCase();
    const audioFormat =
      audioFormatRaw === "wav" ||
      audioFormatRaw === "wav32" ||
      audioFormatRaw === "flac" ||
      audioFormatRaw === "mp3" ||
      audioFormatRaw === "aac" ||
      audioFormatRaw === "opus"
        ? audioFormatRaw
        : "mp3";

    const clampNumber = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
    const durationRaw =
      typeof options?.duration === "number" && Number.isFinite(options.duration) && options.duration > 0
        ? options.duration
        : null;
    const requestedDuration = computeAceRequestedDurationSec({ instrumental, durationRaw });

    const messageContent = buildAceChatCompletionsMessage({
      seedKey: String(preferStart),
      baseCaption,
      prompt: params.prompt || "",
      lyrics: batchUserLyrics,
      instrumental,
      genre: params.genre || "",
      mood: params.mood || "",
      energyLevel: params.energyLevel || "",
      autoMeta: Boolean(options?.autoMeta),
      bpm: !options?.autoMeta && params.bpm > 0 ? params.bpm : null,
      key: params.key || "",
      scale: params.scale || "",
      timeSignature: options?.timeSignature || "",
      vocalLanguage,
      vocalStyle: options?.vocalStyle?.trim() || undefined,
      sampleMode: effectiveSampleMode,
      sampleQuery: effectiveSampleQuery,
      captionOverride,
    });

    const batchLyricsField = resolveAceLyricsApiFieldForRequest({
      instrumental,
      lyricsTrimmed: batchUserLyrics,
      sampleMode: effectiveSampleMode,
    });

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aceApiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(
        buildAceChatCompletionsHttpBody({
          model: ACE_RELEASE_MODEL,
          thinking: quality.thinking,
          useFormat: quality.useFormat,
          sampleMode: effectiveSampleMode,
          sampleQuery: effectiveSampleQuery,
          messageContent,
          lyricsField: batchLyricsField,
          batchSize: 2,
          audioConfig: {
            instrumental,
            ...(requestedDuration != null ? { duration: requestedDuration } : {}),
            bpm: !options?.autoMeta && params.bpm > 0 ? params.bpm : null,
            key_scale: !options?.autoMeta && params.key && params.scale ? `${params.key} ${params.scale}` : null,
            time_signature: options?.timeSignature || null,
            vocal_language: vocalLanguage,
            format: audioFormat,
            audio_format: audioFormat,
            shift: ACE_QUALITY_DEFAULTS.shift,
            inference_steps: ACE_QUALITY_DEFAULTS.inferenceSteps,
            seed: seeds[0],
            seeds,
          },
        }),
      ),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) throw new Error(`ACE API dual batch failed (${res.status}): ${text.slice(0, 400)}`);

    const json = JSON.parse(text) as unknown;
    const audios = parseAllAceChatCompletionsAudios(json, baseUrl);
    if (!audios.length) throw new Error("ACE dual batch returned no audio");

    const metaCtx = {
      baseCaption,
      effectiveLyrics,
      userLyrics: batchUserLyrics,
      instrumental,
      audioFormat,
      requestedDuration,
      fallbackBpm: !options?.autoMeta && params.bpm > 0 ? params.bpm : null,
      fallbackKeyScale: !options?.autoMeta && params.key && params.scale ? `${params.key} ${params.scale}` : "",
      timeSignature: options?.timeSignature,
      aceKeyIndex: preferStart,
      aceKeyCount: keyCount,
    };

    const results = audios.slice(0, 2).map((parsed, i) => ({
      audioUrl: parsed.httpAudioUrl || parsed.audioUrl,
      meta: metaFromAceChatJson(json, parsed, { ...metaCtx, seed: seeds[i] }),
      seed: seeds[i],
    }));

    for (const gk of options.generationKeys) {
      await bumpAceUsage(gk);
    }

    return { results, partial: results.length < 2 };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const instrumental = options?.instrumental ?? true;
  const lyricsRaw = options?.lyrics ?? "";
  const vocalLanguage = options?.vocalLanguage ?? "en";
  const isSong = options?.isSong ?? !instrumental;
  const aceBody = buildAceRequestBody(params, {
    ...options,
    isSong,
    instrumental,
    lyrics: lyricsRaw,
    vocalLanguage,
  });
  const effectiveSampleMode = Boolean(aceBody.sampleMode);
  const caption = effectiveSampleMode ? "" : String(aceBody.caption ?? "");
  const lyrics = String(aceBody.lyrics ?? (instrumental ? "[Instrumental]" : lyricsRaw));
  const effectiveSampleQuery = effectiveSampleMode
    ? (options?.sampleQuery?.trim() || String(aceBody.caption ?? ""))
    : options?.sampleQuery?.trim() || "";
  const audioFormatRaw = (options?.audioFormat || "").trim().toLowerCase();
  const audioFormat =
    audioFormatRaw === "wav" ||
    audioFormatRaw === "wav32" ||
    audioFormatRaw === "flac" ||
    audioFormatRaw === "mp3" ||
    audioFormatRaw === "aac" ||
    audioFormatRaw === "opus"
      ? audioFormatRaw
      : "mp3";

  const clampNumber = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
  const bars =
    typeof params.loopLengthBars === "number" && Number.isFinite(params.loopLengthBars) && params.loopLengthBars > 0
      ? params.loopLengthBars
      : 8;
  const durationRaw = typeof options?.duration === "number" && Number.isFinite(options.duration) && options.duration > 0 ? options.duration : null;
  const desiredDurationSec = computeAceRequestedDurationSec({ instrumental, durationRaw });

  const quality = resolveAceQualityFlags({
    thinking: options?.thinking,
    useFormat: options?.useFormat,
    sampleMode: effectiveSampleMode,
  });

  const body: Record<string, unknown> = {
    dualBatch: true,
    dualSeeds: seeds,
    generationKeys: options.generationKeys,
    caption,
    lyrics,
    instrumental,
    vocalLanguage,
    useFormat: quality.useFormat,
    thinking: quality.thinking,
    sampleMode: effectiveSampleMode,
    audioFormat,
    loopLengthBars: bars,
  };
  if (desiredDurationSec != null) body.duration = desiredDurationSec;
  if (!options?.autoMeta && params.bpm > 0) body.bpm = params.bpm;
  if (!options?.autoMeta && params.key && params.scale) body.keyScale = `${params.key} ${params.scale}`;
  if (options?.timeSignature) body.timeSignature = options.timeSignature;
  if (params.genre) body.genre = params.genre;
  if (params.mood) body.mood = params.mood;
  if (params.energyLevel) body.energyLevel = params.energyLevel;
  if (options?.autoMeta) body.autoMeta = true;
  body.isSong = isSong;
  if (effectiveSampleQuery) body.sampleQuery = effectiveSampleQuery;
  body.aceKeyPreferIndex =
    typeof options?.aceKeyPreferIndex === "number" && Number.isFinite(options.aceKeyPreferIndex)
      ? Math.abs(Math.floor(options.aceKeyPreferIndex))
      : nextAceKeyPreferIndex();

  const { data, errorText, limitReached } = await invokeSupabaseFunction<{
    results?: Array<{ audioUrl?: string; meta?: AceMeta | null; seed?: number }>;
    partial?: boolean;
    error?: string;
    limitReached?: boolean;
  }>({
    name: "generate-loop-ace",
    body,
    accessToken: session?.access_token,
  });

  if (errorText) {
    const e = new Error(errorText) as Error & { limitReached?: boolean };
    if (limitReached) e.limitReached = true;
    throw e;
  }
  if ((data as { error?: string } | null)?.error) {
    const d = data as { error: string; limitReached?: boolean };
    const e = new Error(d.error) as Error & { limitReached?: boolean };
    e.limitReached = d.limitReached;
    throw e;
  }

  const rows = Array.isArray(data?.results) ? data.results : [];
  const results = rows
    .filter((r) => typeof r?.audioUrl === "string" && r.audioUrl.trim().length > 0)
    .slice(0, 2)
    .map((r, i) => ({
      audioUrl: r.audioUrl!.trim(),
      meta: (r.meta as AceMeta | null) ?? null,
      seed: typeof r.seed === "number" ? r.seed : seeds[i],
    }));

  if (!results.length) throw new Error("ACE dual batch returned no audio");
  return { results, partial: results.length < 2 || Boolean(data?.partial) };
}

export async function generateBeatDualBatch(
  params: GenerateParams,
  engine: "sonauto" | "ace-step",
  options: GenerateLoopAceDualBatchOptions,
): Promise<Array<{ audioUrl: string; engine: string; meta?: AceMeta | null; seed?: number }>> {
  if (engine !== "ace-step") throw new Error("Dual batch only supported for ace-step");
  const batch = await generateLoopAceDualBatch(params, options);
  return batch.results.map((r) => ({
    audioUrl: r.audioUrl,
    engine: "ace-step-dual-batch",
    meta: r.meta,
    seed: r.seed,
  }));
}

export async function generateBeat(
  params: GenerateParams,
  engine: "sonauto" | "ace-step" = "ace-step",
  options?: {
    instrumental?: boolean;
    lyrics?: string;
    vocalLanguage?: string;
    autoMeta?: boolean;
    useFormat?: boolean;
    thinking?: boolean;
    duration?: number;
    timeSignature?: string;
    sampleMode?: boolean;
    sampleQuery?: string;
    isSong?: boolean;
    audioFormat?: string;
    seed?: number;
    generationKey?: string;
    aceKeyPreferIndex?: number;
  },
): Promise<{ audioUrl: string; engine: string; meta?: AceMeta | null }> {
  try {
    if (engine === "ace-step") {
      const result = await generateLoopAce(params, options);
      return { audioUrl: result.audioUrl, engine: "ace-step", meta: result.meta ?? null };
    }
    const url = await generateLoop(params, options?.isSong, options?.generationKey);
    return { audioUrl: url, engine: "sonauto" };
  } catch (primaryError) {
    if (engine === "ace-step" && options?.instrumental === false) {
      const primaryMessage = primaryError instanceof Error ? primaryError.message : String(primaryError);
      throw new Error(`Song generation failed: ${primaryMessage}`);
    }
    try {
      if (engine === "ace-step") {
        const url = await generateLoop(params, options?.isSong, options?.generationKey);
        return { audioUrl: url, engine: "sonauto-fallback" };
      }
      const result = await generateLoopAce(params, options);
      return { audioUrl: result.audioUrl, engine: "ace-step-fallback", meta: result.meta ?? null };
    } catch (fallbackError) {
      const primaryMessage = primaryError instanceof Error ? primaryError.message : String(primaryError);
      console.warn("Emergency fallback failed", { primaryError, fallbackError });
      throw new Error(primaryMessage || "Generation failed — please try again");
    }
  }
}

export async function remixLoopAce(input: import("@/lib/aceRemix").AceRemixInput): Promise<{ audioUrl: string; meta?: AceMeta | null }> {
  const { runAceRemix, normalizeAceBaseUrl: normalizeRemixBase, validateRemixFile } = await import("@/lib/aceRemix");
  const fileErr = validateRemixFile(input.audioFile);
  if (fileErr === "file_too_large") throw new Error("Fichier trop lourd (max 12 Mo) / File too large (max 12 MB)");
  if (fileErr) throw new Error("Fichier audio invalide / Invalid audio file");

  if (usesDirectAceFromBrowser()) {
    const baseUrl = normalizeRemixBase((import.meta.env.VITE_ACE_STEP_BASE_URL as string | undefined) ?? "https://api.acemusic.ai");
    const result = await runAceRemix({ baseUrl, apiKey: pickBrowserAceApiKey(), input });
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.functions.invoke("generate-loop-ace", {
          body: {
            action: "bump_usage",
            ...(input.generationKey ? { generationKey: input.generationKey } : {}),
          },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
    } catch {
      void 0;
    }
    return result;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Authentication required");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const forcedRegion = import.meta.env.VITE_SUPABASE_FUNCTION_REGION as string | undefined;
  const url = `${supabaseUrl}/functions/v1/generate-loop-ace${forcedRegion ? `?forceFunctionRegion=${encodeURIComponent(forcedRegion)}` : ""}`;

  const form = new FormData();
  form.append("action", "remix");
  form.append("prompt", input.prompt);
  form.append("lyrics", input.lyrics ?? "");
  form.append("taskType", input.taskType ?? "cover");
  form.append("coverStrength", String(input.coverStrength ?? 0.65));
  form.append("instrumental", input.instrumental === false ? "0" : "1");
  form.append("audioFormat", input.audioFormat ?? "mp3");
  if (input.durationSec != null) form.append("duration", String(input.durationSec));
  if (input.bpm != null) form.append("bpm", String(input.bpm));
  if (input.generationKey) form.append("generationKey", input.generationKey);
  form.append("src_audio", input.audioFile, input.audioFile.name || "source.mp3");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: anonKey,
    },
    body: form,
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    try {
      const parsed = JSON.parse(text) as { error?: string; code?: string; limitReached?: boolean };
      if (parsed.code === "ACE_REMIX_UNAVAILABLE" || res.status === 503) {
        const { AceRemixUnavailableError, ACE_REMIX_UNAVAILABLE_COPY } = await import("@/lib/aceRemix");
        throw new AceRemixUnavailableError(parsed.error || ACE_REMIX_UNAVAILABLE_COPY.en);
      }
      if (parsed.error) {
        if (parsed.error.includes("release_task failed (404)") || parsed.error.includes("ACE_REMIX")) {
          const { AceRemixUnavailableError, ACE_REMIX_UNAVAILABLE_COPY } = await import("@/lib/aceRemix");
          throw new AceRemixUnavailableError(ACE_REMIX_UNAVAILABLE_COPY.en);
        }
        const e = new Error(parsed.error) as Error & { limitReached?: boolean };
        e.limitReached = parsed.limitReached;
        throw e;
      }
    } catch (err) {
      if (err instanceof Error && ("limitReached" in err || err.name === "AceRemixUnavailableError")) throw err;
    }
    throw new Error(text || `Remix failed (${res.status})`);
  }
  const data = JSON.parse(text) as { audioUrl?: string; meta?: AceMeta | null; error?: string; limitReached?: boolean };
  if (data.error) {
    const e = new Error(data.error) as Error & { limitReached?: boolean };
    e.limitReached = data.limitReached;
    throw e;
  }
  if (!data.audioUrl) throw new Error("No audio URL returned");
  return { audioUrl: data.audioUrl, meta: data.meta ?? null };
}
