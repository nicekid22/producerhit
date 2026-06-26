import type { AppLocale } from "@/i18n/config";
import type { PromptMode } from "@/lib/randomPromptIdeas";
import { formatDicePrompt } from "@/lib/randomPromptIdeas";
import {
  buildRichAceCaption,
  buildUnifiedDisplayPool,
  pickVariedDiceRoll,
  resolveCuratedPromptLocale,
  uiLocaleToAceVocalLanguage,
  type AceCuratedPromptLocale,
} from "@producerhit/shared";

export { resolveCuratedPromptLocale, type AceCuratedPromptLocale };

function buildWebDiceAceCaption(
  uiLocale: AppLocale,
  mode: PromptMode,
  genre: string,
  displayPrompt: string,
): string {
  return buildRichAceCaption({
    display: displayPrompt,
    locale: uiLocale,
    mode,
    formGenre: genre,
  });
}

/** Pool unifié : banque (échantillon) + dé genre (catalogue) + curated + ACE prose. */
export function getUnifiedUserPromptPool(uiLocale: AppLocale, mode: PromptMode): readonly string[] {
  return buildUnifiedDisplayPool(uiLocale, mode);
}

/** Dé ou placeholder — variété de genres (⅓ banque / ⅓ catalogue / ⅓ curated en song EN-FR). */
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
  const roll = pickVariedDiceRoll(uiLocale, mode, buildWebDiceAceCaption);
  const acePrompt = roll.acePrompt ? formatDicePrompt(roll.acePrompt, mode) : "";
  return {
    genre: roll.genre,
    displayPrompt: roll.displayPrompt,
    acePrompt,
    prompt: roll.displayPrompt,
    lyricsStructure: roll.lyricsStructure,
    promptBankId: roll.promptBankId,
  };
}
