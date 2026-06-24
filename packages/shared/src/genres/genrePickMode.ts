import type { AppLocale } from "../i18n/locales";
import allGenreOptionsJson from "./allGenreOptions.json";

/** Genre piloté par l'idée — pas d'injection catalogue. */
export const FROM_IDEA_GENRE_VALUE = "Auto";

/** Tirage catalogue à chaque génération (idée vide). */
export const RANDOM_GENRE_VALUE = "__random__";

export type GenreDropdownOption = {
  value: string;
  label: string;
  group: string;
};

const GENRE_POOL = (allGenreOptionsJson as readonly { value: string }[]).map((o) => o.value);

export function pickRandomGenreValue(): string {
  if (GENRE_POOL.length === 0) return "Melodic Trap";
  return GENRE_POOL[Math.floor(Math.random() * GENRE_POOL.length)] ?? "Melodic Trap";
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
  if (isFromIdeaGenreSelection(genre)) {
    return locale === "fr"
      ? ideaFilled
        ? "Le style est déduit de ton idée."
        : "Sans idée, un style du catalogue sera tiré à la génération."
      : ideaFilled
        ? "Style follows your idea."
        : "With no idea, a catalog style is picked at generate time.";
  }
  if (isRandomGenreSelection(genre)) {
    const pick = lastRandom?.trim();
    return locale === "fr"
      ? pick
        ? `Dernier tirage : ${pick}`
        : "Un style aléatoire du catalogue à chaque génération."
      : pick
        ? `Last pick: ${pick}`
        : "Random catalog style on each generation.";
  }
  return locale === "fr" ? "Style fixe pour cette génération." : "Fixed style for this generation.";
}
