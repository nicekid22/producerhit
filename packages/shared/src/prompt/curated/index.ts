import type { AceCuratedPromptLocale } from "../curatedPromptLocale";
import { resolveCuratedPromptLocale, ACE_CURATED_PROMPT_LOCALES } from "../curatedPromptLocale";
export { resolveCuratedPromptLocale, ACE_CURATED_PROMPT_LOCALES, type AceCuratedPromptLocale };
import { CURATED_AR } from "./ar";
import { CURATED_DE } from "./de";
import { CURATED_EN, CURATED_FR } from "./en-fr";
import { CURATED_ES } from "./es";
import { CURATED_IT } from "./it";
import { CURATED_JA } from "./ja";
import { CURATED_KO } from "./ko";
import { CURATED_PT } from "./pt";
import { CURATED_ZH } from "./zh";
import { getCuratedV2DisplayPromptPool } from "./v2";

export type CuratedDisplayMode = "beat" | "song";

const CURATED_BY_LOCALE: Record<AceCuratedPromptLocale, { song: readonly string[]; beat: readonly string[] }> = {
  en: CURATED_EN,
  fr: CURATED_FR,
  es: CURATED_ES,
  pt: CURATED_PT,
  de: CURATED_DE,
  it: CURATED_IT,
  ja: CURATED_JA,
  ko: CURATED_KO,
  zh: CURATED_ZH,
  ar: CURATED_AR,
};

export function getCuratedDisplayPromptPool(locale: AceCuratedPromptLocale, mode: CuratedDisplayMode): readonly string[] {
  const v1 = CURATED_BY_LOCALE[locale][mode];
  const v2 = getCuratedV2DisplayPromptPool(locale, mode);
  return mergeUniqueDisplayPrompts(v1, v2);
}

export function mergeUniqueDisplayPrompts(...pools: readonly (readonly string[])[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const pool of pools) {
    for (const raw of pool) {
      const p = raw.trim();
      const key = p.toLowerCase();
      if (!p || seen.has(key)) continue;
      seen.add(key);
      out.push(p);
    }
  }
  return out;
}
