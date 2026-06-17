import { ALL_GENRE_OPTIONS } from "@/lib/genres";
import { buildPrecisionGenreOptions } from "@/lib/genres/genreMenuOrder";
import type { DropdownOption } from "@/components/ui/Dropdown";

import type { AppLocale } from "@/i18n/config";
/** Sentinel: random genre pick inside Custom mode (Genre précis dropdown). */
export const RANDOM_GENRE_VALUE = "__random__";

export type GenrePickMode = "auto" | "custom";

export const GENRE_PICK_MODE_STORAGE_KEY = "producerhit_genre_pick_mode";

export const CUSTOM_GENRE_OPTIONS = ALL_GENRE_OPTIONS.filter((o) => o.value !== "Auto");

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

export function normalizeGenrePickMode(value: string | null | undefined): GenrePickMode {
  if (value === "auto") return "auto";
  return "custom";
}

export function precisionGenreOptions(locale: AppLocale): DropdownOption[] {
  return buildPrecisionGenreOptions(locale);
}

export function resolveGenreForGeneration(
  mode: GenrePickMode,
  formGenre: string,
  randomGenre?: string,
): { promptGenre: string; displayGenre: string; pickedRandom?: string } {
  if (mode === "auto") {
    return { promptGenre: "", displayGenre: "Auto" };
  }
  if (isRandomGenreSelection(formGenre)) {
    const picked = randomGenre?.trim() || pickRandomGenreValue();
    return { promptGenre: picked, displayGenre: picked, pickedRandom: picked };
  }
  const g = formGenre && formGenre !== "Auto" ? formGenre : "Melodic Trap";
  return { promptGenre: g, displayGenre: g };
}

export function genrePickModeHint(mode: GenrePickMode, locale: AppLocale, lastRandom?: string): string {
  const isFr = locale === "fr";
  if (mode === "auto") {
    return isFr
      ? "L’IA choisit le style à partir de ton idée, l’ambiance et les chips — sans genre imposé."
      : "AI picks the style from your idea, mood, and chips — no fixed genre.";
  }
  if (lastRandom) {
    return isFr
      ? `Dernier tirage aléatoire : ${lastRandom}. Choisis un genre précis ou laisse Aléatoire.`
      : `Last random pick: ${lastRandom}. Pick an exact genre or keep Random.`;
  }
  return isFr
    ? "Sélectionne un genre précis du catalogue ou choisit - Aléatoire."
    : "Exact genre or Random in the list every generation.";
}
