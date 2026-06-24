import {
  ACE_PROSE_MOODS,
  ACE_PROSE_MOODS_B,
  ACE_PROSE_THEMES,
} from "../lexicon";
import type { AceProseLocaleLexicon } from "./types";

function titleTheme(theme: string): string {
  return theme.charAt(0).toLowerCase() + theme.slice(1);
}

export const EN_ACE_PROSE_LEXICON: AceProseLocaleLexicon = {
  moods: ACE_PROSE_MOODS,
  moodsB: ACE_PROSE_MOODS_B,
  themes: ACE_PROSE_THEMES,
  buildOpener: ({ mode, moodA, moodB, genre, theme }) =>
    `${moodA} ${moodB} ${genre} ${mode} about ${titleTheme(theme)}`,
};
