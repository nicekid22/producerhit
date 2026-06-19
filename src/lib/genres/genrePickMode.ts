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
  return resolved === "from_idea" ? FROM_IDEA_GENRE_VALUE : RANDOM_GENRE_VALUE;
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
