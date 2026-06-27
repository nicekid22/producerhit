import { buildAceChatCompletionsParts, type BuildAceChatCompletionsInput } from "./aceChatCompletions.ts";
import { resolveAceLyricsApiField } from "./aceLyricsApi.ts";

export function resolveAceSampleMode(args: {
  captionOverride: string;
  instrumental: boolean;
  explicitSampleMode?: boolean;
  lyricsTrimmed?: string;
}): boolean {
  if (args.instrumental) return false;
  if (args.captionOverride.trim()) return false;
  if (args.explicitSampleMode === false) return false;
  if (args.explicitSampleMode === true) return true;
  return !(args.lyricsTrimmed || "").trim();
}

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
  input: BuildAceChatCompletionsInput & { sampleMode?: boolean; sampleQuery?: string },
): string {
  if (input.sampleMode) {
    return (input.sampleQuery || input.baseCaption || input.prompt || "").trim();
  }
  return buildAceChatCompletionsParts(input).join("\n\n");
}

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
