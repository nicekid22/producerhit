export type PendingRemix = {
  sourceLoopId: string;
  sourceLoopName: string;
  audioUrl: string;
  prompt: string;
  genre?: string;
  mood?: string;
  bpm?: number;
  source: "community" | "public_loop";
};

const STORAGE_KEY = "producerhit_pending_remix";

export function savePendingRemix(data: PendingRemix): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    void 0;
  }
}

export function loadPendingRemix(): PendingRemix | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingRemix>;
    if (!parsed.audioUrl || !parsed.sourceLoopId) return null;
    return {
      sourceLoopId: String(parsed.sourceLoopId),
      sourceLoopName: String(parsed.sourceLoopName || "Track"),
      audioUrl: String(parsed.audioUrl),
      prompt: String(parsed.prompt || ""),
      genre: parsed.genre ? String(parsed.genre) : undefined,
      mood: parsed.mood ? String(parsed.mood) : undefined,
      bpm: typeof parsed.bpm === "number" ? parsed.bpm : undefined,
      source: parsed.source === "public_loop" ? "public_loop" : "community",
    };
  } catch {
    return null;
  }
}

export function clearPendingRemix(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    void 0;
  }
}

export function buildRemixPromptFromMeta(args: { prompt?: string; genre?: string; mood?: string; locale: "en" | "fr" }): string {
  const existing = (args.prompt || "").trim();
  if (existing) return existing;
  const genre = (args.genre || "").trim();
  const mood = (args.mood || "").trim();
  if (args.locale === "fr") {
    if (genre && mood) return `${genre} remix ${mood}, vibe moderne 2026, mix pro streaming`;
    if (genre) return `${genre} remix moderne, même énergie mais relooké, fini pro`;
    return "Remix dreamy moderne, atmosphère late-night, mix pro streaming";
  }
  if (genre && mood) return `${genre} ${mood} remix, modern 2026 vibe, pro streaming mix`;
  if (genre) return `Modern ${genre} remix, same energy refreshed, pro mix`;
  return "Modern dreamy remix, late-night atmosphere, pro streaming mix";
}
