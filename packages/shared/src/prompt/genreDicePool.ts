import type { AppLocale } from "../i18n/locales";
import { ALL_GENRE_OPTIONS, type GenreDropdownOption } from "../genres/genreMenu";
import {
  EN_BEAT_THEMES,
  EN_SONG_THEMES,
  FR_BEAT_THEMES,
  FR_GENRE_LABELS,
  FR_SONG_THEMES,
  LOCALE_DICE_CONFIG,
  type ThemeGroup,
} from "./genreDiceLocales";

type PromptMode = "beat" | "song";

export type GenreDiceItem = { genre: string; displayPrompt: string };

const VARIANTS_PER_GENRE = 3;

function resolveThemeGroup(group: string | undefined): ThemeGroup {
  const g = (group ?? "").toLowerCase();
  if (g.includes("trap") || g.includes("hip-hop")) return "trap";
  if (g.includes("r&b") || g.includes("soul")) return "rnb";
  if (g.includes("afro") || g.includes("latin") || g.includes("island")) return "afro_latin";
  if (g.includes("electronic") || g.includes("pop")) return "electronic_pop";
  if (g.includes("rock")) return "rock";
  if (g.includes("jazz") || g.includes("classical")) return "jazz_classical";
  if (g.includes("world") || g.includes("folk")) return "world";
  if (g.includes("cinematic") || g.includes("film")) return "cinematic";
  if (g.includes("dnb") || g.includes("drum")) return "dnb";
  if (g.includes("club") || g.includes("house")) return "electronic_club";
  if (g.includes("lab") || g.includes("experimental")) return "lab";
  return "default";
}

export function getGenreDisplayLabel(
  genre: string,
  locale: AppLocale,
  options: readonly GenreDropdownOption[] = ALL_GENRE_OPTIONS,
): string {
  const localized = LOCALE_DICE_CONFIG[locale]?.genreLabels?.[genre];
  if (localized) return localized;
  if (locale === "fr" && FR_GENRE_LABELS[genre]) return FR_GENRE_LABELS[genre]!;
  const opt = options.find((o) => o.value === genre);
  return (opt?.label ?? genre).toLowerCase();
}

function pickTheme(locale: AppLocale, group: ThemeGroup, mode: PromptMode, variant: number): string {
  const localized = LOCALE_DICE_CONFIG[locale];
  if (localized) {
    const pools = mode === "song" ? localized.songThemes : localized.beatThemes;
    const pool = pools[group] ?? pools.default;
    return pool[variant % pool.length] ?? pool[0] ?? "";
  }

  const pools =
    locale === "fr"
      ? mode === "song"
        ? FR_SONG_THEMES
        : FR_BEAT_THEMES
      : mode === "song"
        ? EN_SONG_THEMES
        : EN_BEAT_THEMES;
  const pool = pools[group] ?? pools.default;
  return pool[variant % pool.length] ?? pool[0] ?? "";
}

function buildGenreDiceDisplayPrompt(
  locale: AppLocale,
  genre: string,
  mode: PromptMode,
  themeGroup: ThemeGroup,
  variant: number,
): string {
  const genreLabel = getGenreDisplayLabel(genre, locale, ALL_GENRE_OPTIONS);
  const theme = pickTheme(locale, themeGroup, mode, variant);
  const localized = LOCALE_DICE_CONFIG[locale];
  if (localized) {
    return mode === "song" ? localized.song(genreLabel, theme) : localized.beat(genreLabel, theme);
  }
  if (locale === "fr") {
    return mode === "song" ? `Une chanson ${genreLabel} ${theme}` : `Un beat ${genreLabel} ${theme}`;
  }
  return mode === "song" ? `A ${genreLabel} song ${theme}` : `A ${genreLabel} beat ${theme}`;
}

function buildGenreDicePool(mode: PromptMode, locale: AppLocale): readonly GenreDiceItem[] {
  const out: GenreDiceItem[] = [];
  for (const opt of ALL_GENRE_OPTIONS) {
    const themeGroup = resolveThemeGroup(opt.group);
    for (let variant = 0; variant < VARIANTS_PER_GENRE; variant += 1) {
      out.push({
        genre: opt.value,
        displayPrompt: buildGenreDiceDisplayPrompt(locale, opt.value, mode, themeGroup, variant),
      });
    }
  }
  return out;
}
const poolCache = new Map<string, readonly GenreDiceItem[]>();

function getGenreDicePool(mode: PromptMode, locale: AppLocale): readonly GenreDiceItem[] {
  const key = `${mode}:${locale}`;
  const cached = poolCache.get(key);
  if (cached) return cached;
  const built = buildGenreDicePool(mode, locale);
  poolCache.set(key, built);
  return built;
}

export function findGenreDiceItemByDisplay(
  displayPrompt: string,
  mode: PromptMode,
  locale: AppLocale,
): GenreDiceItem | null {
  const needle = displayPrompt.trim().toLowerCase();
  if (!needle) return null;
  const pool = getGenreDicePool(mode, locale);
  return pool.find((item) => item.displayPrompt.trim().toLowerCase() === needle) ?? null;
}

export function pickRandomChipGenre(): string {
  if (ALL_GENRE_OPTIONS.length === 0) return "Melodic Trap";
  return ALL_GENRE_OPTIONS[Math.floor(Math.random() * ALL_GENRE_OPTIONS.length)]?.value ?? "Melodic Trap";
}
export function pickRandomGenreDice(mode: PromptMode, locale: AppLocale): GenreDiceItem {
  const pool = getGenreDicePool(mode, locale);
  if (pool.length === 0) {
    return {
      genre: "Melodic Trap",
      displayPrompt: buildGenreDiceDisplayPrompt(locale, "Melodic Trap", mode, "trap", 0),
    };
  }
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
}

/** Phrases display liées à un genre — pour placeholder / dé unifié. */
export function getGenreDiceDisplayPromptPool(mode: PromptMode, locale: AppLocale): readonly string[] {
  const pool = getGenreDicePool(mode, locale);
  if (pool.length === 0) return [];

  const byGenre = new Map<string, string[]>();
  for (const item of pool) {
    const list = byGenre.get(item.genre) ?? [];
    if (!list.includes(item.displayPrompt)) list.push(item.displayPrompt);
    byGenre.set(item.genre, list);
  }

  const genres = [...byGenre.keys()];
  const seen = new Set<string>();
  const out: string[] = [];
  for (let round = 0; round < 4 && out.length < 32; round += 1) {
    for (const genre of genres) {
      const prompts = byGenre.get(genre) ?? [];
      const pick = prompts[round % prompts.length];
      if (!pick || seen.has(pick)) continue;
      seen.add(pick);
      out.push(pick);
    }
  }
  return out;
}
