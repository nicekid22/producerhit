import type { DropdownOption } from "@/components/ui/Dropdown";
import { ALL_GENRE_OPTIONS } from "@/lib/genres";
import { EXTENDED_GENRES } from "@/lib/genres/extendedCatalog";
import { FROM_IDEA_GENRE_VALUE, RANDOM_GENRE_VALUE } from "@/lib/genres/genrePickMode";

import type { AppLocale } from "@/i18n/config";
const CUSTOM_GENRE_OPTIONS = ALL_GENRE_OPTIONS.filter((o) => o.value !== FROM_IDEA_GENRE_VALUE);

/** Genres les plus utilisés — affichés en tête du menu (avant les catégories). */
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

export function buildPrecisionGenreOptions(locale: AppLocale): DropdownOption[] {
  const primaryGroup = locale === "fr" ? "Genres principaux" : "Popular genres";
  const modeGroup = locale === "fr" ? "Mode" : "Mode";
  const fromIdeaLabel = locale === "fr" ? "Depuis l'idée" : "From your idea";
  const randomLabel = locale === "fr" ? "Aléatoire" : "Random";

  const byValue = new Map(CUSTOM_GENRE_OPTIONS.map((o) => [o.value, o]));
  const used = new Set<string>();

  const primary: DropdownOption[] = [];
  for (const value of PRIMARY_GENRE_VALUES) {
    const opt = byValue.get(value);
    if (!opt) continue;
    primary.push({ value: opt.value, label: opt.label, group: primaryGroup });
    used.add(value);
  }

  const coreByGroup: DropdownOption[] = [];
  for (const group of CORE_GROUP_ORDER) {
    for (const opt of CUSTOM_GENRE_OPTIONS) {
      if (opt.group !== group || used.has(opt.value)) continue;
      coreByGroup.push({ value: opt.value, label: opt.label, group: opt.group });
      used.add(opt.value);
    }
  }

  const extended: DropdownOption[] = [];
  for (const item of EXTENDED_GENRES) {
    if (used.has(item.value)) continue;
    const opt = byValue.get(item.value);
    if (!opt) continue;
    extended.push({ value: opt.value, label: opt.label, group: opt.group });
    used.add(item.value);
  }

  for (const opt of CUSTOM_GENRE_OPTIONS) {
    if (used.has(opt.value)) continue;
    extended.push({ value: opt.value, label: opt.label, group: opt.group });
  }

  return [
    { value: FROM_IDEA_GENRE_VALUE, label: fromIdeaLabel, group: modeGroup },
    { value: RANDOM_GENRE_VALUE, label: randomLabel, group: modeGroup },
    ...primary,
    ...coreByGroup,
    ...extended,
  ];
}
