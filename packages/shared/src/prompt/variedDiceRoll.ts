import type { AppLocale } from "../i18n/locales";
import { pickRandomGenreValue } from "../genres/genrePickMode";
import { getAceProseCuratedPool, looksLikeAceProsePrompt, optimizeAceProsePrompt } from "./aceProse";
import {
  getCuratedDisplayPromptPool,
  interleaveDisplayPrompts,
  mergeUniqueDisplayPrompts,
  resolveCuratedPromptLocale,
  sampleAceProseDisplayPool,
} from "./curated/index";
import {
  findGenreDiceItemByDisplay,
  getGenreDiceAllDisplayPrompts,
  pickRandomGenreDice,
} from "./genreDicePool";
import {
  findPromptBankByDisplay,
  getPromptBankDisplayPool,
  getPromptBankDisplayPoolByTheme,
  pickPromptBankRoll,
  pickPromptBankRollByTheme,
  shouldUsePromptBank,
} from "./promptBank";
import { resolvePromptPools } from "./localePools";

export type PromptLocale = AppLocale;
export type PromptMode = "beat" | "song";

const FULL_DISPLAY_LOCALES = new Set<PromptLocale>(["en", "fr", "es", "pt", "de", "it", "ja", "ko", "zh", "ar"]);

/** Échantillon banque dans le pool display — tirage aléatoire sans remplacement. */
const BANK_DISPLAY_SAMPLE_CAP = 160;

function sampleRandomStrings(pool: readonly string[], cap: number): readonly string[] {
  if (pool.length <= cap) return pool;
  const indices = pool.map((_, i) => i);
  for (let i = 0; i < cap; i += 1) {
    const j = i + Math.floor(Math.random() * (indices.length - i));
    const tmp = indices[i]!;
    indices[i] = indices[j]!;
    indices[j] = tmp;
  }
  return indices.slice(0, cap).map((i) => pool[i]!);
}

function sampleBankDisplayPool(uiLocale: AppLocale): readonly string[] {
  const goodVibes = getPromptBankDisplayPoolByTheme(uiLocale, "good_vibes");
  const bank = getPromptBankDisplayPool(uiLocale);
  const goodCap = Math.min(80, goodVibes.length);
  const restCap = Math.max(0, BANK_DISPLAY_SAMPLE_CAP - goodCap);
  const goodSample = sampleRandomStrings(goodVibes, goodCap);
  const restPool = bank.filter((d) => !goodSample.includes(d));
  const restSample = sampleRandomStrings(restPool, restCap);
  return mergeUniqueDisplayPrompts(goodSample, restSample);
}

export type BuildDiceAceCaptionFn = (
  locale: PromptLocale,
  mode: PromptMode,
  genre: string,
  displayPrompt: string,
) => string;

export type ResolvedDiceRoll = {
  displayPrompt: string;
  acePrompt: string;
  genre: string;
  lyricsStructure?: string;
  promptBankId?: number;
};

/** Pool display intercalé — genre en premier pour varier les styles visibles. */
export function buildUnifiedDisplayPool(locale: PromptLocale, mode: PromptMode): readonly string[] {
  const curatedLocale = resolveCuratedPromptLocale(locale);
  const curated = getCuratedDisplayPromptPool(curatedLocale, mode);
  const genreDisplays = getGenreDiceAllDisplayPrompts(mode, locale);
  const aceProse = sampleAceProseDisplayPool(getAceProseCuratedPool(mode, curatedLocale));

  if (mode === "song" && shouldUsePromptBank(locale)) {
    const bankSample = sampleBankDisplayPool(locale);
    const merged = interleaveDisplayPrompts(genreDisplays, curated, aceProse, bankSample);
    return merged.length > 0 ? merged : getPromptBankDisplayPool(locale);
  }

  const merged = interleaveDisplayPrompts(genreDisplays, curated, aceProse);
  if (FULL_DISPLAY_LOCALES.has(locale)) return merged;
  return mergeUniqueDisplayPrompts(merged, resolvePromptPools("en").hero);
}

