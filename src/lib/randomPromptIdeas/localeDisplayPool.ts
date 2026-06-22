import type { AppLocale } from "@/i18n/config";
import { getUnifiedUserPromptPool } from "@/lib/randomPromptIdeas/unifiedDisplayPool";
import type { PromptMode } from "@/lib/randomPromptIdeas";

const rotatingPoolCache = new Map<string, readonly string[]>();

/** Placeholder rotatif — pool unifié (curated traduit + display dé). */
export function getLocaleDisplayPromptPool(locale: AppLocale, mode: PromptMode): readonly string[] {
  const cacheKey = `${locale}:${mode}`;
  const cached = rotatingPoolCache.get(cacheKey);
  if (cached) return cached;

  const pool = getUnifiedUserPromptPool(locale, mode);
  rotatingPoolCache.set(cacheKey, pool);
  return pool;
}
