import {
  buildAceChatCompletionsParts,
  buildAceSampleModeUserMessage,
  type BuildAceChatCompletionsInput,
} from "../prompt/aceChatCompletions";
import { resolveAceLyricsApiField } from "./aceLyricsApi";

/**
 * ACE « Simple / AI writes » — description naturelle → caption + paroles + audio.
 * Activé pour toute chanson sans paroles manuelles (y compris avec captionOverride catalogue).
 */
export function resolveAceSampleMode(args: {
  captionOverride: string;
  instrumental: boolean;
  melodyComposition?: boolean;
  explicitSampleMode?: boolean;
  lyricsTrimmed?: string;
}): boolean {
  if (args.instrumental) return false;
  if (args.melodyComposition) return false;
  if (args.explicitSampleMode === false) return false;
  if (args.explicitSampleMode === true) return true;
  return !(args.lyricsTrimmed || "").trim();
}

/** Texte naturel pour sample_query (mode Simple ACE). */
export function buildAceSampleQuery(args: { genre?: string; idea?: string; vocalStyle?: string }): string {
  const genre = (args.genre || "").trim();
  const idea = (args.idea || "").trim();
  const style = (args.vocalStyle || "").trim();

  if (idea) {
    const withGenre =
      genre && !idea.toLowerCase().includes(genre.toLowerCase()) ? `${idea}, ${genre} song` : idea;
    return style ? `${withGenre}, ${style} vocal style` : withGenre;
  }

  const base = genre ? `${genre} song` : "pop song";
  return style ? `${base}, ${style} vocal style` : base;
}

export function buildAceChatCompletionsMessage(
  input: BuildAceChatCompletionsInput & {
    sampleMode?: boolean;
    sampleQuery?: string;
    captionOverride?: string;
  },
): string {
  if (input.sampleMode) {
    return buildAceSampleModeUserMessage({
      sampleQuery: input.sampleQuery || input.baseCaption || input.prompt || "",
      captionOverride: input.captionOverride,
      vocalLanguage: input.vocalLanguage,
    });
  }
  return buildAceChatCompletionsParts(input).join("\n\n");
}

/** Champ `lyrics` HTTP — omis en sample_mode sans paroles user (ACE auto-compose). */
export function resolveAceLyricsApiFieldForRequest(args: {
  instrumental: boolean;
  lyricsTrimmed: string;
  sampleMode: boolean;
}): string | undefined {
  if (args.instrumental) return "[instrumental]";
  if (args.sampleMode && !args.lyricsTrimmed.trim()) return undefined;
  return resolveAceLyricsApiField(args);
}

export function buildAceChatCompletionsHttpBody(args: {
  model: string;
  thinking: boolean;
  useFormat: boolean;
  sampleMode: boolean;
  sampleQuery: string;
  messageContent: string;
  lyricsField: string | undefined;
  audioConfig: Record<string, unknown>;
  batchSize?: number;
  extraFields?: Record<string, unknown>;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: args.model,
    thinking: args.thinking,
    use_format: args.useFormat,
    messages: [{ role: "user", content: args.messageContent }],
    task_type: "text2music",
    audio_config: args.audioConfig,
    stream: false,
    ...(args.extraFields ?? {}),
  };
  if (args.sampleMode) {
    body.sample_mode = true;
    const sq = args.sampleQuery.trim();
    if (sq) body.sample_query = sq;
  }
  if (args.lyricsField !== undefined) body.lyrics = args.lyricsField;
  if (args.batchSize && args.batchSize > 1) body.batch_size = args.batchSize;
  return body;
}
