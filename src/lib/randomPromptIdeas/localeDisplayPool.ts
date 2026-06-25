import type { AppLocale } from "@/i18n/config";
import { getRotatingPlaceholderPool } from "@producerhit/shared";
import type { PromptMode } from "@/lib/randomPromptIdeas";

const rotatingPoolCache = new Map<string, readonly string[]>();

/** Placeholder rotatif — exemples curated (jamais soumis à la génération). */
export function getLocaleDisplayPromptPool(locale: AppLocale, mode: PromptMode): readonly string[] {
  const cacheKey = `${locale}:${mode}`;
  const cached = rotatingPoolCache.get(cacheKey);
  if (cached) return cached;

  const pool = getRotatingPlaceholderPool(locale, mode);
  rotatingPoolCache.set(cacheKey, pool);
  return pool;
}
