import { formatAceDiceCaption } from "@/lib/randomPromptIdeas/aceDiceCaption";
export { ACE_DICE_CAPTION_MAX, formatAceDiceCaption } from "@/lib/randomPromptIdeas/aceDiceCaption";
import type { AppLocale } from "@/i18n/config";
import { CATEGORIZED_EN, CATEGORIZED_FR } from "@/lib/randomPromptIdeas/categories";
import type { CategorizedLocalePools, PromptCategory, PromptCategoryId } from "@/lib/randomPromptIdeas/categories";
import { pickFromCategory } from "@/lib/randomPromptIdeas/categories";
import { pickRandomGenreMenuDice } from "@/lib/randomPromptIdeas/genreMenuPrompts";
import { POOLS_EN } from "@/lib/randomPromptIdeas/localePools/en";
import { POOLS_FR } from "@/lib/randomPromptIdeas/localePools/fr";
import { resolvePromptPools } from "@/lib/randomPromptIdeas/localePools";

export type { PromptCategory, PromptCategoryId, CategorizedLocalePools };

export type PromptMode = "beat" | "song";

export type GenreMenuDicePick = {
  prompt: string;
  genre: string;
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

/** Hero landing typewriter — phrases courtes lisibles (marketing), pas le format dice ACE. */
export const LANDING_HERO_PROMPTS_EN = POOLS_EN.hero;
export const LANDING_HERO_PROMPTS_FR = POOLS_FR.hero;

export function getHeroPromptPool(locale: AppLocale): readonly string[] {
  return resolvePromptPools(locale).hero;
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
  return pickRandomGenreMenuDiceRoll(locale, mode).prompt;
}

/** Dice roll from full genre catalog — sets matching genre + detailed ACE prompt. */
export function pickRandomGenreMenuDiceRoll(_locale: AppLocale, mode: PromptMode): GenreMenuDicePick {
  const { genre, prompt } = pickRandomGenreMenuDice(mode);
  return { genre, prompt: formatDicePrompt(prompt, mode) };
}

export function pickNextHeroPromptIndex(pool: readonly string[], current: number): number {
  if (pool.length <= 1) return 0;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * pool.length);
  }
  return next;
}
