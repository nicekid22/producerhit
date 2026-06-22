import type { AppLocale } from "@/i18n/config";
import {
  getCuratedDisplayPromptPool,
  mergeUniqueDisplayPrompts,
  resolveCuratedPromptLocale,
  type AceCuratedPromptLocale,
} from "@producerhit/shared";

export type DisplayPromptMode = "beat" | "song";

export { getCuratedDisplayPromptPool, mergeUniqueDisplayPrompts, resolveCuratedPromptLocale };
export type { AceCuratedPromptLocale };

/** @deprecated Préférer getUnifiedUserPromptPool — curated seul pour compat tests. */
export function getCuratedDisplayPromptPoolForUi(uiLocale: AppLocale, mode: DisplayPromptMode): readonly string[] {
  const curatedLocale = resolveCuratedPromptLocale(uiLocale);
  return getCuratedDisplayPromptPool(curatedLocale, mode);
}
