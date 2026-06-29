import { ALL_GENRE_OPTIONS } from "@/lib/genres";

import type { AppLocale } from "@/i18n/config";
import { genreSelectionHintI18n } from "@/i18n/dashboardCatalog";

/** Genre piloté par l'idée — pas d'injection catalogue. */
export const FROM_IDEA_GENRE_VALUE = "Auto";

/** Tirage catalogue à chaque génération (idée vide). */
export const RANDOM_GENRE_VALUE = "__random__";

/** @deprecated Ancien toggle — migration localStorage uniquement. */
export const GENRE_PICK_MODE_STORAGE_KEY = "producerhit_genre_pick_mode";

export const CUSTOM_GENRE_OPTIONS = ALL_GENRE_OPTIONS.filter((o) => o.value !== FROM_IDEA_GENRE_VALUE);

const GENRE_POOL = CUSTOM_GENRE_OPTIONS.map((o) => o.value);

function randInt(maxExclusive: number) {
  if (maxExclusive <= 1) return 0;
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % maxExclusive;
  } catch {
    return Math.floor(Math.random() * maxExclusive);
  }
}

export function pickRandomGenreValue(): string {
  if (GENRE_POOL.length === 0) return "Melodic Trap";
  return GENRE_POOL[randInt(GENRE_POOL.length)] ?? "Melodic Trap";
}

export function isRandomGenreSelection(value: string | null | undefined): boolean {
  return value === RANDOM_GENRE_VALUE;
}

export function isFromIdeaGenreSelection(value: string | null | undefined): boolean {
  return !value || value === FROM_IDEA_GENRE_VALUE;
}

export function isCatalogGenreSelection(value: string | null | undefined): boolean {
  if (!value) return false;
  return !isFromIdeaGenreSelection(value) && !isRandomGenreSelection(value);
}

export function defaultGenreForIdea(ideaText: string): string {
  return ideaText.trim() ? FROM_IDEA_GENRE_VALUE : RANDOM_GENRE_VALUE;
}

export function landingGenreForHandoff(prompt: string, strategy?: "from_idea" | "random"): string {
  const resolved = strategy ?? (prompt.trim() ? "from_idea" : "random");
  if (resolved === "random") return RANDOM_GENRE_VALUE;
  // Tente de détecter un genre cohérent dans le texte du prompt
  const detected = extractGenreFromPrompt(prompt);
  return detected ?? FROM_IDEA_GENRE_VALUE;
}

/**
 * Extrait un genre musical du texte du prompt.
 * Matche d'abord les multi-mots (ex: "dark trap", "lo-fi", "90s r&b")
 * puis les mots simples (ex: "soul", "jazz", "funk").
 * Retourne null si aucun genre n'est détecté.
 */
const GENRE_KEYWORDS: [string[], string][] = [
  // Multi-mots en premier (priorité)
  [["lo-fi", "lofi", "lo fi"], "Lo-Fi Hip-Hop"],
  [["90s r&b", "90s rnb", "90's r&b", "90's rnb"], "90s R&B"],
  [["neo soul", "neosoul"], "Neo Soul"],
  [["afro house", "afrohouse"], "Afro House"],
  [["baile funk", "baile"], "Baile Funk"],
  [["dance hall", "dancehall"], "Dancehall"],
  [["jersey drill", "jersey"], "Jersey Drill"],
  [["sample drill"], "Sample Drill"],
  [["melodic drill"], "Melodic Drill"],
  [["melodic trap"], "Melodic Trap"],
  [["dark trap"], "Dark Trap"],
  [["ambient trap"], "Ambient Trap"],
  [["cinematic trap"], "Cinematic Trap"],
  [["experimental trap"], "Experimental Trap"],
  [["emotional trap"], "Emotional Trap"],
  [["atmospheric trap"], "Atmospheric Trap"],
  [["atmospheric rap"], "Atmospheric Rap"],
  [["old school", "boom bap", "boombap"], "Old School Hip-Hop"],
  [["contemporary rap", "contemporary rap"], "Contemporary Rap"],
  [["cloud rap", "cloudrap"], "Cloud Rap"],
  [["emo rap", "emorap"], "Emo Rap"],
  [["sad rap", "sadrab"], "Sad Rap"],
  [["pluggnb", "plugg nb", "plugg"], "PluggnB"],
  [["french pop", "pop francais", "pop français"], "French Pop"],
  [["dream pop", "dreampop"], "Dream Pop"],
  [["dance pop", "dancepop"], "Dance Pop"],
  [["indie pop", "indiepop"], "Indie Pop"],
  [["pop rock", "poprock"], "Pop Rock"],
  [["vaporwave"], "Vaporwave"],
  [["synthwave", "synth wave", "synth-wave"], "Synthwave"],
  [["witch house"], "Witch House"],
  [["drum and bass", "drum & bass", "drum&bass", "dnb"], "Drum and Bass"],
  [["uk garage", "ukgarage", "speed garage"], "UK Garage"],
  [["jersey club"], "Jersey Club"],
  [["video game", "videogame", "8-bit", "8bit", "chiptune"], "Video Game"],
  [["brazilian phonk", "phonk"], "Brazilian Phonk"],
  [["vina house", "vinahouse", "vn house"], "VinaHouse"],
  [["study beats", "studybeats", "study"], "Study Beats"],
  [["afro r&b", "afro rnb", "afrobeat"], "Afro R&B"],
  [["contemporary r&b", "contemporary rnb", "r&b"], "Contemporary R&B"],
  [["dark r&b", "dark rnb"], "Dark R&B"],
  [["future r&b", "future rnb"], "Future R&B"],
  [["toxic r&b", "toxic rnb"], "Toxic R&B"],
  [["holographic r&b", "holographic rnb"], "Holographic R&B"],
  [["futuristic trap soul", "trap soul"], "Futuristic Trap Soul"],
  [["hybrid electronic rap"], "Hybrid Electronic Rap"],
  [["nostalgic future beats"], "Nostalgic Future Beats"],
  [["y2k"], "Y2K Futuristic Pop"],
  [["sci-fi r&b"], "Sci-Fi R&B"],
  [["ethereal trap"], "Ethereal Trap"],
  [["cinematic afro trap", "cinematic afrotrap"], "Cinematic Afro Trap"],
  [["ambient drill"], "Ambient Drill"],
  [["experimental afro house"], "Experimental Afro House"],
  [["hyper melodic rap"], "Hyper Melodic Rap"],
  [["dark atmospheric pop"], "Dark Atmospheric Pop"],
  [["ai-assisted pop", "ai pop"], "AI-assisted Pop"],
  [["glitchcore"], "Glitchcore"],
  [["digicore"], "Digicore"],
  [["hyperpop"], "Hyperpop"],
  [["chillstep"], "Chillstep"],
  [["guitar acoustic", "acoustic guitar"], "Guitar Acoustic Live"],
  [["piano acoustic", "acoustic piano"], "Piano Acoustic Live"],
  [["rage ambient"], "Rage + Ambient"],
];

