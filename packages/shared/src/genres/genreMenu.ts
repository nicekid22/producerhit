import type { AppLocale } from "../i18n/locales";
import allGenreOptionsJson from "./allGenreOptions.json";
import {
  FROM_IDEA_GENRE_VALUE,
  RANDOM_GENRE_VALUE,
  type GenreDropdownOption,
} from "./genrePickMode";

export type { GenreDropdownOption };

/** Full catalog — synced from web via scripts/export-genre-catalog.ts */
export const ALL_GENRE_OPTIONS: readonly GenreDropdownOption[] = allGenreOptionsJson as GenreDropdownOption[];

export const GENRE_CATALOG_COUNT = ALL_GENRE_OPTIONS.length;

/** Genres les plus utilisés — tête du menu (aligné web). */
export const PRIMARY_GENRE_VALUES: readonly string[] = [
  "Melodic Trap",
  "Dark Trap",
  "Drill",
  "Trapsoul",
  "90s R&B",
  "Contemporary R&B",
  "Neo Soul",
  "Afrobeats",
  "Amapiano",
  "Pop",
  "Reggaeton",
  "Bachata",
  "Salsa",
  "Kizomba",
  "Dembow",
  "Latin Pop",
  "UK Garage",
  "Jersey Club",
  "House",
  "Hyperpop",
  "Lo-Fi Hip-Hop",
  "Synthwave",
  "Brazilian Phonk",
  "Country Pop",
  "Contemporary Country",
  "Worship Pop",
  "Bollywood",
  "Bluegrass",
  "K-Pop",
  "Khaleeji",
  "Arabic Pop",
  "J-Pop",
] as const;

const CORE_GROUP_ORDER: readonly string[] = [
  "Trap / Hip-Hop",
  "R&B / Soul",
  "Afro / Latin / Island",
  "Electronic / Pop",
  "Rock",
  "Other",
  "LAB (Futur)",
];

const byValue = new Map(ALL_GENRE_OPTIONS.map((o) => [o.value, o]));

/** Options menu premium — Mode · Populaires · groupes · catalogue étendu. */
export function buildPrecisionGenreOptions(locale: AppLocale): GenreDropdownOption[] {
  const primaryGroup = locale === "fr" ? "Genres principaux" : "Popular genres";
  const modeGroup = locale === "fr" ? "Mode" : "Mode";
  const fromIdeaLabel = locale === "fr" ? "Depuis l'idée" : "From your idea";
  const randomLabel = locale === "fr" ? "Aléatoire" : "Random";

  const used = new Set<string>();

  const primary: GenreDropdownOption[] = [];
  for (const value of PRIMARY_GENRE_VALUES) {
    const opt = byValue.get(value);
    if (!opt) continue;
    primary.push({ value: opt.value, label: opt.label, group: primaryGroup });
    used.add(value);
  }

  const coreByGroup: GenreDropdownOption[] = [];
  for (const group of CORE_GROUP_ORDER) {
    for (const opt of ALL_GENRE_OPTIONS) {
      if (opt.group !== group || used.has(opt.value)) continue;
      coreByGroup.push({ value: opt.value, label: opt.label, group: opt.group });
      used.add(opt.value);
    }
  }

  const extended: GenreDropdownOption[] = [];
  for (const opt of ALL_GENRE_OPTIONS) {
    if (used.has(opt.value)) continue;
    extended.push({ value: opt.value, label: opt.label, group: opt.group });
    used.add(opt.value);
  }

  return [
    { value: FROM_IDEA_GENRE_VALUE, label: fromIdeaLabel, group: modeGroup },
    { value: RANDOM_GENRE_VALUE, label: randomLabel, group: modeGroup },
    ...primary,
    ...coreByGroup,
    ...extended,
  ];
}

export function findGenreOption(value: string): GenreDropdownOption | undefined {
  if (value === FROM_IDEA_GENRE_VALUE || value === RANDOM_GENRE_VALUE) {
    return { value, label: value, group: "Mode" };
  }
  return byValue.get(value);
}

export function catalogGenreValues(): string[] {
  return ALL_GENRE_OPTIONS.map((o) => o.value);
}

export function pickRandomCatalogGenreValue(pool: readonly string[] = catalogGenreValues()): string {
  if (pool.length === 0) return "Melodic Trap";
  return pool[Math.floor(Math.random() * pool.length)] ?? "Melodic Trap";
}
