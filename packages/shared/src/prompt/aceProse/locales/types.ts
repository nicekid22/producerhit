import type { AceCuratedPromptLocale } from "../../curatedPromptLocale";
import type { AceProseMode } from "../lexicon";

export type AceProseLocale = AceCuratedPromptLocale;

export type AceProseLocaleLexicon = {
  moods: readonly string[];
  moodsB: readonly string[];
  themes: readonly string[];
  buildOpener: (args: {
    mode: AceProseMode;
    moodA: string;
    moodB: string;
    genre: string;
    theme: string;
  }) => string;
};
