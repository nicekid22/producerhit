import type { LoopLength } from "@/types/loop";
import type { AppLocale } from "@/i18n/config";

/**
 * Sample Lab en standby par défaut (pas affiché sur le site).
 * Activer pour tests internes : VITE_SAMPLE_LAB=1
 */
export function isSampleLabEnabled(): boolean {
  const v = (import.meta.env.VITE_SAMPLE_LAB as string | undefined)?.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "on") return true;
  return false;
}

/** Format aligné marché Beatstars / ProducerGrind (compositions > mini loops). */
export type SampleFormatId = "composition" | "vocal_composition" | "mini_loop";

export type SampleFormat = {
  id: SampleFormatId;
  labelEn: string;
  labelFr: string;
  descriptionEn: string;
  descriptionFr: string;
  defaultDurationSec: number;
  /** Durées proposées en UI (secondes, max ACE 120). */
  durationOptions: number[];
};

export const SAMPLE_FORMATS: SampleFormat[] = [
  {
    id: "composition",
    labelEn: "Melody composition",
    labelFr: "Composition mélodique",
    descriptionEn: "~1–2 min arranged instrumental, no drums — chop & add your 808",
    descriptionFr: "~1–2 min instru arrangé, sans drums — choppe et ajoute ton 808",
    defaultDurationSec: 90,
    durationOptions: [60, 75, 90, 105, 120],
  },
  {
    id: "vocal_composition",
    labelEn: "Vocal composition",
    labelFr: "Composition vocale",
    descriptionEn: "Arrangement + pitched soul/RnB chops (RnDrill, soulful drill)",
    descriptionFr: "Arrangement + chops soul/RnB pitchés (RnDrill, soulful drill)",
    defaultDurationSec: 90,
    durationOptions: [60, 75, 90, 105, 120],
  },
  {
    id: "mini_loop",
    labelEn: "Mini loop",
    labelFr: "Mini loop",
    descriptionEn: "Short 2–16 bar phrase (FX, starters, one-shots)",
    descriptionFr: "Phrase courte 2–16 mesures (FX, starters)",
    defaultDurationSec: 0,
    durationOptions: [],
  },
];

export type SampleInstrumentId =
  | "guitar"
  | "piano"
  | "synth"
  | "bass"
  | "vocal_chops"
  | "fx"
  | "stack"
  | "drums";

export type SampleInstrument = {
  id: SampleInstrumentId;
  labelEn: string;
  labelFr: string;
  icon: string;
  aceFocus: string;
  /** Pour mini_loop uniquement ; compositions utilisent buildCompositionPrompt. */
  promptTail: string;
  /** Masquer pour compositions (drums = hors scope marché melody pack). */
  compositionAllowed: boolean;
};

export const SAMPLE_INSTRUMENTS: SampleInstrument[] = [
  {
    id: "stack",
    labelEn: "Full stack",
    labelFr: "Stack complet",
    icon: "🎚️",
    aceFocus: "full melodic stack (keys, guitar, synth layers)",
    promptTail: "",
    compositionAllowed: true,
  },
  {
    id: "guitar",
    labelEn: "Guitar",
    labelFr: "Guitare",
    icon: "🎸",
    aceFocus: "lead guitar and rhythm guitar layers",
    promptTail: "Tight guitar phrase, clear attacks.",
    compositionAllowed: true,
  },
  {
    id: "piano",
    labelEn: "Piano / Keys",
    labelFr: "Piano / Keys",
    icon: "🎹",
    aceFocus: "piano, Rhodes, and keys",
    promptTail: "Warm keys motif.",
    compositionAllowed: true,
  },
  {
    id: "synth",
    labelEn: "Synth",
    labelFr: "Synthé",
    icon: "🎛️",
    aceFocus: "synth leads, plucks, and pads",
    promptTail: "Modern synth texture.",
    compositionAllowed: true,
  },
  {
    id: "vocal_chops",
    labelEn: "Vocal chops",
    labelFr: "Vocal chops",
    icon: "🎤",
    aceFocus: "pitched and chopped vocal layers",
    promptTail: "Rhythmic vocal chops only.",
    compositionAllowed: true,
  },
  {
    id: "bass",
    labelEn: "Musical bass",
    labelFr: "Basse musicale",
    icon: "🔊",
    aceFocus: "electric or synth bass (musical, not 808 trap)",
    promptTail: "Musical bass line, not trap 808.",
    compositionAllowed: true,
  },
  {
    id: "fx",
    labelEn: "FX / texture",
    labelFr: "FX / texture",
    icon: "✨",
    aceFocus: "atmospheric FX and textures",
    promptTail: "Short texture layer.",
    compositionAllowed: false,
  },
  {
    id: "drums",
    labelEn: "Drums only",
    labelFr: "Drums seuls",
    icon: "🥁",
    aceFocus: "drum loop",
    promptTail: "Drum loop only.",
    compositionAllowed: false,
  },
];

export type SamplePackPreset = {
  id: string;
  instrument: SampleInstrumentId;
  labelEn: string;
  labelFr: string;
  style: string;
  /** Suggéré pour vocal_composition. */
  vocalComposition?: boolean;
  genres?: string[];
};

