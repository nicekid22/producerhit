import type { AppLocale } from "@/i18n/config";
import { mergeUniqueDisplayPrompts, getCuratedDisplayPromptPool } from "@/lib/randomPromptIdeas/curatedDisplayPrompts";
import { getGenreDiceDisplayPromptPool } from "@/lib/randomPromptIdeas/genreMenuPrompts";
import type { PromptMode } from "@/lib/randomPromptIdeas";

const FULL_CURATED_LOCALES = new Set<AppLocale>(["en", "fr"]);

/**
 * Pools affichés (placeholder + dé) :
 * - EN/FR : curated complet + genre-dé
 * - Autres langues UI : curated EN (drôle, actu, etc.) + genre-dé EN avec thème localisé
 */
export function getLocaleDisplayPromptPool(locale: AppLocale, mode: PromptMode): readonly string[] {
  if (FULL_CURATED_LOCALES.has(locale)) {
    return getCuratedDisplayPromptPool(locale, mode);
  }

  const curatedEn = getCuratedDisplayPromptPool("en", mode);
  const fromDice = getGenreDiceDisplayPromptPool(mode, locale);
  return mergeUniqueDisplayPrompts(curatedEn, fromDice);
}
