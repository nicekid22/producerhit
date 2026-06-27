import type { AppLocale } from "../i18n/locales";

import { looksLikeStructuredDisplayIdea } from "../displayPromptPatterns";

import { findGenreDiceItemByDisplay } from "./genreDicePool";

import { findPromptBankByDisplay, shouldUsePromptBank } from "./promptBank";

import {
  looksLikeAceProsePrompt,
  optimizeAceProsePrompt,
} from "./aceProse";

import { looksLikeNaturalUserIdea } from "./naturalIdeaToAce";

import { normalizeAceCaption, normalizeAceLyrics } from "./acePromptContract";

import { buildRichAceCaption } from "./richDisplayAce";

import { isCatalogGenreSelection } from "../genres/genrePickMode";

import { matchGenreFromPrompt } from "../genres/matchGenreFromPrompt";

export type PromptMode = "beat" | "song";

export type GenerationCaptionContext = {
  captionOverride?: string;
  /** Prompts dé / landing ACE prose — réservé aux chansons (beats passent par le template instrumental). */
  melodyComposition: boolean;
  /** Structure lyrics ACE-Step (banque 2000 prompts). */
  lyricsStructure?: string;
  /** Genre catalogue déduit de la banque (prioritaire sur le dropdown à la génération). */
  bankGenre?: string;
};

function captionFromOverride(override: string, mode: PromptMode): GenerationCaptionContext {
  const { caption } = normalizeAceCaption(override, {
    mode: mode === "beat" ? "beat" : "song",
    instrumental: mode === "beat",
  });
  return { captionOverride: caption, melodyComposition: false };
}

function resolveRichCaption(
  display: string,
  locale: AppLocale,
  mode: PromptMode,
  formGenre: string,
  preferPrebuiltAce?: string | null,
): string {
  return buildRichAceCaption({
    display,
    locale,
    mode,
    formGenre,
    preferPrebuiltAce,
  });
}

function resolveGenreForStructured(display: string, formGenre: string): string {
  if (isCatalogGenreSelection(formGenre) && formGenre !== "Auto") return formGenre;
  return matchGenreFromPrompt(display) ?? (formGenre !== "Auto" ? formGenre : "Melodic Trap");
}

/** Aligné web `resolveGenerationCaptionContext` — mobile & shared. */
export function resolveGenerationCaptionContext(args: {
  diceAceOverride?: string | null;
  landingAceOverride?: string | null;
  displayIdea: string;
  formGenre: string;
  mode: PromptMode;
  uiLocale?: AppLocale;
  /** Dé banque : ne pas injecter caption/lyrics/genre depuis le JSON (Style + sample_mode). */
  skipPromptBankPipeline?: boolean;
}): GenerationCaptionContext {
  const isSong = args.mode === "song";

  const dice = args.diceAceOverride?.trim();
  if (dice && !isSong) return captionFromOverride(dice, args.mode);

  const landing = args.landingAceOverride?.trim();
  if (landing && !isSong) return captionFromOverride(landing, args.mode);

  const idea = args.displayIdea.trim();
  if (!idea) {
    return { melodyComposition: false };
  }

  if (
    isSong &&
    shouldUsePromptBank(args.uiLocale) &&
    args.uiLocale &&
    !args.skipPromptBankPipeline
  ) {
    const bank = findPromptBankByDisplay(idea, args.uiLocale);
    if (bank) {
      const lyricsNorm = normalizeAceLyrics(bank.lyricsStructure, { instrumental: false });
      return {
        captionOverride: normalizeAceCaption(bank.aceCaption, {
          mode: "song",
          instrumental: false,
        }).caption,
        melodyComposition: false,
        lyricsStructure: lyricsNorm.lyrics,
        bankGenre: bank.genre,
      };
    }
  }

  if (looksLikeAceProsePrompt(idea)) {
    if (isSong) return { melodyComposition: false };
    return {
      captionOverride: optimizeAceProsePrompt(idea, { mode: args.mode }),
      melodyComposition: false,
    };
  }

  if (args.uiLocale) {
    const matched = findGenreDiceItemByDisplay(idea, args.mode, args.uiLocale);
    if (matched) {
      const ace = resolveRichCaption(idea, args.uiLocale, args.mode, matched.genre);
      if (ace.trim()) {
        if (isSong) return { melodyComposition: false };
        return captionFromOverride(ace.trim(), args.mode);
      }
    }
  }

  if (looksLikeStructuredDisplayIdea(idea) && args.uiLocale) {
    const genre = resolveGenreForStructured(idea, args.formGenre);
    const ace = resolveRichCaption(idea, args.uiLocale, args.mode, genre);
    if (ace.trim()) {
      if (isSong) return { melodyComposition: false };
      return captionFromOverride(ace.trim(), args.mode);
    }
  }

  if (args.uiLocale && looksLikeNaturalUserIdea(idea)) {
    const ace = resolveRichCaption(idea, args.uiLocale, args.mode, args.formGenre);
    if (ace.trim()) {
      if (isSong) return { melodyComposition: false };
      return captionFromOverride(ace.trim(), args.mode);
    }
  }

  return { melodyComposition: false };
}