export const SAMPLE_PACK_PRESETS: SamplePackPreset[] = [
  {
    id: "guitar-drip",
    instrument: "guitar",
    labelEn: "Guitar Drip",
    labelFr: "Guitar Drip",
    style: "neo-soul electric guitar composition, muted plucks, wah, buttery tone, Frank Dukes adjacency",
  },
  {
    id: "soul-drill-vocals",
    instrument: "vocal_chops",
    labelEn: "Soul Drill Vocals",
    labelFr: "Soul Drill Vocals",
    style:
      "RnDrill aesthetic: soulful R&B vocal chops pitched and deconstructed over drill harmony, wet hooks, ambient vocal layers, no full verses",
    vocalComposition: true,
    genres: ["Drill", "Trapsoul", "R&B/Soul"],
  },
  {
    id: "rnb-stack",
    instrument: "stack",
    labelEn: "RnB Stack",
    labelFr: "RnB Stack",
    style: "full melodic stack: Rhodes chords, guitar layers, airy pads, Komorebi-style emotional drill/RnB stack without drums",
  },
  {
    id: "ovo-sessions",
    instrument: "stack",
    labelEn: "OVO Sessions",
    labelFr: "OVO Sessions",
    style: "moody Toronto R&B composition, sparse intro, wide pads, intimate keys, cinematic builds",
    genres: ["Trapsoul", "R&B/Soul"],
  },
  {
    id: "dark-trap-comp",
    instrument: "stack",
    labelEn: "Dark Trap Comp",
    labelFr: "Dark Trap Comp",
    style: "dark trap melodic composition, minor keys, bell/pluck motif, tense bridge, NO trap drums",
    genres: ["Melodic Trap", "Drill"],
  },
  {
    id: "piano-soul",
    instrument: "piano",
    labelEn: "Soul Keys",
    labelFr: "Soul Keys",
    style: "warm Rhodes chord progression composition, jazzy voicings, soulful arrangement",
  },
  {
    id: "guitar-trap",
    instrument: "guitar",
    labelEn: "Trap Guitar",
    labelFr: "Guitare trap",
    style: "dark minor guitar composition, palm-muted rhythm, Atlanta trap harmony without drums",
  },
  {
    id: "synth-pluck",
    instrument: "synth",
    labelEn: "Pluck Lab",
    labelFr: "Pluck Lab",
    style: "catchy pluck synth hook composition, glossy topline, modern melodic trap",
  },
];

export const SAMPLE_BAR_OPTIONS = [2, 4, 8, 16] as const;
export type SampleBars = (typeof SAMPLE_BAR_OPTIONS)[number];

export const SAMPLE_GENRES = [
  "Melodic Trap",
  "Trapsoul",
  "Drill",
  "R&B/Soul",
  "Lo-Fi Hip-Hop",
  "Afrobeats",
  "Neo Soul",
  "House",
  "Pop",
] as const;

export const SAMPLE_MOODS = ["Dark", "Smooth", "Energetic", "Dreamy", "Aggressive", "Nostalgic"] as const;

export const SAMPLE_KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export const SAMPLE_SCALES = ["Minor", "Major"] as const;

export function resolveSampleFormat(id: SampleFormatId): SampleFormat {
  return SAMPLE_FORMATS.find((f) => f.id === id) ?? SAMPLE_FORMATS[0]!;
}

export function barsToLoopLength(bars: number): LoopLength {
  const n = Math.max(2, Math.min(16, Math.round(bars)));
  if (n <= 2) return "2 bars";
  if (n <= 4) return "4 bars";
  if (n <= 8) return "8 bars";
  return "16 bars";
}

/** Durée ACE (10–120 s) — compositions utilisent durationSec direct. */
export function sampleBarsToDurationSec(bars: number, bpm: number, beatsPerBar = 4): number {
  const bpmSafe = Math.max(60, Math.min(200, bpm));
  const barsSafe = Math.max(2, Math.min(16, bars));
  const sec = (barsSafe * beatsPerBar * 60) / bpmSafe;
  return Math.min(120, Math.max(10, Math.round(sec)));
}

export function resolveSampleDurationSec(input: {
  format: SampleFormatId;
  durationSec?: number;
  bars: number;
  bpm: number;
}): number {
  const fmt = resolveSampleFormat(input.format);
  if (input.format === "mini_loop") {
    return sampleBarsToDurationSec(input.bars, input.bpm);
  }
  const raw = input.durationSec ?? fmt.defaultDurationSec;
  return Math.min(120, Math.max(60, Math.round(raw)));
}

export type SampleLabGenerateInput = {
  format: SampleFormatId;
  instrument: SampleInstrumentId;
  packPresetId?: string | null;
  genre: string;
  mood: string;
  bars: SampleBars;
  bpm: number;
  key: string;
  scale: string;
  durationSec?: number;
};

export function resolveSamplePack(id: string | null | undefined): SamplePackPreset | null {
  if (!id) return null;
  return SAMPLE_PACK_PRESETS.find((p) => p.id === id) ?? null;
}