export function resolveDisplayToDiceRoll(
  locale: PromptLocale,
  mode: PromptMode,
  displayPrompt: string,
  buildAceCaption: BuildDiceAceCaptionFn,
): ResolvedDiceRoll {
  const bankHit = findPromptBankByDisplay(displayPrompt, locale);
  if (bankHit) {
    return {
      displayPrompt: bankHit.display,
      acePrompt: buildAceCaption(locale, mode, bankHit.genre, bankHit.display),
      genre: bankHit.genre,
      promptBankId: bankHit.id,
    };
  }

  const curatedLocale = resolveCuratedPromptLocale(locale);
  const curatedSet = new Set(
    getCuratedDisplayPromptPool(curatedLocale, mode).map((p) => p.trim().toLowerCase()),
  );
  const isCurated = curatedSet.has(displayPrompt.trim().toLowerCase());

  if (looksLikeAceProsePrompt(displayPrompt)) {
    return {
      displayPrompt,
      acePrompt: optimizeAceProsePrompt(displayPrompt, { mode }),
      genre: pickRandomGenreValue(),
    };
  }

  if (isCurated) {
    const genre = pickRandomGenreValue();
    return {
      displayPrompt,
      acePrompt: buildAceCaption(locale, mode, genre, displayPrompt),
      genre,
    };
  }

  const matched = findGenreDiceItemByDisplay(displayPrompt, mode, locale);
  if (matched) {
    return {
      genre: matched.genre,
      displayPrompt: matched.displayPrompt,
      acePrompt: buildAceCaption(locale, mode, matched.genre, matched.displayPrompt),
    };
  }

  const fallback = pickRandomGenreDice(mode, locale);
  return {
    genre: fallback.genre,
    displayPrompt,
    acePrompt: buildAceCaption(locale, mode, fallback.genre, displayPrompt),
  };
}

function rollFromPromptBank(
  locale: PromptLocale,
  bank: ReturnType<typeof pickPromptBankRoll>,
  buildAceCaption: BuildDiceAceCaptionFn,
): ResolvedDiceRoll {
  return {
    displayPrompt: bank.display,
    acePrompt: buildAceCaption(locale, "song", bank.genre, bank.display),
    genre: bank.genre,
    promptBankId: bank.id,
  };
}

/**
 * Tirage dé / placeholder avec variété de genres :
 * - song EN/FR : ~40 % banque entière, ~30 % good vibes, ~15 % dé genre, ~15 % pool mixte (aléatoire)
 * - sinon : pool intercalé genre + curated + ACE prose
 */
export function pickVariedDiceRoll(
  locale: PromptLocale,
  mode: PromptMode,
  buildAceCaption: BuildDiceAceCaptionFn,
): ResolvedDiceRoll {
  if (mode === "song" && shouldUsePromptBank(locale)) {
    const bucket = Math.random();
    if (bucket < 0.4) {
      return rollFromPromptBank(locale, pickPromptBankRoll(locale), buildAceCaption);
    }
    if (bucket < 0.7) {
      const happy = pickPromptBankRollByTheme(locale, "good_vibes");
      if (happy) return rollFromPromptBank(locale, happy, buildAceCaption);
      return rollFromPromptBank(locale, pickPromptBankRoll(locale), buildAceCaption);
    }
    if (bucket < 0.85) {
      const dice = pickRandomGenreDice(mode, locale);
      return {
        displayPrompt: dice.displayPrompt,
        acePrompt: buildAceCaption(locale, mode, dice.genre, dice.displayPrompt),
        genre: dice.genre,
      };
    }
  }

  const pool = buildUnifiedDisplayPool(locale, mode);
  const display =
    pool[Math.floor(Math.random() * pool.length)] ?? pickRandomGenreDice(mode, locale).displayPrompt;
  return resolveDisplayToDiceRoll(locale, mode, display, buildAceCaption);
}
