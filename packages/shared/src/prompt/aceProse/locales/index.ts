import type { AppLocale } from "../../../i18n/locales";
import {
  ACE_CURATED_PROMPT_LOCALES,
  resolveCuratedPromptLocale,
  type AceCuratedPromptLocale,
} from "../../curatedPromptLocale";
import { AR_ACE_PROSE_LEXICON } from "./ar";
import { DE_ACE_PROSE_LEXICON } from "./de";
import { EN_ACE_PROSE_LEXICON } from "./en";
import { ES_ACE_PROSE_LEXICON } from "./es";
import { FR_ACE_PROSE_LEXICON } from "./fr";
import { IT_ACE_PROSE_LEXICON } from "./it";
import { JA_ACE_PROSE_LEXICON } from "./ja";
import { KO_ACE_PROSE_LEXICON } from "./ko";
import { PT_ACE_PROSE_LEXICON } from "./pt";
import type { AceProseLocale, AceProseLocaleLexicon } from "./types";
import { ZH_ACE_PROSE_LEXICON } from "./zh";

export type { AceProseLocale, AceProseLocaleLexicon };

const LEXICON_BY_LOCALE: Record<AceProseLocale, AceProseLocaleLexicon> = {
  en: EN_ACE_PROSE_LEXICON,
  fr: FR_ACE_PROSE_LEXICON,
  es: ES_ACE_PROSE_LEXICON,
  pt: PT_ACE_PROSE_LEXICON,
  de: DE_ACE_PROSE_LEXICON,
  it: IT_ACE_PROSE_LEXICON,
  ja: JA_ACE_PROSE_LEXICON,
  ko: KO_ACE_PROSE_LEXICON,
  zh: ZH_ACE_PROSE_LEXICON,
  ar: AR_ACE_PROSE_LEXICON,
};

/** Aligné curated / dé — nl, tr, hi, th → en. */
export function resolveAceProseLocale(uiLocale: AppLocale): AceProseLocale {
  return resolveCuratedPromptLocale(uiLocale);
}

export function getAceProseLexicon(locale: AceProseLocale): AceProseLocaleLexicon {
  return LEXICON_BY_LOCALE[locale] ?? EN_ACE_PROSE_LEXICON;
}

export function listAceProseLocales(): readonly AceProseLocale[] {
  return ACE_CURATED_PROMPT_LOCALES;
}

/** Seed de base par locale pour pools curated déterministes. */
export const ACE_PROSE_LOCALE_SEEDS: Record<AceProseLocale, number> = {
  en: 42,
  fr: 4200,
  es: 8400,
  pt: 12600,
  de: 16800,
  it: 21000,
  ja: 25200,
  ko: 29400,
  zh: 33600,
  ar: 37800,
};
