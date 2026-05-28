export type LoopLength = "2 bars" | "4 bars" | "8 bars" | "16 bars";

export type LoopDetails = {
  caption?: string;
  lyrics?: string;
  bpm?: number | null;
  duration?: number | null;
  keyScale?: string;
  timeSignature?: string;
  audioFormat?: string;
  /** Frozen at generation time — Pollinations cover must not follow prompt edits. */
  coverPrompt?: string;
};

export type Loop = {
  id: string;
  userId?: string;
  engine?: string;
  name: string;
  genre: string;
  influence: string;
  key: string;
  scale: string;
  bpm: number;
  loopLength: LoopLength;
  swing: number;
  mood: string;
  energyLevel: string;
  reverb: string;
  prompt: string;
  audioUrl: string | null;
  seed?: number | null;
  details?: LoopDetails | null;
  stemsUrl?: Record<string, unknown> | null;
  isSaved: boolean;
  isPublic: boolean;
  createdAt: string;
};

export type GeneratorForm = {
  genre: string;
  influence: string;
  key: string;
  scale: string;
  bpm: number;
  loopLength: LoopLength;
  swing: number;
  energyLevel: string;
  mood: string;
  reverb: string;
  prompt: string;
};

