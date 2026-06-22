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
};

export type GenerateBeatResult = {
  audioUrl: string;
  engine: string;
  meta?: AceMeta | null;
};
