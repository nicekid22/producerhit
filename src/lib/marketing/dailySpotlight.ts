import type { AppLocale } from "@/i18n/config";
import { getCuratedDisplayPromptPool } from "@/lib/randomPromptIdeas/curatedDisplayPrompts";
import type { PublicLoopRow } from "@/lib/publicLoops";
import { hashString } from "@/lib/utils";

/** Clé jour UTC stable — même beat/prompt pour tous les visiteurs ce jour-là. */
export function dailySpotlightKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function pickIndex(seed: string, length: number): number {
  if (length <= 0) return 0;
  return hashString(seed) % length;
}

export function pickDailyPrompt(locale: AppLocale, mode: "beat" | "song" = "beat", dayKey = dailySpotlightKey()): string {
  const pool = getCuratedDisplayPromptPool(locale, mode);
  if (!pool.length) return mode === "song" ? "Melodic trap song with raw emotion" : "Dark trap type beat, 140 BPM";
  return pool[pickIndex(`${dayKey}:prompt:${mode}:${locale}`, pool.length)] ?? pool[0]!;
}

export function pickDailyBeat(loops: PublicLoopRow[], dayKey = dailySpotlightKey()): PublicLoopRow | null {
  const playable = loops.filter((l) => typeof l.audio_url === "string" && l.audio_url.trim().length > 0);
  if (!playable.length) return null;
  return playable[pickIndex(`${dayKey}:beat`, playable.length)] ?? playable[0]!;
}
