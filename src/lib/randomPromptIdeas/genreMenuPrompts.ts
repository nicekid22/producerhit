import type { AppLocale } from "@/i18n/config";
import { ALL_GENRE_OPTIONS } from "@/lib/genres";
import { CUSTOM_GENRE_OPTIONS } from "@/lib/genres/genrePickMode";
import { EXTENDED_GENRES } from "@/lib/genres/extendedCatalog";
import { getGenreCatalogPrompt } from "@/lib/promptBuilder";
import { ACE_DICE_CAPTION_MAX } from "@/lib/randomPromptIdeas/aceDiceCaption";
import type { PromptMode } from "@/lib/randomPromptIdeas";
import type { PromptCategory } from "@/lib/randomPromptIdeas/categories/types";
import {
  pickGenreDiceNarrative,
  pickGenreDiceProduction,
  pickGenreDiceVocal,
  resolveThemeGroup,
} from "@/lib/randomPromptIdeas/genreDiceThemes";

type GenreDiceItem = { genre: string; prompt: string };

/** Variants per catalog genre — more variety on dice rolls. */
const VARIANTS_PER_GENRE = 3;

const GENRE_GROUP = new Map<string, string>(
  ALL_GENRE_OPTIONS.filter((o) => o.group).map((o) => [o.value, o.group!]),
);

function buildGenreLookup(): Map<string, { aceTags: string }> {
  const map = new Map<string, { aceTags: string }>();
  for (const g of EXTENDED_GENRES) {
    map.set(g.value, { aceTags: (g.aceTags || g.prompt).trim() });
  }
  for (const opt of CUSTOM_GENRE_OPTIONS) {
    if (map.has(opt.value)) continue;
    const prompt = getGenreCatalogPrompt(opt.value);
    if (prompt) map.set(opt.value, { aceTags: prompt.trim() });
  }
  return map;
}

const GENRE_LOOKUP = buildGenreLookup();

function trimAceCaption(parts: readonly string[]): string {
  const layers = parts.map((p) => p.trim()).filter(Boolean);
  let result = layers.join(", ");
  while (result.length > ACE_DICE_CAPTION_MAX && layers.length > 1) {
    layers.pop();
    result = layers.join(", ");
  }
  if (result.length > ACE_DICE_CAPTION_MAX) {
    result = result.slice(0, ACE_DICE_CAPTION_MAX).replace(/[,\s]+$/g, "").trim();
  }
  return result;
}

function buildDetailedPrompt(
  locale: AppLocale,
  genre: string,
  entry: { aceTags: string },
  mode: PromptMode,
  variant: number,
): string {
  const base = entry.aceTags.trim() || genre.toLowerCase();
  const themeGroup = resolveThemeGroup(GENRE_GROUP.get(genre));
  const narrative = pickGenreDiceNarrative(locale, themeGroup, mode, variant);
  const production = pickGenreDiceProduction(locale, mode, variant);

  if (mode === "song") {
    const vocal = pickGenreDiceVocal(locale, themeGroup, variant);
    return trimAceCaption([base, narrative, vocal, production]);
  }

  return trimAceCaption([base, narrative, production]);
}

function buildGenreDicePool(mode: PromptMode, locale: AppLocale): readonly GenreDiceItem[] {
  const out: GenreDiceItem[] = [];
  for (const opt of CUSTOM_GENRE_OPTIONS) {
    const entry = GENRE_LOOKUP.get(opt.value);
    if (!entry) continue;
    for (let variant = 0; variant < VARIANTS_PER_GENRE; variant += 1) {
      out.push({
        genre: opt.value,
        prompt: buildDetailedPrompt(locale, opt.value, entry, mode, variant),
      });
    }
  }
  return out;
}

const poolCache = new Map<string, readonly GenreDiceItem[]>();

function poolCacheKey(mode: PromptMode, locale: AppLocale): string {
  return `${mode}:${locale}`;
}

function getGenreDicePool(mode: PromptMode, locale: AppLocale = "en"): readonly GenreDiceItem[] {
  const key = poolCacheKey(mode, locale);
  const cached = poolCache.get(key);
  if (cached) return cached;
  const built = buildGenreDicePool(mode, locale);
  poolCache.set(key, built);
  return built;
}

export function getGenreMenuPromptCount(mode: PromptMode, locale: AppLocale = "en"): number {
  return getGenreDicePool(mode, locale).length;
}

export function buildGenreMenuCategory(mode: PromptMode, label: string, locale: AppLocale = "en"): PromptCategory {
  const pool = getGenreDicePool(mode, locale);
  return {
    id: "genre_menu",
    label,
    mode,
    prompts: pool.map((item) => item.prompt),
  };
}

export function pickRandomGenreMenuDice(mode: PromptMode, locale: AppLocale = "en"): GenreDiceItem {
  const pool = getGenreDicePool(mode, locale);
  if (pool.length === 0) {
    const fallbackNarrative = pickGenreDiceNarrative(locale, "trap", mode, 0);
    const fallbackProduction = pickGenreDiceProduction(locale, mode, 0);
    return {
      genre: "Melodic Trap",
      prompt: trimAceCaption([
        "melodic trap, emotional minor piano, airy pads, crisp hats, punchy 808 glides",
        fallbackNarrative,
        ...(mode === "song" ? [pickGenreDiceVocal(locale, "trap", 0)] : []),
        fallbackProduction,
      ]),
    };
  }
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
}
