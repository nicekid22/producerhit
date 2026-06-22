import type { AppLocale } from "@/i18n/config";
import type { PromptMode } from "@/lib/randomPromptIdeas";
import { mergeUniqueDisplayPrompts } from "@/lib/randomPromptIdeas/curatedDisplayPrompts";
import { formatDicePrompt } from "@/lib/randomPromptIdeas";
import { findGenreDiceItemByDisplay, getGenreDiceDisplayPromptPool, pickRandomGenreMenuDice } from "@/lib/randomPromptIdeas/genreMenuPrompts";
import {
  getCuratedDisplayPromptPool,
  resolveCuratedPromptLocale,
  type AceCuratedPromptLocale,
} from "@producerhit/shared";

export { resolveCuratedPromptLocale, type AceCuratedPromptLocale };

/** Pool unifié : prompts drôles curated (langue ACE) + phrases display du dé genre. */
export function getUnifiedUserPromptPool(uiLocale: AppLocale, mode: PromptMode): readonly string[] {
  const curatedLocale = resolveCuratedPromptLocale(uiLocale);
  const curated = getCuratedDisplayPromptPool(curatedLocale, mode);
  const genreDisplays = getGenreDiceDisplayPromptPool(mode, uiLocale);
  return mergeUniqueDisplayPrompts(curated, genreDisplays);
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
} {
  const pool = getUnifiedUserPromptPool(uiLocale, mode);
  const curatedLocale = resolveCuratedPromptLocale(uiLocale);
  const curatedSet = new Set(getCuratedDisplayPromptPool(curatedLocale, mode).map((p) => p.trim().toLowerCase()));

  const display = pool[Math.floor(Math.random() * pool.length)] ?? pool[0] ?? "";
  const isCurated = curatedSet.has(display.trim().toLowerCase());

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
