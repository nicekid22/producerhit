import type { AppLocale } from "@/i18n/config";
import { getCuratedDisplayPromptPool } from "@/lib/randomPromptIdeas/curatedDisplayPrompts";
import type { PromptMode } from "@/lib/randomPromptIdeas";

const FULL_CURATED_LOCALES = new Set<AppLocale>(["en", "fr"]);

const rotatingPoolCache = new Map<string, readonly string[]>();

/**
 * Pools pour placeholder rotatif — curated uniquement (pas de build genre-dé à l'ouverture).
 * Le dé construit son pool ACE à la demande au clic.
 */
export function getLocaleDisplayPromptPool(locale: AppLocale, mode: PromptMode): readonly string[] {
  const cacheKey = `${locale}:${mode}`;
  const cached = rotatingPoolCache.get(cacheKey);
  if (cached) return cached;

  const pool = FULL_CURATED_LOCALES.has(locale)
    ? getCuratedDisplayPromptPool(locale, mode)
    : getCuratedDisplayPromptPool("en", mode);

  rotatingPoolCache.set(cacheKey, pool);
  return pool;
}
