import type { AppLocale } from "../i18n/locales";

import { looksLikeStructuredDisplayIdea } from "../displayPromptPatterns";

import { findGenreDiceItemByDisplay } from "./genreDicePool";

import { buildDiceAceCaptionFromDisplay } from "./inspirationAndDice";

import { findPromptBankByDisplay, shouldUsePromptBank } from "./promptBank";

import {

  looksLikeAceProsePrompt,

  optimizeAceProsePrompt,

  sanitizeBeatAceCaption,

} from "./aceProse";



export type PromptMode = "beat" | "song";



export type GenerationCaptionContext = {

  captionOverride?: string;

  /** Prompts dé / landing ACE prose — réservé aux chansons (beats passent par le template instrumental). */

  melodyComposition: boolean;

  /** Structure lyrics ACE-Step (banque 2000 prompts). */

  lyricsStructure?: string;

};



function captionFromOverride(override: string, mode: PromptMode): GenerationCaptionContext {

  const caption = mode === "beat" ? sanitizeBeatAceCaption(override) : override;

  return { captionOverride: caption, melodyComposition: mode === "song" };

}



/** Aligné web `resolveGenerationCaptionContext` — mobile & shared. */

export function resolveGenerationCaptionContext(args: {

  diceAceOverride?: string | null;

  landingAceOverride?: string | null;

  displayIdea: string;

  formGenre: string;

  mode: PromptMode;

  uiLocale?: AppLocale;

}): GenerationCaptionContext {

  const dice = args.diceAceOverride?.trim();

  if (dice) return captionFromOverride(dice, args.mode);



  const landing = args.landingAceOverride?.trim();

  if (landing) return captionFromOverride(landing, args.mode);



  const idea = args.displayIdea.trim();

  if (!idea) return { melodyComposition: false };



  if (args.mode === "song" && shouldUsePromptBank(args.uiLocale) && args.uiLocale) {

    const bank = findPromptBankByDisplay(idea, args.uiLocale);

    if (bank) {

      return {

        captionOverride: bank.aceCaption,

        melodyComposition: true,

        lyricsStructure: bank.lyricsStructure,

      };

    }

  }



  if (looksLikeAceProsePrompt(idea)) {

    return {

      captionOverride: optimizeAceProsePrompt(idea, { mode: args.mode }),

      melodyComposition: args.mode === "song",

    };

  }



  if (args.uiLocale) {

    const matched = findGenreDiceItemByDisplay(idea, args.mode, args.uiLocale);

    if (matched) {

      const ace = buildDiceAceCaptionFromDisplay(

        args.uiLocale,

        args.mode,

        matched.genre,

        matched.displayPrompt,

      );

      if (ace.trim()) return captionFromOverride(ace.trim(), args.mode);

    }

  }



  if (looksLikeStructuredDisplayIdea(idea) && args.uiLocale) {

    const ace = buildDiceAceCaptionFromDisplay(args.uiLocale, args.mode, args.formGenre, idea);

    if (ace.trim()) return captionFromOverride(ace.trim(), args.mode);

  }



  return { melodyComposition: false };

}

