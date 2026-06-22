import type { AppLocale } from "../i18n/locales";
import { uiLocaleToAceVocalLanguage } from "../vocalLanguage";

/** Langues avec pools curated traduits (aligné VOCAL_LANGUAGES ACE, hors ru seul). */
export const ACE_CURATED_PROMPT_LOCALES = [
  "en",
  "fr",
  "es",
  "pt",
  "de",
  "it",
  "ja",
  "ko",
  "zh",
  "ar",
] as const;

export type AceCuratedPromptLocale = (typeof ACE_CURATED_PROMPT_LOCALES)[number];

const CURATED_SET = new Set<string>(ACE_CURATED_PROMPT_LOCALES);

/**
 * Locale des prompts lisibles (placeholder + dé) selon la langue ACE de l'utilisateur.
 * nl / tr / hi / th → en (pas de voix ACE dédiée).
 */
export function resolveCuratedPromptLocale(uiLocale: AppLocale): AceCuratedPromptLocale {
  const ace = uiLocaleToAceVocalLanguage(uiLocale);
  if (CURATED_SET.has(ace)) return ace as AceCuratedPromptLocale;
  return "en";
}
