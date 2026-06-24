export type StudioGenreOption = { group: string; value: string; label: string };

import type { AppLocale } from "../i18n/locales";
import { FR_GENRE_LABELS, LOCALE_DICE_CONFIG } from "../prompt/genreDiceLocales";

/** Genres affichés en chips Studio (aligné web — « genres principaux »). */
export const STUDIO_CHIP_GENRES: StudioGenreOption[] = [
  { group: "Popular", value: "Melodic Trap", label: "Melodic Trap" },
  { group: "Popular", value: "Dark Trap", label: "Dark Trap" },
  { group: "Popular", value: "Drill", label: "Drill" },
  { group: "Popular", value: "Trapsoul", label: "Trap Soul" },
  { group: "Popular", value: "90s R&B", label: "90s R&B" },
  { group: "Popular", value: "Contemporary R&B", label: "Contemporary R&B" },
  { group: "Popular", value: "Neo Soul", label: "Neo Soul" },
  { group: "Popular", value: "Afrobeats", label: "Afrobeats" },
  { group: "Popular", value: "Amapiano", label: "Amapiano" },
  { group: "Popular", value: "Pop", label: "Pop" },
  { group: "Popular", value: "Reggaeton", label: "Reggaeton" },
  { group: "Popular", value: "Bachata", label: "Bachata" },
  { group: "Popular", value: "Salsa", label: "Salsa" },
  { group: "Popular", value: "Kizomba", label: "Kizomba" },
  { group: "Popular", value: "Dembow", label: "Dembow" },
  { group: "Popular", value: "Latin Pop", label: "Latin Pop" },
  { group: "Popular", value: "UK Garage", label: "UK Garage" },
  { group: "Popular", value: "Jersey Club", label: "Jersey Club" },
  { group: "Popular", value: "House", label: "House" },
  { group: "Popular", value: "Hyperpop", label: "Hyperpop" },
  { group: "Popular", value: "Lo-Fi Hip-Hop", label: "Lo‑Fi Hip Hop" },
  { group: "Popular", value: "Synthwave", label: "Synthwave" },
  { group: "Popular", value: "Brazilian Phonk", label: "Brazilian Phonk" },
  { group: "Popular", value: "Country Pop", label: "Country Pop" },
  { group: "Popular", value: "Contemporary Country", label: "Contemporary Country" },
  { group: "Popular", value: "Worship Pop", label: "Worship Pop" },
  { group: "Popular", value: "Bollywood", label: "Bollywood" },
  { group: "Popular", value: "Bluegrass", label: "Bluegrass" },
  { group: "Popular", value: "K-Pop", label: "K-Pop" },
  { group: "Popular", value: "Khaleeji", label: "Khaleeji" },
  { group: "Popular", value: "Arabic Pop", label: "Arabic Pop" },
  { group: "Popular", value: "J-Pop", label: "J-Pop" },
];

