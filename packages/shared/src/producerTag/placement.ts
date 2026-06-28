import type { ProducerTagPlacement } from "./types";

export type TagOffsetInput = {
  bpm: number | null | undefined;
  durationSec: number;
  tagDurationSec: number;
  placement: ProducerTagPlacement;
  /** Seed for random_bars — stable per loop if provided */
  randomSeed?: number;
};

function barDurationSec(bpm: number): number {
  return (60 / Math.max(40, bpm)) * 4;
}

function barOffsetSec(bpm: number, bars: number): number {
  return barDurationSec(bpm) * bars;
}

function clampOffset(offset: number, durationSec: number, tagDurationSec: number): number {
  const max = Math.max(0, durationSec - tagDurationSec - 0.05);
  return Math.min(Math.max(0, offset), max);
}

function pickRandomBar(randomSeed: number | undefined, durationSec: number, bpm: number, tagDurationSec: number): number {
  const candidates = [8, 16, 24, 32];
  const barSec = barDurationSec(bpm);
  const valid = candidates.filter((b) => b * barSec + tagDurationSec < durationSec - 0.5);
  if (!valid.length) return 8;
  const seed = randomSeed ?? 0;
  const idx = Math.abs(seed) % valid.length;
  return valid[idx] ?? 8;
}

/** Compute tag start time (seconds) on the beat timeline. */
export function computeTagOffsetSec(input: TagOffsetInput): number {
  const { durationSec, tagDurationSec, placement } = input;
  const bpm = input.bpm && input.bpm > 0 ? input.bpm : 120;

  if (placement === "intro" || placement === "smart_intro") {
    return clampOffset(0, durationSec, tagDurationSec);
  }

  if (placement === "outro") {
    return clampOffset(durationSec - tagDurationSec - 0.25, durationSec, tagDurationSec);
  }

  if (placement === "pre_drop") {
    const drop = barOffsetSec(bpm, 16);
    return clampOffset(Math.max(0, drop - tagDurationSec - 0.15), durationSec, tagDurationSec);
  }

  if (placement === "bar_8") {
    return clampOffset(barOffsetSec(bpm, 8), durationSec, tagDurationSec);
  }

  if (placement === "bar_16") {
    return clampOffset(barOffsetSec(bpm, 16), durationSec, tagDurationSec);
  }

  if (placement === "random_bars") {
    const bars = pickRandomBar(input.randomSeed, durationSec, bpm, tagDurationSec);
    return clampOffset(barOffsetSec(bpm, bars), durationSec, tagDurationSec);
  }

  return clampOffset(0, durationSec, tagDurationSec);
}

/** Simple RMS-based intro skip (Phase 3 smart_intro helper). Returns seconds to skip before tag at 0. */
export function detectSmartIntroSkipSec(rmsSamples: number[], sampleRate: number): number {
  if (!rmsSamples.length || sampleRate <= 0) return 0;
  const windowSec = 0.1;
  const windowSamples = Math.max(1, Math.floor(sampleRate * windowSec));
  let lowEnergyEnd = 0;
  const threshold = 0.02;
  for (let i = 0; i < rmsSamples.length; i++) {
    if (rmsSamples[i]! > threshold) {
      lowEnergyEnd = (i * windowSamples) / sampleRate;
      break;
    }
  }
  return Math.min(2, lowEnergyEnd);
}
