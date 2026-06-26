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
  pickPromptBankRoll,
  shouldUsePromptBank,
} from "./promptBank";
import { resolvePromptPools } from "./localePools";

export type PromptLocale = AppLocale;
export type PromptMode = "beat" | "song";

const FULL_DISPLAY_LOCALES = new Set<PromptLocale>(["en", "fr", "es", "pt", "de", "it", "ja", "ko", "zh", "ar"]);

/** Échantillon banque — évite qu'elle noie genre + curated dans les pools display. */
const BANK_DISPLAY_SAMPLE_CAP = 96;

function sampleBankDisplayPool(uiLocale: AppLocale): readonly string[] {
  const bank = getPromptBankDisplayPool(uiLocale);
  if (bank.length <= BANK_DISPLAY_SAMPLE_CAP) return bank;
  const step = Math.max(1, Math.floor(bank.length / BANK_DISPLAY_SAMPLE_CAP));
  const out: string[] = [];
  for (let i = 0; i < bank.length && out.length < BANK_DISPLAY_SAMPLE_CAP; i += step) {
    const p = bank[i];
    if (p) out.push(p);
  }
  return out;
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
      acePrompt: bankHit.aceCaption,
      lyricsStructure: bankHit.lyricsStructure,
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

/**
 * Tirage dé / placeholder avec variété de genres :
 * - song EN/FR : ~⅓ banque, ~⅓ dé genre (catalogue entier), ~⅓ curated
 * - sinon : pool intercalé genre + curated + ACE prose
 */
export function pickVariedDiceRoll(
  locale: PromptLocale,
  mode: PromptMode,
  buildAceCaption: BuildDiceAceCaptionFn,
): ResolvedDiceRoll {
  if (mode === "song" && shouldUsePromptBank(locale)) {
    const bucket = Math.random();
    if (bucket < 1 / 3) {
      const bank = pickPromptBankRoll(locale);
      return {
        displayPrompt: bank.display,
        acePrompt: bank.aceCaption,
        lyricsStructure: bank.lyricsStructure,
        genre: bank.genre,
        promptBankId: bank.id,
      };
    }
    if (bucket < 2 / 3) {
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
