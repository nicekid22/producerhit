export type {
  AceMeta,
  GenerateBeatResult,
  GenerateLoopAceOptions,
  GenerateParams,
  GenerationJobResult,
  GenerationJobStatus,
} from "./types";

export { computeAceRequestedDurationSec } from "./aceDuration";
export { resolveAceQualityFlags, ACE_QUALITY_DEFAULTS } from "./aceQuality";
export { buildAceCaption } from "./promptAce";
export { buildAceRequestBody, resolveAceSampleMode, buildAceSampleQuery } from "./aceRequest";
export {
  buildAceChatCompletionsMessage,
  buildAceChatCompletionsHttpBody,
  resolveAceLyricsApiFieldForRequest,
} from "./aceSampleMode";
export { isAiComposeSongRequest } from "./aceGenreOnlyLyrics";
export {
  ACE_AI_COMPOSE_LYRICS_PLACEHOLDER,
  looksLikeAceCaptionEchoLyrics,
  looksLikeAceStructuralLyrics,
  looksLikeSingableLyrics,
  resolveAceLyricsApiField,
  resolveAceLyricsForMeta,
} from "./aceLyricsApi";
export {
  normalizeAceCaption,
  normalizeAceGenerationPayload,
  normalizeAceLyrics,
  ACE_CAPTION_MAX_CHARS,
  ACE_SONG_VOCAL_STABILITY_TAGS,
  ACE_BEAT_INSTRUMENTAL_TAGS,
  type AceGenerationMode,
  type AcePromptSource,
  type NormalizedAcePayload,
  type NormalizeAcePayloadInput,
} from "../prompt/acePromptContract";
export {
  buildStemsUrlForDb,
  buildAceStemsFromMeta,
  extractAceTaskId,
  isHttpAudioUrl,
} from "./stems";
export {
  createGenerationJobsClient,
  INLINE_AUDIO_MAX_CHARS,
  POLL_MS_DEFAULT,
  type GenerationJobsConfig,
  type GenerationJobsDeps,
  type WaitForJobOptions,
} from "./jobs";
export {
  defaultBeatName,
  defaultSongName,
  generateLoopAceShared,
  generateTypeBeatAce,
  loopLengthToBars,
  toGenerateParams,
  toSongGenerateParams,
  type GenerateTypeBeatAceDeps,
  type SonautoFallbackBody,
} from "./generateBeat";
export {
  detectVocalLanguageFromText,
  resolveSongVocalLanguage,
  buildSongUiPrompt,
} from "../vocalLanguage";
export { estimateSongDurationFromLyrics } from "./aceDuration";
export { estimateGenerationDurationMs, simulatedGenerationPercent } from "./generationProgress";
export {
  buildLoopVariantPrompt,
  isSongLikeLoop,
  nextVariantSeed,
  prepareLoopVariantGeneration,
  variantResultTitle,
  type LoopVariantKind,
} from "./loopVariant";
export { registerGenerationCatalogExtensions } from "./extendedRegistry";
