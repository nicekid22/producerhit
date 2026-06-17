import { generateLoopAce } from "@/lib/audioApi";
import type { AppLocale } from "@/i18n/config";
import type { GenerateParams } from "@/lib/promptBuilder";
import {
  barsToLoopLength,
  buildSampleLabCaption,
  buildSampleLoopName,
  resolveSampleDurationSec,
  type SampleLabGenerateInput,
} from "@/lib/sampleLab";

export type SampleLabGenerateResult = {
  audioUrl: string;
  meta: Awaited<ReturnType<typeof generateLoopAce>>["meta"];
  caption: string;
  durationSec: number;
  loopName: string;
  loopLength: ReturnType<typeof barsToLoopLength>;
  format: SampleLabGenerateInput["format"];
};

export async function generateSampleLabLoop(
  input: SampleLabGenerateInput,
  options: {
    audioFormat?: string;
    seed?: number;
    locale?: AppLocale;
  } = {},
): Promise<SampleLabGenerateResult> {
  const locale = options.locale ?? "en";
  const caption = buildSampleLabCaption(input);
  const durationSec = resolveSampleDurationSec({
    format: input.format,
    durationSec: input.durationSec,
    bars: input.bars,
    bpm: input.bpm,
  });
  const loopLength =
    input.format === "mini_loop" ? barsToLoopLength(input.bars) : barsToLoopLength(16);
  const pack = input.packPresetId ?? "";

  const params: GenerateParams = {
    genre: input.genre,
    influence: pack || input.instrument,
    key: input.key,
    scale: input.scale,
    bpm: input.bpm,
    loopLengthBars: input.format === "mini_loop" ? input.bars : 16,
    swing: 0,
    mood: input.mood,
    energyLevel: "medium",
    reverb: "dry",
    prompt: caption.slice(0, 512),
  };

  const result = await generateLoopAce(params, {
    instrumental: true,
    isSong: false,
    duration: durationSec,
    audioFormat: options.audioFormat ?? "mp3",
    requirePersistableUrl: true,
    captionOverride: caption,
    melodyComposition: true,
    thinking: true,
    /** Évite que le LM « enhance » repousse vers un beat avec drums. */
    useFormat: false,
  });

  return {
    audioUrl: result.audioUrl,
    meta: result.meta ?? null,
    caption,
    durationSec,
    loopName: buildSampleLoopName(input, locale),
    loopLength,
    format: input.format,
  };
}