export function resolveSampleInstrument(id: SampleInstrumentId): SampleInstrument {
  return SAMPLE_INSTRUMENTS.find((i) => i.id === id) ?? SAMPLE_INSTRUMENTS[0]!;
}

const NO_DRUMS_BLOCK = [
  "CRITICAL: absolutely NO drums, NO kick, NO snare, NO clap, NO hi-hats, NO percussion loop, NO 808, NO trap drum programming, NO beat drop drums.",
  "ZERO drum elements in the output audio — melodic instruments and vocal chops only.",
  "This is a melody/sample pack composition for beatmakers who will add their own drums and 808 in the DAW.",
].join(" ");

const ARRANGEMENT_BLOCK = [
  "Arranged like a premium Beatstars / ProducerGrind melody composition (not a random loop).",
  "Clear song sections with dynamics: short intro (sparse) → verse A → pre-chorus build → chorus hook (fullest, most memorable) → verse B (variation) → bridge (new harmonic color) → final chorus → brief outro.",
  "Professional mix, finished 'sample pack' feel — easy to chop by section because BPM and key stay locked.",
].join(" ");

function buildVocalCompositionBlock(genre: string, pack: SamplePackPreset | null): string {
  const drillish = /drill|trap|rnb|soul/i.test(genre) || pack?.vocalComposition;
  if (drillish) {
    return [
      "Include deconstructed soul/RnB vocal chops: pitched, resampled, rhythmic stabs and hook phrases (RnDrill / soulful drill style).",
      "No intelligible full verses, no rap verses, no conversational singing — only texture, hooks, and chops.",
      "Vocals sit WITH the melodic arrangement as layers, not as a standalone acapella song.",
    ].join(" ");
  }
  return [
    "Include tasteful vocal chop layers and hook textures (pitched, reversed, stuttered) — no full sung verses.",
  ].join(" ");
}

export function buildSampleLabCaption(input: SampleLabGenerateInput): string {
  const inst = resolveSampleInstrument(input.instrument);
  const pack = resolveSamplePack(input.packPresetId);
  const duration = resolveSampleDurationSec({
    format: input.format,
    durationSec: input.durationSec,
    bars: input.bars,
    bpm: input.bpm,
  });

  if (input.format === "mini_loop") {
    const parts = [
      `ProducerHit mini sample — ${inst.aceFocus}.`,
      `${input.bars} bars at ${input.bpm} BPM, key ${input.key} ${input.scale}.`,
      pack ? `Style: ${pack.style}.` : inst.promptTail,
      `Genre: ${input.genre}. Mood: ${input.mood}.`,
      NO_DRUMS_BLOCK,
      "Tight loopable phrase for chopping.",
    ];
    return parts.filter(Boolean).join(" ");
  }

  const vocalBlock =
    input.format === "vocal_composition" ? buildVocalCompositionBlock(input.genre, pack) : "";

  const instrumentFocus =
    input.instrument === "stack"
      ? "Full melodic stack: keys, guitar or pluck, synth pads, optional musical bass (not 808)."
      : `Featured focus: ${inst.aceFocus}. Supporting layers allowed but arrangement stays coherent.`;

  const parts = [
    "ProducerHit AI sample pack — melody composition for beatmakers (WAV-ready).",
    `${duration} seconds at ${input.bpm} BPM, key ${input.key} ${input.scale}.`,
    pack ? `Pack vibe: ${pack.style}.` : instrumentFocus,
    `Genre: ${input.genre}. Mood: ${input.mood}.`,
    ARRANGEMENT_BLOCK,
    NO_DRUMS_BLOCK,
    vocalBlock,
    "Sounds like a finished instrumental sample — beatmaker will slice in FL Studio / Ableton and add their own drums.",
    "Studio-quality, wide but controlled mix, no long silence at start or end.",
  ];
  return parts.filter(Boolean).join(" ");
}

/** Nom fichier style ProducerGrind : « Guitar Drip 140 BPM Amin » */
export function buildSampleLoopName(input: SampleLabGenerateInput, locale: AppLocale): string {
  const pack = resolveSamplePack(input.packPresetId);
  const inst = resolveSampleInstrument(input.instrument);
  const base = pack ? (locale === "fr" ? pack.labelFr : pack.labelEn) : locale === "fr" ? inst.labelFr : inst.labelEn;
  const keyTag = `${input.key}${input.scale === "Minor" ? "min" : "maj"}`;
  if (input.format === "mini_loop") {
    return `${base} · ${input.bars}b · ${input.bpm} BPM ${keyTag}`;
  }
  const dur = resolveSampleDurationSec({
    format: input.format,
    durationSec: input.durationSec,
    bars: input.bars,
    bpm: input.bpm,
  });
  return `${base} ${input.bpm} BPM ${keyTag} · ${dur}s`;
}

export function compositionInstrumentsForUi(): SampleInstrument[] {
  return SAMPLE_INSTRUMENTS.filter((i) => i.compositionAllowed);
}
