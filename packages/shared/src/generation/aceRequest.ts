import { computeAceRequestedDurationSec } from "./aceDuration";
import { resolveAceQualityFlags } from "./aceQuality";
import { normalizeAceGenerationPayload } from "../prompt/acePromptContract";
import { buildAceCaption } from "./promptAce";
import type { GenerateLoopAceOptions, GenerateParams } from "./types";

/**
 * Routage ACE prompt vs sample_mode (champ « Idée » UI, pas les paroles).
 *
 * | Cas | caption envoyée | sample_mode | useFormat |
 * |-----|-----------------|-------------|-----------|
 * | Idée remplie / dé / landing (captionOverride) | override enrichi | false | true |
 * | Idée vide + genre catalogue (buildAceCaption) | tags genre ACE | false | true |
 * | Idée vide + rien à mettre en caption | "" + sample_query | true | false |
 * | Beat instrumental | tags beat | false | true |
 *
 * Bug corrigé : idée vide + genre choisi activait sample_mode car lyrics vides,
 * vidant caption et désactivant l'enrichissement — alors que buildAceCaption
 * fournit déjà le prompt genre à envoyer.
 */
export function resolveAceSampleMode(args: {
  captionOverride: string;
  baseCaption: string;
  instrumental: boolean;
  lyricsTrimmed: string;
  explicitSampleMode?: boolean;
}): boolean {
  if (args.captionOverride.trim()) return false;
  const isAiLyrics = !args.instrumental && args.lyricsTrimmed === "";
  const hasCatalogPrompt = args.baseCaption.trim().length > 0;
  if (isAiLyrics && hasCatalogPrompt) return args.explicitSampleMode === true;
  return Boolean(args.explicitSampleMode || isAiLyrics);
}

export function buildAceRequestBody(
  params: GenerateParams,
  options?: GenerateLoopAceOptions,
): Record<string, unknown> {
  const isSong = options?.isSong ?? !options?.instrumental;
  const promptParams = options?.autoMeta ? { ...params, bpm: 0, key: "", scale: "" } : params;
  const instrumental = options?.instrumental ?? true;
  const lyricsRaw = options?.lyrics ?? "";
  const lyricsTrimmed = lyricsRaw.trim();
  const vocalLanguage = options?.vocalLanguage ?? "en";
  const captionOverride = options?.captionOverride?.trim() ?? "";
  const rawCaption =
    captionOverride || buildAceCaption(promptParams, { isSong, instrumental, autoMeta: Boolean(options?.autoMeta), vocalLanguage });
  const melodyComposition = options?.melodyComposition === true;
  const aceMode = melodyComposition ? "melody" : instrumental ? "beat" : "song";
  const contractBpm =
    options?.autoMeta || !Number.isFinite(params.bpm) || params.bpm <= 0 ? null : Math.round(params.bpm);
  const normalized = normalizeAceGenerationPayload({
    mode: aceMode,
    caption: rawCaption,
    lyrics: lyricsTrimmed,
    instrumental,
    bpm: contractBpm,
    key: params.key,
    scale: params.scale,
    vocalLanguage,
    source: captionOverride ? "manual" : "catalog",
  });
  const baseCaption = normalized.caption;
  const sampleQuery = options?.sampleQuery?.trim() || "";
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

  const effectiveSampleMode = resolveAceSampleMode({
    captionOverride,
    baseCaption,
    instrumental,
    lyricsTrimmed,
    explicitSampleMode: options?.sampleMode,
  });
  const caption = effectiveSampleMode ? "" : baseCaption;
  const lyrics = normalized.lyrics || (instrumental ? "[Instrumental]" : lyricsTrimmed);
  const effectiveSampleQuery = effectiveSampleMode ? sampleQuery || baseCaption : sampleQuery;

  const clampNumber = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
  const bars =
    typeof params.loopLengthBars === "number" && Number.isFinite(params.loopLengthBars) && params.loopLengthBars > 0
      ? params.loopLengthBars
      : 8;
  const durationRaw =
    typeof options?.duration === "number" && Number.isFinite(options.duration) && options.duration > 0
      ? options.duration
      : null;
  const desiredDurationSec = computeAceRequestedDurationSec({ instrumental, durationRaw });

  const quality = resolveAceQualityFlags({
    thinking: options?.thinking,
    useFormat: options?.useFormat,
    sampleMode: effectiveSampleMode,
  });

  const body: Record<string, unknown> = {
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
  if (desiredDurationSec != null) body.duration = clampNumber(desiredDurationSec, 10, 120);
  if (typeof options?.seed === "number" && Number.isFinite(options.seed)) body.seed = options.seed;
  if (typeof options?.generationKey === "string" && options.generationKey.trim().length > 0) {
    body.generationKey = options.generationKey.trim();
  }
  if (effectiveSampleQuery) body.sampleQuery = effectiveSampleQuery;
  if (!options?.autoMeta && params.bpm > 0) body.bpm = params.bpm;
  if (!options?.autoMeta && params.key && params.scale) body.keyScale = `${params.key} ${params.scale}`;
  if (options?.timeSignature) body.timeSignature = options.timeSignature;
  if (params.genre) body.genre = params.genre;
  if (params.mood) body.mood = params.mood;
  if (params.energyLevel) body.energyLevel = params.energyLevel;
  if (options?.autoMeta) body.autoMeta = true;
  if (!options?.autoMeta && params.key) body.key = params.key;
  if (!options?.autoMeta && params.scale) body.scale = params.scale;
  body.isSong = isSong;
  if (typeof options?.aceKeyPreferIndex === "number" && Number.isFinite(options.aceKeyPreferIndex)) {
    body.aceKeyPreferIndex = Math.abs(Math.floor(options.aceKeyPreferIndex));
  }
  if (options?.requirePersistableUrl) body.requirePersistableUrl = true;
  if (melodyComposition) {
    body.melodyComposition = true;
  }
  if (typeof options?.voiceProfileId === "string" && options.voiceProfileId.trim()) {
    body.voiceProfileId = options.voiceProfileId.trim();
    if (typeof options.voiceCloneStrength === "number" && Number.isFinite(options.voiceCloneStrength)) {
      body.voiceCloneStrength = options.voiceCloneStrength;
    }
  }

  return body;
}
