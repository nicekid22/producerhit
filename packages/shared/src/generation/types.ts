export type GenerateParams = {
  genre: string;
  influence: string;
  key: string;
  scale: string;
  bpm: number;
  loopLengthBars: number;
  swing?: number;
  mood: string;
  energyLevel: string;
  reverb: string;
  prompt?: string;
};

export type AceMeta = {
  taskId?: string;
  task_id?: string;
  sessionOnly?: boolean;
  aceKeyIndex?: number;
  aceKeyCount?: number;
  providerDataUrl?: string;
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
  voiceClone?: boolean;
  voiceCloneFallback?: boolean;
  voiceCloneRequested?: boolean;
  voiceProfileId?: string;
  voiceProfileName?: string;
  voiceCloneStrength?: number;
  engine?: string;
};

export type GenerationJobStatus = "pending" | "running" | "completed" | "failed";

export type GenerationJobResult = {
  audioUrl: string;
  meta?: AceMeta | null;
  jobId: string;
};

/** ACE-Step model quality tiers */
export type AceModelQuality = "turbo" | "base" | "sft";

export const ACE_MODEL_QUALITY_LABELS: Record<AceModelQuality, { label: string; description: string }> = {
  turbo: { label: "Turbo", description: "Fastest — lower quality" },
  base: { label: "Medium", description: "Balanced — good quality/speed" },
  sft: { label: "High", description: "Best quality — slower" },
} as const;

export const ACE_MODEL_BY_QUALITY: Record<AceModelQuality, string> = {
  turbo: "acestep-v15-xl-turbo",
  base: "acestep-v15-xl-base",
  sft: "acestep-v15-xl-sft",
} as const;

/** Default quality tier (Medium = base model) */
export const DEFAULT_ACE_MODEL_QUALITY: AceModelQuality = "base";

export function getAceModelForQuality(quality: AceModelQuality): string {
  return ACE_MODEL_BY_QUALITY[quality] ?? ACE_MODEL_BY_QUALITY.base;
}

export function getAceModelQualityLabel(quality: AceModelQuality): string {
  return ACE_MODEL_QUALITY_LABELS[quality].label;
}

export function getAceModelQualityDescription(quality: AceModelQuality): string {
  return ACE_MODEL_QUALITY_LABELS[quality].description;
}

export type GenerateLoopAceOptions = {
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
  requirePersistableUrl?: boolean;
  captionOverride?: string;
  melodyComposition?: boolean;
  voiceProfileId?: string;
  voiceCloneStrength?: number;
  vocalStyle?: string;
  /** Model quality tier: "turbo" | "base" | "sft" (default: "base") */
  modelQuality?: AceModelQuality;
};

export type GenerateBeatResult = {
  audioUrl: string;
  engine: string;
  meta?: AceMeta | null;
};
