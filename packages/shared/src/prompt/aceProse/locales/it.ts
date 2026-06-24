import { ES_ACE_PROSE_LEXICON } from "./es";
import type { AceProseLocaleLexicon } from "./types";

const IT_MOODS = [
  "Oscura",
  "Luminosa",
  "Fredda",
  "Calda",
  "Cruda",
  "Lucida",
  "Cinematografica",
  "Eterea",
  "Aggressiva",
  "Malinconica",
  "Euforica",
  "Ipnotica",
  "Intima",
  "Epica",
  "Notturna",
  "Nostalgica",
  "Futuristica",
  "Ribelle",
  "Sognante",
  "Tesa",
] as const;

const IT_MOODS_B = [
  "emotiva",
  "atmosferica",
  "potente",
  "notturna",
  "underground",
  "radio-ready",
  "catartica",
  "introspectiva",
  "ballabile",
  "di strada",
  "lussuosa",
  "cruda",
  "fluttuante",
  "tossica",
  "speranzosa",
] as const;

export const IT_ACE_PROSE_LEXICON: AceProseLocaleLexicon = {
  moods: IT_MOODS,
  moodsB: IT_MOODS_B,
  themes: ES_ACE_PROSE_LEXICON.themes,
  buildOpener: ({ mode, moodA, moodB, genre, theme }) => {
    const kind = mode === "song" ? "Canzone" : "Beat";
    return `${moodA}, ${kind.toLowerCase()} ${genre} ${moodB} su ${theme}`;
  },
};
