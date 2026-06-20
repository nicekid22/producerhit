import { formatAceDiceCaption } from "@/lib/randomPromptIdeas/aceDiceCaption";
export { ACE_DICE_CAPTION_MAX, formatAceDiceCaption } from "@/lib/randomPromptIdeas/aceDiceCaption";
import type { AppLocale } from "@/i18n/config";
import { CATEGORIZED_EN, CATEGORIZED_FR } from "@/lib/randomPromptIdeas/categories";
import type { CategorizedLocalePools, PromptCategory, PromptCategoryId } from "@/lib/randomPromptIdeas/categories";
import { pickFromCategory } from "@/lib/randomPromptIdeas/categories";
import { getGenreDiceDisplayPromptPool, pickRandomGenreMenuDice } from "@/lib/randomPromptIdeas/genreMenuPrompts";
import { POOLS_EN } from "@/lib/randomPromptIdeas/localePools/en";
import { POOLS_FR } from "@/lib/randomPromptIdeas/localePools/fr";
import { resolvePromptPools } from "@/lib/randomPromptIdeas/localePools";

export type { PromptCategory, PromptCategoryId, CategorizedLocalePools };

export type PromptMode = "beat" | "song";

export type GenreMenuDicePick = {
  /** Phrase simple affichée dans le champ idée. */
  displayPrompt: string;
  /** Prompt ACE complet envoyé à l'API à la génération. */
  acePrompt: string;
  genre: string;
  /** @deprecated Utiliser displayPrompt */
  prompt: string;
};

/**
 * ACE Step 1.5 XL Turbo — random dice captions.
 *
 * Official ACE 1.5 guidance (caption / tags field):
 * - Comma-separated keywords (≈5–12), not Suno-style prose
 * - Genre or subgenre first, then mood, 2–3 named instruments, timbre, production
 * - Specific instruments beat adjectives ("rhodes piano" > "sad")
 * - Avoid BPM/key here — ProducerHit sends those via autoMeta params
 * - Avoid "instrumental / no vocals" on beats — buildAceCaption adds them
 * - No conflicting pairs (lo-fi + hi-fi, aggressive + serene)
 *
 * Genre-menu dice prompts are longer (testing / catalog coverage).
 */

/** Hero landing typewriter — phrases courtes lisibles (alignées sur le dé). */
export const LANDING_HERO_PROMPTS_EN = POOLS_EN.hero;
export const LANDING_HERO_PROMPTS_FR = POOLS_FR.hero;

const LANDING_DISPLAY_FALLBACK_EN: Record<PromptMode, readonly string[]> = {
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

const LANDING_DISPLAY_FALLBACK_FR: Record<PromptMode, readonly string[]> = {
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

function landingDisplayFallback(locale: AppLocale, mode: PromptMode): readonly string[] {
  if (locale === "fr") return LANDING_DISPLAY_FALLBACK_FR[mode];
  return LANDING_DISPLAY_FALLBACK_EN[mode];
}

/** Placeholders landing + hero — phrases simples (pas tags ACE). */
export function getLandingDisplayPromptPool(locale: AppLocale, mode: PromptMode): readonly string[] {
  const fromDice = getGenreDiceDisplayPromptPool(mode, locale);
  if (fromDice.length >= 8) return fromDice;
  const hero = resolvePromptPools(locale).hero;
  if (mode === "song" && hero.length > 0) return hero;
  return landingDisplayFallback(locale, mode);
}

export function getHeroPromptPool(locale: AppLocale): readonly string[] {
  return getLandingDisplayPromptPool(locale, "song");
}

export function getRandomPromptPool(locale: AppLocale, mode: PromptMode): readonly string[] {
  const pools = resolvePromptPools(locale);
  return mode === "song" ? pools.song : pools.beat;
}

/** Pools catégorisés (FR/EN complets ; autres locales = fallback EN via resolvePromptPools). */
export function getCategorizedPromptPools(locale: AppLocale): CategorizedLocalePools | null {
  if (locale === "fr") return CATEGORIZED_FR;
  if (locale === "en") return CATEGORIZED_EN;
  return null;
}

export function getPromptCategories(locale: AppLocale, mode: PromptMode): readonly PromptCategory[] {
  const categorized = getCategorizedPromptPools(locale);
  if (!categorized) return [];
  return mode === "song" ? categorized.song : categorized.beat;
}

export function pickRandomPromptFromCategory(
  locale: AppLocale,
  mode: PromptMode,
  categoryId: PromptCategoryId,
): string {
  const categorized = getCategorizedPromptPools(locale);
  if (!categorized) {
    return pickRandomPrompt(locale, mode);
  }
  const raw = pickFromCategory(categorized, mode, categoryId);
  if (!raw) return pickRandomPrompt(locale, mode);
  return formatDicePrompt(raw, mode);
}

export function formatDicePrompt(raw: string, mode: PromptMode): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const isNatural =
    /^(fais|une chanson|un son|tu peux|peux-tu|j'ai besoin|chanson sur|make me|can you|i need|song about|a song)/i.test(
      trimmed,
    );
  if (mode === "song" && isNatural) {
    return trimmed.length <= 200 ? trimmed : trimmed.slice(0, 200).replace(/\s+\S*$/, "").trim();
  }
  return formatAceDiceCaption(trimmed);
}

export function pickRandomPrompt(locale: AppLocale, mode: PromptMode): string {
  return pickRandomGenreMenuDiceRoll(locale, mode).displayPrompt;
}

/** Dice roll from full genre catalog — sets matching genre + display + ACE prompt. */
export function pickRandomGenreMenuDiceRoll(locale: AppLocale, mode: PromptMode): GenreMenuDicePick {
  const { genre, acePrompt, displayPrompt } = pickRandomGenreMenuDice(mode, locale);
  const ace = formatDicePrompt(acePrompt, mode);
  return { genre, displayPrompt, acePrompt: ace, prompt: displayPrompt };
}

export function pickNextHeroPromptIndex(pool: readonly string[], current: number): number {
  if (pool.length <= 1) return 0;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * pool.length);
  }
  return next;
}
