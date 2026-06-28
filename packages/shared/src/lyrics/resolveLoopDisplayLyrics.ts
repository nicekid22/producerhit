import {
  looksLikeSingableLyrics,
  resolveAceLyricsForMeta,
} from "../generation/aceLyricsApi";

export type LoopLyricsSource = {
  prompt?: string;
  details?: { lyrics?: string; caption?: string } | null;
  stemsUrl?: Record<string, unknown> | null;
};

function readAce(stemsUrl: unknown): Record<string, unknown> | null {
  if (!stemsUrl || typeof stemsUrl !== "object") return null;
  const ace = (stemsUrl as Record<string, unknown>).ace;
  return ace && typeof ace === "object" ? (ace as Record<string, unknown>) : null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isInstrumentalMarker(text: string): boolean {
  const t = text.trim();
  return !t || /^instrumental$/i.test(t) || t === "[instrumental]" || t === "[Instrumental]";
}

/** Paroles affichables dans l’onglet « Paroles » (details, stems ace, filtres ACE). */
export function resolveLoopDisplayLyrics(loop: LoopLyricsSource): string {
  const ace = readAce(loop.stemsUrl);

  const userLyrics = readString(ace?.userLyrics);
  const parsedRaw =
    readString(ace?.parsedLyrics) ||
    readString(ace?.lyrics) ||
    readString(loop.details?.lyrics);

  const caption =
    readString(loop.details?.caption) ||
    readString(ace?.caption) ||
    readString(loop.prompt);

  const resolved = resolveAceLyricsForMeta({
    parsedLyrics: parsedRaw,
    userLyrics,
    caption,
    parsedPrompt: loop.prompt,
  });
  if (resolved) return resolved;

  if (parsedRaw && !isInstrumentalMarker(parsedRaw) && looksLikeSingableLyrics(parsedRaw)) {
    return parsedRaw;
  }

  return "";
}