/** Catalogue core pour le dé / placeholders (aligné web CORE_GENRE_OPTIONS). */
export const STUDIO_DICE_GENRES: StudioGenreOption[] = [
  { group: "Trap / Hip-Hop", value: "Contemporary Rap", label: "Contemporary Rap" },
  { group: "Trap / Hip-Hop", value: "Dark Trap", label: "Dark Trap" },
  { group: "Trap / Hip-Hop", value: "Melodic Trap", label: "Melodic Trap" },
  { group: "Trap / Hip-Hop", value: "PluggnB", label: "PluggnB" },
  { group: "Trap / Hip-Hop", value: "Rage", label: "Rage" },
  { group: "Trap / Hip-Hop", value: "Cloud Rap", label: "Cloud Rap" },
  { group: "Trap / Hip-Hop", value: "Emo Rap", label: "Emo Rap" },
  { group: "Trap / Hip-Hop", value: "Sad Rap", label: "Sad Rap" },
  { group: "Trap / Hip-Hop", value: "Atmospheric Rap", label: "Atmospheric Rap" },
  { group: "Trap / Hip-Hop", value: "Emotional Trap", label: "Emotional Trap" },
  { group: "Trap / Hip-Hop", value: "Ambient Trap", label: "Ambient Trap" },
  { group: "Trap / Hip-Hop", value: "Cinematic Trap", label: "Cinematic Trap" },
  { group: "Trap / Hip-Hop", value: "Experimental Trap", label: "Experimental Trap" },
  { group: "Trap / Hip-Hop", value: "Old School Hip-Hop", label: "Old School (Boom Bap)" },
  { group: "Trap / Hip-Hop", value: "Drill", label: "Drill" },
  { group: "Trap / Hip-Hop", value: "Jersey Drill", label: "Jersey Drill" },
  { group: "Trap / Hip-Hop", value: "Afrotrap", label: "Afrotrap" },
  { group: "Trap / Hip-Hop", value: "Sample Drill", label: "Sample Drill" },
  { group: "Trap / Hip-Hop", value: "Melodic Drill", label: "Melodic Drill" },
  { group: "Trap / Hip-Hop", value: "Lo-Fi Hip-Hop", label: "Lo‑Fi (Hip Hop)" },
  { group: "R&B / Soul", value: "Trapsoul", label: "Trap Soul" },
  { group: "R&B / Soul", value: "90s R&B", label: "90s R&B" },
  { group: "R&B / Soul", value: "Contemporary R&B", label: "Contemporary R&B" },
  { group: "R&B / Soul", value: "R&B Alternative", label: "R&B Alternative" },
  { group: "R&B / Soul", value: "Dark R&B", label: "Dark R&B" },
  { group: "R&B / Soul", value: "Future R&B", label: "Future R&B" },
  { group: "R&B / Soul", value: "Afro R&B", label: "Afro R&B" },
  { group: "R&B / Soul", value: "Toxic R&B", label: "Toxic R&B" },
  { group: "R&B / Soul", value: "Neo Soul", label: "Neo Soul" },
  { group: "R&B / Soul", value: "Soul", label: "Soul" },
  { group: "R&B / Soul", value: "Funk", label: "Funk" },
  { group: "R&B / Soul", value: "Lo-fi R&B", label: "Lo‑Fi R&B" },
  { group: "Afro / Latin / Island", value: "Afrobeats", label: "Afrobeats" },
  { group: "Afro / Latin / Island", value: "Amapiano", label: "Amapiano" },
  { group: "Afro / Latin / Island", value: "Afro House", label: "Afro House" },
  { group: "Afro / Latin / Island", value: "Latin", label: "Latin" },
  { group: "Afro / Latin / Island", value: "Reggaeton", label: "Reggaeton" },
  { group: "Afro / Latin / Island", value: "Baile Funk", label: "Baile Funk" },
  { group: "Afro / Latin / Island", value: "Dancehall", label: "Dancehall" },
  { group: "Afro / Latin / Island", value: "Reggae", label: "Reggae" },
  { group: "Electronic / Pop", value: "House", label: "House" },
  { group: "Electronic / Pop", value: "Pop", label: "Pop" },
  { group: "Electronic / Pop", value: "K-Pop", label: "K‑Pop" },
  { group: "Electronic / Pop", value: "Indie Pop", label: "Indie Pop" },
  { group: "Electronic / Pop", value: "Dream Pop", label: "Dream Pop" },
  { group: "Electronic / Pop", value: "Dance Pop", label: "Dance Pop" },
  { group: "Electronic / Pop", value: "Viral TikTok", label: "Viral TikTok" },
  { group: "Electronic / Pop", value: "Viral TikTok Pop", label: "Viral TikTok Pop" },
  { group: "Electronic / Pop", value: "French Pop", label: "French Pop" },
  { group: "Electronic / Pop", value: "UK Garage", label: "UK Garage" },
  { group: "Electronic / Pop", value: "Jersey Club", label: "Jersey Club" },
  { group: "Electronic / Pop", value: "Electro", label: "Electro" },
  { group: "Electronic / Pop", value: "Hyperpop", label: "Hyperpop" },
  { group: "Electronic / Pop", value: "EDM", label: "EDM" },
  { group: "Electronic / Pop", value: "Chillstep", label: "Chillstep" },
  { group: "Electronic / Pop", value: "Dubstep", label: "Dubstep" },
  { group: "Electronic / Pop", value: "Vaporwave", label: "Vaporwave" },
  { group: "Electronic / Pop", value: "Synthwave", label: "SynthWave" },
  { group: "Electronic / Pop", value: "Brazilian Phonk", label: "Brazilian Phonk" },
  { group: "Rock", value: "Pop Rock", label: "Pop Rock" },
  { group: "Rock", value: "Rock", label: "Rock" },
  { group: "Other", value: "Jazz", label: "Jazz" },
  { group: "Other", value: "Country", label: "Country" },
];

function localizedGenreLabel(genre: string, locale: AppLocale): string {
  const localized = LOCALE_DICE_CONFIG[locale]?.genreLabels?.[genre];
  if (localized) return localized;
  if (locale === "fr" && FR_GENRE_LABELS[genre]) return FR_GENRE_LABELS[genre]!;
  const opt = STUDIO_CHIP_GENRES.find((o) => o.value === genre);
  return (opt?.label ?? genre).toLowerCase();
}

/** Chips studio avec libellés localisés (aligné web). */
export function getLocalizedStudioChipGenres(locale: AppLocale): readonly StudioGenreOption[] {
  return STUDIO_CHIP_GENRES.map((opt) => ({
    ...opt,
    label: localizedGenreLabel(opt.value, locale),
  }));
}
