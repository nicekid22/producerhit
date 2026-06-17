const STORAGE_KEY = "producerhit_pending_generation";

export type PendingGeneration = {
  mode?: "beat" | "song";
  engine?: "sonauto" | "ace-step";
  form?: Partial<{
    genre: string;
    influence: string;
    key: string;
    scale: string;
    bpm: number;
    loopLength: string;
    swing: number;
    mood: string;
    energyLevel: string;
    reverb: string;
    prompt: string;
  }>;
  lyricsMode?: "ai" | "manual";
  lyrics?: string;
  songUiMode?: "simple" | "custom";
  genrePickMode?: string;
  songDescription?: string;
  songVocalStyle?: string;
};

export function readPendingGeneration(): PendingGeneration | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingGeneration;
  } catch {
    return null;
  }
}

export function pendingGenerationSummary(pending: PendingGeneration, isFr: boolean): string | null {
  const modeLabel =
    pending.mode === "song"
      ? isFr
        ? "chanson"
        : "song"
      : pending.mode === "beat"
        ? isFr
          ? "beat"
          : "beat"
        : null;
  const genre = pending.form?.genre?.trim();
  const prompt = pending.form?.prompt?.trim() || pending.songDescription?.trim();
  if (modeLabel && genre) {
    return isFr ? `${modeLabel} · ${genre}` : `${modeLabel} · ${genre}`;
  }
  if (modeLabel && prompt) {
    const short = prompt.length > 48 ? `${prompt.slice(0, 45)}…` : prompt;
    return `${modeLabel} · ${short}`;
  }
  if (modeLabel) return modeLabel;
  if (prompt) return prompt.length > 56 ? `${prompt.slice(0, 53)}…` : prompt;
  return null;
}
