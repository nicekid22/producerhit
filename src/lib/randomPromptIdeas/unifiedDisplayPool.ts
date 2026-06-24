import type { AppLocale } from "@/i18n/config";
import type { PromptMode } from "@/lib/randomPromptIdeas";
import { mergeUniqueDisplayPrompts } from "@/lib/randomPromptIdeas/curatedDisplayPrompts";
import { formatDicePrompt } from "@/lib/randomPromptIdeas";
import { findGenreDiceItemByDisplay, getGenreDiceDisplayPromptPool, pickRandomGenreMenuDice } from "@/lib/randomPromptIdeas/genreMenuPrompts";
import {
  getCuratedDisplayPromptPool,
  getAceProseCuratedPool,
  getPromptBankDisplayPool,
  looksLikeAceProsePrompt,
  optimizeAceProsePrompt,
  pickPromptBankRoll,
  shouldUsePromptBank,
  resolveCuratedPromptLocale,
  type AceCuratedPromptLocale,
} from "@producerhit/shared";
import { matchGenreFromPrompt } from "@/lib/genres/matchGenreFromPrompt";

export { resolveCuratedPromptLocale, type AceCuratedPromptLocale };

/** Pool unifié : prompts drôles curated (langue ACE) + phrases display du dé genre. */
export function getUnifiedUserPromptPool(uiLocale: AppLocale, mode: PromptMode): readonly string[] {
  if (mode === "song" && shouldUsePromptBank(uiLocale)) {
    const bank = getPromptBankDisplayPool(uiLocale);
    if (bank.length > 0) return bank;
  }
  const curatedLocale = resolveCuratedPromptLocale(uiLocale);
  const curated = getCuratedDisplayPromptPool(curatedLocale, mode);
  const genreDisplays = getGenreDiceDisplayPromptPool(mode, uiLocale);
  const aceProse = getAceProseCuratedPool(mode, curatedLocale);
  return mergeUniqueDisplayPrompts(curated, genreDisplays, aceProse);
}

/** Dé ou placeholder — même ensemble de possibilités. */
export function pickRandomUnifiedDiceRoll(
  uiLocale: AppLocale,
  mode: PromptMode,
): {
  displayPrompt: string;
  acePrompt: string;
  genre: string;
  prompt: string;
  lyricsStructure?: string;
  promptBankId?: number;
} {
  if (mode === "song" && shouldUsePromptBank(uiLocale)) {
    const bank = pickPromptBankRoll(uiLocale);
    return {
      genre: bank.genre,
      displayPrompt: bank.display,
      acePrompt: bank.aceCaption,
      prompt: bank.display,
      lyricsStructure: bank.lyricsStructure,
      promptBankId: bank.id,
    };
  }

  const pool = getUnifiedUserPromptPool(uiLocale, mode);
  const curatedLocale = resolveCuratedPromptLocale(uiLocale);
  const curatedSet = new Set(getCuratedDisplayPromptPool(curatedLocale, mode).map((p) => p.trim().toLowerCase()));

  const display = pool[Math.floor(Math.random() * pool.length)] ?? pool[0] ?? "";
  const isCurated = curatedSet.has(display.trim().toLowerCase());

  if (looksLikeAceProsePrompt(display)) {
    const genre = matchGenreFromPrompt(display) ?? pickRandomGenreMenuDice(mode, uiLocale).genre;
    const ace = optimizeAceProsePrompt(display, { mode });
    return {
      genre,
      displayPrompt: display,
      acePrompt: ace,
      prompt: display,
    };
  }

  if (isCurated) {
    const genrePick = pickRandomGenreMenuDice(mode, uiLocale);
    return {
      genre: genrePick.genre,
      displayPrompt: display,
      acePrompt: "",
      prompt: display,
    };
  }

  const matched = findGenreDiceItemByDisplay(display, mode, uiLocale);
  if (matched) {
    return {
      genre: matched.genre,
      displayPrompt: matched.displayPrompt,
      acePrompt: formatDicePrompt(matched.acePrompt, mode),
      prompt: matched.displayPrompt,
    };
  }

  const fallback = pickRandomGenreMenuDice(mode, uiLocale);
  return {
    genre: fallback.genre,
    displayPrompt: display,
    acePrompt: formatDicePrompt(fallback.acePrompt, mode),
    prompt: display,
  };
}
