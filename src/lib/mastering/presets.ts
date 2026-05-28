import type { AudioAnalysis } from "@/lib/mastering/analyze";

export type MasterPresetId = "balanced" | "loud" | "warm" | "bright" | "punch";

export type MasterPreset = {
  id: MasterPresetId;
  labelFr: string;
  labelEn: string;
  descriptionFr: string;
  descriptionEn: string;
  lowGain: number;
  midGain: number;
  highGain: number;
  compressor: { threshold: number; ratio: number; attack: number; release: number; knee: number };
  limiter: { threshold: number; ratio: number };
  saturation: number;
  outputGainDb: number;
};

/** Presets calibrés streaming : polish pro, différence audible, sans saturation. */
export const MASTER_PRESETS: Record<MasterPresetId, MasterPreset> = {
  balanced: {
    id: "balanced",
    labelFr: "Équilibré",
    labelEn: "Balanced",
    descriptionFr: "Fini pro discret — clarté et équilibre parfaits",
    descriptionEn: "Discrete pro finish — clarity and perfect balance",
    lowGain: 0.6,
    midGain: 0.25,
    highGain: 0.5,
    compressor: { threshold: -14, ratio: 1.6, attack: 0.022, release: 0.28, knee: 12 },
    limiter: { threshold: -4.5, ratio: 6 },
    saturation: 0,
    outputGainDb: 0.6,
  },
  loud: {
    id: "loud",
    labelFr: "Loud",
    labelEn: "Loud",
    descriptionFr: "Présence streaming — percutant sans écraser",
    descriptionEn: "Streaming presence — punchy without crushing",
    lowGain: 1,
    midGain: 0.4,
    highGain: 0.8,
    compressor: { threshold: -16, ratio: 2, attack: 0.016, release: 0.22, knee: 10 },
    limiter: { threshold: -3.5, ratio: 8 },
    saturation: 0.02,
    outputGainDb: 1,
  },
  warm: {
    id: "warm",
    labelFr: "Chaud",
    labelEn: "Warm",
    descriptionFr: "Chaleur et profondeur — idéal R&B & soul",
    descriptionEn: "Warmth and depth — perfect for R&B & soul",
    lowGain: 1.2,
    midGain: -0.2,
    highGain: -0.4,
    compressor: { threshold: -13, ratio: 1.5, attack: 0.028, release: 0.32, knee: 14 },
    limiter: { threshold: -4.5, ratio: 5 },
    saturation: 0.025,
    outputGainDb: 0.5,
  },
  bright: {
    id: "bright",
    labelFr: "Brillant",
    labelEn: "Bright",
    descriptionFr: "Brillance et air — pop & dance prêts à sortir",
    descriptionEn: "Sparkle and air — release-ready pop & dance",
    lowGain: 0.2,
    midGain: 0.5,
    highGain: 1.2,
    compressor: { threshold: -15, ratio: 1.8, attack: 0.018, release: 0.24, knee: 11 },
    limiter: { threshold: -4, ratio: 7 },
    saturation: 0.015,
    outputGainDb: 0.8,
  },
  punch: {
    id: "punch",
    labelFr: "Punch",
    labelEn: "Punch",
    descriptionFr: "Kick & snare au premier plan — trap & drill",
    descriptionEn: "Kick & snare upfront — trap & drill",
    lowGain: 1.4,
    midGain: 0.6,
    highGain: 0.4,
    compressor: { threshold: -18, ratio: 2.2, attack: 0.009, release: 0.16, knee: 8 },
    limiter: { threshold: -3.8, ratio: 8 },
    saturation: 0.03,
    outputGainDb: 0.9,
  },
};

export const MASTER_PRESET_LIST = Object.values(MASTER_PRESETS);

export function suggestPresetId(genre: string, mood?: string): MasterPresetId {
  const g = `${genre} ${mood ?? ""}`.toLowerCase();
  if (/(trap|drill|rage|jersey|plug)/.test(g)) return "punch";
  if (/(r&b|soul|neo|funk|trapsoul)/.test(g)) return "warm";
  if (/(pop|hyperpop|dance|club|garage)/.test(g)) return "bright";
  if (/(ambient|lo.?fi|chill|atmospheric)/.test(g)) return "balanced";
  return "balanced";
}

/** Atténue EQ / saturation / gain si le mix source est déjà fort. */
export function adaptPresetForInput(preset: MasterPreset, input: AudioAnalysis): MasterPreset {
  const hot = input.peak > 0.82 || input.rms > 0.11;
  const clipped = input.peak > 0.97;
  const scale = clipped ? 0.25 : hot ? 0.55 : 1;

  return {
    ...preset,
    lowGain: preset.lowGain * scale,
    midGain: preset.midGain * scale,
    highGain: preset.highGain * scale,
    saturation: preset.saturation * scale,
    outputGainDb: preset.outputGainDb * scale,
    compressor: {
      ...preset.compressor,
      threshold: preset.compressor.threshold + (hot ? 3 : 0),
      ratio: 1 + (preset.compressor.ratio - 1) * scale,
    },
    limiter: {
      threshold: preset.limiter.threshold - (hot ? 0.5 : 0),
      ratio: preset.limiter.ratio * (hot ? 0.85 : 1),
    },
  };
}