// Mots simples (une seule lettre) → match si exact
const SIMPLE_GENRE_MAP: Record<string, string> = {
  soul: "Soul",
  funk: "Funk",
  jazz: "Jazz",
  rock: "Rock",
  pop: "Pop",
  house: "House",
  drill: "Drill",
  edm: "EDM",
  electro: "Electro",
  dubstep: "Dubstep",
  reggaeton: "Reggaeton",
  reggae: "Reggae",
  classical: "Classical",
  opera: "Opera",
  country: "Country",
  oriental: "Oriental",
  rage: "Rage",
  afrobeats: "Afrobeats",
  amapiano: "Amapiano",
  kpop: "K-Pop",
  "k-pop": "K-Pop",
  latin: "Latin",
};

export function extractGenreFromPrompt(text: string): string | null {
  const lower = text.toLowerCase();
  // Multi-mots d'abord (plus spécifiques)
  for (const [keywords, genre] of GENRE_KEYWORDS) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return genre;
    }
  }
  // Puis mots simples
  const words = lower.replace(/['-]/g, " ").split(/\s+/);
  for (const word of words) {
    if (SIMPLE_GENRE_MAP[word]) return SIMPLE_GENRE_MAP[word];
  }
  return null;
}

export function shouldPickRandomGenreAtGenerate(formGenre: string, ideaText: string): boolean {
  const idea = ideaText.trim();
  if (idea) return false;
  return isFromIdeaGenreSelection(formGenre) || isRandomGenreSelection(formGenre);
}

export function resolveGenreForGeneration(
  formGenre: string,
  ideaText: string,
  randomGenre?: string,
): { promptGenre: string; displayGenre: string; pickedRandom?: string } {
  const idea = ideaText.trim();

  if (idea && (isFromIdeaGenreSelection(formGenre) || isRandomGenreSelection(formGenre))) {
    return { promptGenre: "", displayGenre: FROM_IDEA_GENRE_VALUE };
  }

  if (!idea && isFromIdeaGenreSelection(formGenre)) {
    const picked = randomGenre?.trim() || pickRandomGenreValue();
    return { promptGenre: picked, displayGenre: picked, pickedRandom: picked };
  }

  if (isRandomGenreSelection(formGenre)) {
    const picked = randomGenre?.trim() || pickRandomGenreValue();
    return { promptGenre: picked, displayGenre: picked, pickedRandom: picked };
  }

  const g = isCatalogGenreSelection(formGenre) ? formGenre : "Melodic Trap";
  return { promptGenre: g, displayGenre: g };
}

export function genreSelectionHint(
  genre: string,
  locale: AppLocale,
  ideaFilled: boolean,
  lastRandom?: string,
): string {
  return genreSelectionHintI18n(
    genre,
    locale,
    ideaFilled,
    lastRandom,
    isFromIdeaGenreSelection,
    isRandomGenreSelection,
  );
}
