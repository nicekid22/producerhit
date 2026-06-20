import type { AppLocale } from "@/i18n/config";
import type { PromptMode } from "@/lib/randomPromptIdeas";
import { EN_THEME_LAYERS } from "./locales/en";
import { FR_THEME_LAYERS } from "./locales/fr";
import type { LocaleThemeLayers, ThemeGroup, ThemeLocale } from "./types";
import { resolveThemeGroup } from "./types";

export type { ThemeGroup, ThemeLocale };
export { resolveThemeGroup } from "./types";

const THEME_LAYERS: Partial<Record<AppLocale, LocaleThemeLayers>> = {
  en: EN_THEME_LAYERS,
  fr: FR_THEME_LAYERS,
};

/** Locales with dedicated mood/vocal layers (others fall back to English). */
export function resolveThemeLayers(locale: AppLocale): LocaleThemeLayers {
  return THEME_LAYERS[locale] ?? EN_THEME_LAYERS;
}

export function pickGenreDiceNarrative(
  locale: AppLocale,
  group: ThemeGroup,
  mode: PromptMode,
  variant: number,
): string {
  const layers = resolveThemeLayers(locale);
  const pool = mode === "song" ? layers.songNarrative[group] : layers.beatNarrative[group];
  return pool[variant % pool.length] ?? pool[0] ?? "";
}

export function pickGenreDiceVocal(locale: AppLocale, group: ThemeGroup, variant: number): string {
  const layers = resolveThemeLayers(locale);
  const pool = layers.songVocal[group];
  return pool[variant % pool.length] ?? pool[0] ?? "";
}

export function pickGenreDiceProduction(locale: AppLocale, mode: PromptMode, variant: number): string {
  const layers = resolveThemeLayers(locale);
  const pool = mode === "song" ? layers.songProduction : layers.beatProduction;
  return pool[variant % pool.length] ?? pool[0] ?? "";
}
