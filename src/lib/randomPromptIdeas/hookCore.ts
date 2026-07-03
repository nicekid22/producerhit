import type { AppLocale } from "@/i18n/config";
import { shuffleArray } from "@/lib/utils";
import { getLocaleDisplayPromptPool, type PromptMode } from "@/lib/randomPromptIdeas/localeDisplayPool";
import { mergeUniqueDisplayPrompts } from "@/lib/randomPromptIdeas/curatedDisplayPrompts";

export type { PromptMode };

const FALLBACK_EN: Record<PromptMode, readonly string[]> = {
  song: [
    "A pop song about starting over",
    "An R&B song about a heartbreak night",
    "A melodic trap song about a rainy late-night drive",
    "An afrobeats song about a festival sunset",
  ],
  beat: [
    "A melodic trap beat about a rainy late-night drive",
    "An R&B beat about a heartbreak night",
    "A drill beat about street confidence",
    "A house beat about a summer terrace",
  ],
};

const FALLBACK_FR: Record<PromptMode, readonly string[]> = {
  song: [
    "Une chanson pop sur un nouveau départ",
    "Une chanson R&B sur un cœur brisé nocturne",
    "Une chanson melodic trap sur une nuit pluvieuse",
    "Une chanson afrobeats sur un sunset en festival",
  ],
  beat: [
    "Un beat trap sur une nuit pluvieuse",
    "Un beat R&B sur un cœur brisé nocturne",
    "Un beat drill sur la confiance en rue",
    "Un beat house sur une vibe terrace d'été",
  ],
};

function getLandingDisplayPromptPool(locale: AppLocale, mode: PromptMode): readonly string[] {
  const curated = getLocaleDisplayPromptPool(locale, mode);
  if (curated.length >= 8) return curated;
  const fallback = locale === "fr" ? FALLBACK_FR[mode] : FALLBACK_EN[mode];
  return mergeUniqueDisplayPrompts(curated, fallback);
}

/** Pool mélangé + index de départ aléatoire — lightweight version for the hook. */
export function prepareRotatingPromptPlaceholders(
  locale: AppLocale,
  mode: PromptMode,
): { pool: string[]; startIndex: number } {
  const pool = shuffleArray(getLandingDisplayPromptPool(locale, mode));
  return {
    pool,
    startIndex: pool.length <= 1 ? 0 : Math.floor(Math.random() * pool.length),
  };
}

export function pickNextHeroPromptIndex(pool: readonly string[], current: number): number {
  if (pool.length <= 1) return 0;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * pool.length);
  }
  return next;
}
