import type { AceCuratedPromptLocale } from "../../curatedPromptLocale";
import type { LocalePromptPools } from "../../localePools/types";
import { CURATED_V2_AR } from "./ar";
import { CURATED_V2_DE } from "./de";
import { CURATED_V2_EN } from "./en";
import { CURATED_V2_ES } from "./es";
import { CURATED_V2_FR } from "./fr";
import { CURATED_V2_IT } from "./it";
import { CURATED_V2_JA } from "./ja";
import { CURATED_V2_KO } from "./ko";
import { CURATED_V2_PT } from "./pt";
import { CURATED_V2_ZH } from "./zh";

export type CuratedV2Mode = "beat" | "song";

const V2_BY_LOCALE: Record<AceCuratedPromptLocale, LocalePromptPools> = {
  en: CURATED_V2_EN,
  fr: CURATED_V2_FR,
  es: CURATED_V2_ES,
  pt: CURATED_V2_PT,
  de: CURATED_V2_DE,
  it: CURATED_V2_IT,
  ja: CURATED_V2_JA,
  ko: CURATED_V2_KO,
  zh: CURATED_V2_ZH,
  ar: CURATED_V2_AR,
};

export function getCuratedV2DisplayPromptPool(locale: AceCuratedPromptLocale, mode: CuratedV2Mode): readonly string[] {
  return V2_BY_LOCALE[locale][mode];
}

export { CURATED_V2_EN, CURATED_V2_FR };
