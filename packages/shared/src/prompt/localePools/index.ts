import type { AppLocale } from "../../i18n/locales";
import { UI_LOCALES } from "../../i18n/locales";
import type { LocalePromptPools } from "./types";
import { POOLS_AR } from "./ar";
import { POOLS_DE } from "./de";
import { POOLS_EN, POOLS_FR } from "./pools-en-fr";
import { POOLS_ES } from "./es";
import { POOLS_HI } from "./hi";
import { POOLS_IT } from "./it";
import { POOLS_JA } from "./ja";
import { POOLS_KO } from "./ko";
import { POOLS_NL } from "./nl";
import { POOLS_PT } from "./pt";
import { POOLS_TH } from "./th";
import { POOLS_TR } from "./tr";
import { POOLS_ZH } from "./zh";

export const LOCALE_PROMPT_POOLS: Record<AppLocale, LocalePromptPools> = {
  en: POOLS_EN,
  fr: POOLS_FR,
  es: POOLS_ES,
  pt: POOLS_PT,
  de: POOLS_DE,
  it: POOLS_IT,
  nl: POOLS_NL,
  ar: POOLS_AR,
  ja: POOLS_JA,
  ko: POOLS_KO,
  tr: POOLS_TR,
  hi: POOLS_HI,
  zh: POOLS_ZH,
  th: POOLS_TH,
};

export function resolvePromptPools(locale: AppLocale): LocalePromptPools {
  return LOCALE_PROMPT_POOLS[locale] ?? LOCALE_PROMPT_POOLS.en;
}

export function allDiceLocales(): readonly AppLocale[] {
  return UI_LOCALES;
}

export type { LocalePromptPools } from "./types";
