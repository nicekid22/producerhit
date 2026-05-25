import { supabase } from "@/lib/supabaseClient";
import { buildAceCaption, buildRichPrompt, buildSonautoTags, type GenerateParams } from "@/lib/promptBuilder";

export type AceMeta = {
  taskId?: string;
  task_id?: string;
  prompt?: string;
  lyrics?: string;
  bpm?: number | null;
  duration?: number | null;
  keyScale?: string;
  timeSignature?: string;
  audioFormat?: string;
  seed?: number | null;
  stemsZipUrl?: string;
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

async function invokeSupabaseFunction<T>(args: {
  name: string;
  body: unknown;
  accessToken?: string;
}): Promise<{ data: T | null; errorText: string | null }> {
  const forcedRegion = import.meta.env.VITE_SUPABASE_FUNCTION_REGION as string | undefined;
  if (!forcedRegion) {
    const { data, error } = await supabase.functions.invoke(args.name, {
      body: args.body,
      headers: args.accessToken ? { Authorization: `Bearer ${args.accessToken}` } : {},
    });
    if (error) {
      const extracted = await extractInvokeError(error);
      return { data: null, errorText: extracted.message };
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
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) return { data: null, errorText: text || `Edge Function error (${res.status})` };
  try {
    return { data: (JSON.parse(text) as T) ?? null, errorText: null };
  } catch {
    return { data: null, errorText: "Invalid JSON from Edge Function" };
  }
}

async function extractInvokeError(error: unknown): Promise<{ message: string; limitReached?: boolean }> {
  const anyError = error as unknown as { message?: string; context?: { body?: unknown } };
  const errContext = anyError.context as unknown;
  const errBody = (anyError.context as { body?: unknown } | undefined)?.body;

  const fromParsed = (parsed: unknown) => {
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as { error?: unknown; limitReached?: unknown };
    const message = typeof obj.error === "string" ? obj.error : null;
    const limitReached = obj.limitReached === true ? true : undefined;
    return message ? { message, limitReached } : null;
  };

  if (errContext && typeof errContext === "object" && typeof (errContext as Response).text === "function") {
    try {
      const text = await (errContext as Response).text();
      try {
        const parsed = JSON.parse(text) as unknown;
        const extracted = fromParsed(parsed);
        if (extracted) return extracted;
      } catch {
        if (text && text.trim().length > 0) return { message: text };
      }
    } catch {
      // ignore
    }
  }

  if (typeof errBody === "string") {
    try {
      const parsed = JSON.parse(errBody) as unknown;
      const extracted = fromParsed(parsed);
      if (extracted) return extracted;
    } catch {
      return { message: anyError.message ?? "Edge Function error" };
    }
  }

  const extracted = fromParsed(errBody);
  if (extracted) return extracted;

  return { message: anyError.message ?? "Edge Function error" };
}

async function generateLoopAceDirect(
  params: GenerateParams,
  options?: {
    instrumental?: boolean;
    lyrics?: string;
    vocalLanguage?: string;
    autoMeta?: boolean;
    useFormat?: boolean;
    duration?: number;
    timeSignature?: string;
    sampleMode?: boolean;
    sampleQuery?: string;
    isSong?: boolean;
    audioFormat?: string;
    seed?: number;
    generationKey?: string;
  },
): Promise<{ audioUrl: string; meta?: AceMeta | null }> {
  const aceApiKey = import.meta.env.VITE_ACE_STEP_API_KEY as string | undefined;
  const baseUrlRaw = (import.meta.env.VITE_ACE_STEP_BASE_URL as string | undefined) ?? "https://api.acemusic.ai";
  const baseUrl = normalizeAceBaseUrl(baseUrlRaw);
  if (!aceApiKey) throw new Error("Missing VITE_ACE_STEP_API_KEY");

  const pickOne = <T,>(items: T[]): T => {
    if (items.length <= 1) return items[0];
    try {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return items[a[0] % items.length];
    } catch {
      return items[Math.floor(Math.random() * items.length)];
    }
  };

  const isSong = options?.isSong ?? !options?.instrumental;
  const promptParams = options?.autoMeta ? { ...params, bpm: 0, key: "", scale: "" } : params;
  const instrumental = options?.instrumental ?? true;
  const vocalLanguage = options?.vocalLanguage ?? "en";
  const baseCaption = buildAceCaption(promptParams, { isSong, instrumental, autoMeta: Boolean(options?.autoMeta), vocalLanguage });

  const lyrics = options?.lyrics ?? "";
  const effectiveLyrics = instrumental ? "[Instrumental]" : lyrics.trim();
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

    let extractedLyrics = "";
    const idx = content.toLowerCase().indexOf("## lyrics");
    if (idx >= 0) extractedLyrics = content.slice(idx + "## lyrics".length).trim();

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

  const generateViaChatCompletions = async (): Promise<{ audioUrl: string; meta: AceMeta | null }> => {
    const parts: string[] = [];
    if (instrumental) {
      const beatTemplate =
        params.genre === "Old School Hip-Hop"
          ? pickOne([
              "Create a classic old-school hip-hop / boom bap beat with a sample-based chopped loop.",
              "Generate an old-school boom bap hip-hop instrumental with dusty drums and a deconstructed sample chop.",
              "Old-school hip-hop beat: chopped soul/jazz sample, punchy kick/snare, MPC swing, subtle scratches.",
            ])
          : pickOne([
              `Create a modern 2026 ${params.genre} beat with contemporary drums and sound design.`,
              `Generate a modern 2026 ${params.genre} beat that feels current, clean, and release-ready.`,
              `Modern 2026 ${params.genre} beat with a strong groove, modern textures, and a polished mix.`,
            ]);
      parts.push(beatTemplate);
      parts.push(baseCaption.trim());
      if (params.mood) parts.push(`Mood: ${params.mood}.`);
      if (params.energyLevel) parts.push(`Energy: ${params.energyLevel}.`);
      parts.push("No lead singing and no rapped verses. Avoid intelligible lyrics or spoken words.");
      parts.push("Vocal chops/samples are allowed as texture (short, chopped, and non-lyrical).");
      parts.push("Do not output any lyrics text. Omit the '## Lyrics' section entirely.");
    } else {
      parts.push(baseCaption.trim());
    }
    if (!instrumental && effectiveLyrics) parts.push(`Lyrics:\n${effectiveLyrics}`);
    parts.push(
      instrumental
        ? "Instrumental beat. No lead singing and no rapped verses. Avoid intelligible lyrics or spoken words. Vocal chops are allowed."
        : "Include vocals.",
    );
    if (!options?.autoMeta && params.bpm > 0) parts.push(`BPM: ${params.bpm}.`);
    if (!options?.autoMeta && params.key && params.scale) parts.push(`Key: ${params.key} ${params.scale}.`);
    if (options?.timeSignature) parts.push(`Time signature: ${options.timeSignature}.`);
    if (params.genre) {
      parts.push(`In the generated Metadata caption, explicitly include the genre: "${params.genre}".`);
    }
    if (params.genre === "Dancehall") {
      parts.push('In the generated Metadata caption, explicitly include the words: "dancehall" and "riddim".');
    }

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aceApiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: "acemusic/acestep-v1.5-turbo",
        messages: [{ role: "user", content: parts.join("\n\n") }],
        lyrics: instrumental ? "[instrumental]" : effectiveLyrics,
        task_type: "text2music",
        audio_config: {
          instrumental,
          ...(requestedDuration != null ? { duration: requestedDuration } : {}),
          bpm: !options?.autoMeta && params.bpm > 0 ? params.bpm : null,
          key_scale: !options?.autoMeta && params.key && params.scale ? `${params.key} ${params.scale}` : null,
          time_signature: options?.timeSignature || null,
          vocal_language: options?.vocalLanguage || "en",
          format: audioFormat,
          audio_format: audioFormat,
        },
        stream: false,
      }),
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) throw new Error(`ACE API chat/completions failed (${res.status}): ${text}`);

    const json = JSON.parse(text) as unknown;
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
    const audioArr =
      messageObj && typeof messageObj === "object" && messageObj !== null && Array.isArray((messageObj as { audio?: unknown }).audio)
        ? ((messageObj as { audio: unknown[] }).audio as unknown[])
        : [];
    const firstAudio = audioArr[0] && typeof audioArr[0] === "object" && audioArr[0] !== null ? (audioArr[0] as Record<string, unknown>) : null;
    const audioUrlRaw =
      firstAudio && typeof (firstAudio as { audio_url?: unknown }).audio_url === "object" && (firstAudio as { audio_url?: unknown }).audio_url !== null
        ? ((firstAudio as { audio_url: { url?: unknown } }).audio_url.url as unknown)
        : null;
    const audioUrlStr = typeof audioUrlRaw === "string" ? audioUrlRaw : "";
    const audioUrl = audioUrlStr.startsWith("data:") ? audioUrlStr : buildAceAudioUrl(baseUrl, audioUrlStr);
    if (!audioUrl) throw new Error("ACE API returned no audio");
    const parsed = content ? parseChatContent(content) : {};
    const fallbackBpm = !options?.autoMeta && params.bpm > 0 ? params.bpm : null;
    const fallbackKeyScale = !options?.autoMeta && params.key && params.scale ? `${params.key} ${params.scale}` : "";
    const meta: AceMeta = {
      prompt: parsed.prompt || baseCaption,
      lyrics: instrumental ? "" : parsed.lyrics || effectiveLyrics || undefined,
      bpm: (parsed.bpm && parsed.bpm > 0 ? parsed.bpm : fallbackBpm) ?? null,
      duration: (parsed.duration && parsed.duration > 0 ? parsed.duration : requestedDuration) ?? null,
      keyScale: (parsed.keyScale || fallbackKeyScale || undefined) ?? undefined,
      timeSignature: (parsed.timeSignature || options?.timeSignature || undefined) ?? undefined,
      audioFormat,
    };
    return { audioUrl, meta };
  };

  const clampNumber = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  const requestedDuration: number = (() => {
    if (!instrumental) {
      const raw = typeof options?.duration === "number" && Number.isFinite(options.duration) && options.duration > 0 ? options.duration : 90;
      return clampNumber(raw, 10, 120);
    }
    if (typeof options?.duration === "number" && Number.isFinite(options.duration) && options.duration > 0) {
      return clampNumber(options.duration, 10, 120);
    }
    return 90;
  })();

  const paramObj: Record<string, unknown> = { duration: clampNumber(requestedDuration, 10, 120) };
  if (!options?.autoMeta && params.bpm > 0) paramObj.bpm = params.bpm;
  if (!options?.autoMeta && params.key && params.scale) paramObj.key = `${params.key} ${params.scale}`;
  if (options?.timeSignature) paramObj.time_signature = options.timeSignature;
  if (audioFormat) paramObj.audio_format = audioFormat;
  if (typeof options?.seed === "number" && Number.isFinite(options.seed)) paramObj.seed = options.seed;

  const createForm = new FormData();
  createForm.append("env", "production");
  createForm.append("ai_token", aceApiKey);
  createForm.append("prompt", baseCaption);
  createForm.append("lyrics", effectiveLyrics);
  createForm.append("model_name", "acestep-v15-xl-turbo");
  createForm.append("app", "studio-web");
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
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          await supabase.functions.invoke("generate-loop-ace", {
            body: {
              action: "bump_usage",
              ...(typeof options?.generationKey === "string" && options.generationKey.trim().length > 0 ? { generationKey: options.generationKey.trim() } : {}),
            },
            headers: {
              Authorization: "Bearer " + session.access_token,
            },
          });
        }
      } catch (e) {
        console.warn("bump_usage failed:", e);
      }
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
  const timeoutMs = 150_000;
  let audioUrl = "";
  let meta: AceMeta | null = null;
  while (Date.now() - startedAt < timeoutMs) {
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
        lyrics: lyricsFromResult || effectiveLyrics || undefined,
        bpm: bpm && isFinite(bpm) ? bpm : null,
        duration: duration && isFinite(duration) ? duration : null,
        keyScale: keyScale || undefined,
        timeSignature: timeSignature || undefined,
        audioFormat,
        seed: typeof seed === "number" && isFinite(seed) ? seed : null,
      };
      break;
    }
    if (statusNum === 2) throw new Error("ACE task failed");
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (!audioUrl) throw new Error("ACE generation timed out");

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      await supabase.functions.invoke("generate-loop-ace", {
        body: {
          action: "bump_usage",
          ...(typeof options?.generationKey === "string" && options.generationKey.trim().length > 0 ? { generationKey: options.generationKey.trim() } : {}),
        },
        headers: {
          Authorization: "Bearer " + session.access_token,
        },
      });
    }
  } catch (e) {
    console.warn("bump_usage failed:", e);
  }

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
  },
): Promise<{ audioUrl: string; meta?: AceMeta | null }> {
  const directKey = import.meta.env.VITE_ACE_STEP_API_KEY as string | undefined;
  if (directKey) return await generateLoopAceDirect(params, options);

  const isSong = options?.isSong ?? !options?.instrumental;
  const promptParams = options?.autoMeta ? { ...params, bpm: 0, key: "", scale: "" } : params;
  const instrumental = options?.instrumental ?? true;
  const lyricsRaw = options?.lyrics ?? "";
  const vocalLanguage = options?.vocalLanguage ?? "en";
  const baseCaption = buildAceCaption(promptParams, { isSong, instrumental, autoMeta: Boolean(options?.autoMeta), vocalLanguage });
  const sampleQuery = options?.sampleQuery?.trim() || "";
  const audioFormatRaw = (options?.audioFormat || "").trim().toLowerCase();
  const audioFormat =
    audioFormatRaw === "wav" || audioFormatRaw === "wav32" || audioFormatRaw === "flac" || audioFormatRaw === "mp3" || audioFormatRaw === "aac" || audioFormatRaw === "opus"
      ? audioFormatRaw
      : "mp3";

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // sample_mode should only be used when we want ACE to auto-generate lyrics/metas.
  // use_format should stay independent (it formats/enhances provided caption/lyrics).
  const isAiLyrics = !instrumental && lyricsRaw === "";
  const effectiveSampleMode = Boolean(options?.sampleMode || isAiLyrics);
  const caption = effectiveSampleMode ? "" : baseCaption;
  const lyrics = instrumental ? "[Instrumental]" : lyricsRaw;
  const effectiveSampleQuery = effectiveSampleMode ? (sampleQuery || baseCaption) : sampleQuery;

  const clampNumber = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
  const bars = typeof params.loopLengthBars === "number" && Number.isFinite(params.loopLengthBars) && params.loopLengthBars > 0 ? params.loopLengthBars : 8;
  const durationRaw = typeof options?.duration === "number" && Number.isFinite(options.duration) && options.duration > 0 ? options.duration : null;
  const desiredDurationSec = (() => {
    if (!instrumental) return clampNumber(durationRaw ?? 90, 10, 120);
    if (durationRaw != null) return clampNumber(durationRaw, 10, 120);
    return 90;
  })();

  const body: Record<string, unknown> = {
    caption,
    lyrics,
    instrumental,
    vocalLanguage,
    useFormat: effectiveSampleMode ? false : (options?.useFormat ?? false),
    thinking: options?.thinking ?? true,
    sampleMode: effectiveSampleMode,
    audioFormat,
    loopLengthBars: bars,
    duration: clampNumber(desiredDurationSec, 10, instrumental ? 120 : 120),
  };
  if (typeof options?.seed === "number" && Number.isFinite(options.seed)) body.seed = options.seed;
  if (typeof options?.generationKey === "string" && options.generationKey.trim().length > 0) body.generationKey = options.generationKey.trim();
  if (effectiveSampleQuery) body.sampleQuery = effectiveSampleQuery;
  if (!options?.autoMeta && params.bpm > 0) body.bpm = params.bpm;
  if (!options?.autoMeta && params.key && params.scale) body.keyScale = `${params.key} ${params.scale}`;
  if (options?.timeSignature) body.timeSignature = options.timeSignature;

  const { data, errorText } = await invokeSupabaseFunction<{ audioUrl?: string; meta?: AceMeta | null; error?: string; limitReached?: boolean }>(
    {
      name: "generate-loop-ace",
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
  const rawMeta = ((data as { meta?: unknown } | null)?.meta ?? null) as unknown;
  const metaObj = rawMeta && typeof rawMeta === "object" ? (rawMeta as Record<string, unknown>) : null;
  const taskIdFromMeta =
    (typeof metaObj?.taskId === "string" ? metaObj.taskId : "") ||
    (typeof metaObj?.task_id === "string" ? metaObj.task_id : "");
  const normalizedMeta =
    metaObj
      ? ({
          ...(metaObj as unknown as AceMeta),
          taskId: taskIdFromMeta ? taskIdFromMeta.trim() : undefined,
        } as AceMeta)
      : null;
  return {
    audioUrl,
    meta: normalizedMeta,
  };
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
