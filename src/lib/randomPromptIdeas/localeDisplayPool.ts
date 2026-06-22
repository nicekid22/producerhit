import type { AppLocale } from "@/i18n/config";
import { mergeUniqueDisplayPrompts } from "@/lib/randomPromptIdeas/curatedDisplayPrompts";
import { getCuratedDisplayPromptPool } from "@/lib/randomPromptIdeas/curatedDisplayPrompts";
import { getGenreDiceDisplayPromptPool } from "@/lib/randomPromptIdeas/genreMenuPrompts";
import { resolvePromptPools } from "@/lib/randomPromptIdeas/localePools";
import type { PromptMode } from "@/lib/randomPromptIdeas";

const FULL_CURATED_LOCALES = new Set<AppLocale>(["en", "fr"]);

const HERO_DISPLAY_LOCALES = new Set<AppLocale>(["ar", "ja", "ko", "tr", "hi", "zh", "th"]);

/** Phrases lisibles pour placeholder + dé (hors tags ACE techniques). */
export function getLocaleDisplayPromptPool(locale: AppLocale, mode: PromptMode): readonly string[] {
  if (FULL_CURATED_LOCALES.has(locale)) {
    return getCuratedDisplayPromptPool(locale, mode);
  }

  const pools = resolvePromptPools(locale);
  if (HERO_DISPLAY_LOCALES.has(locale)) {
    return pools.hero;
  }

  const fromDice = getGenreDiceDisplayPromptPool(mode, locale);
  return mergeUniqueDisplayPrompts(pools.hero, fromDice);
}
