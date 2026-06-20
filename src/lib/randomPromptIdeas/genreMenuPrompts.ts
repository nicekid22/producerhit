import { ALL_GENRE_OPTIONS } from "@/lib/genres";
import { CUSTOM_GENRE_OPTIONS } from "@/lib/genres/genrePickMode";
import { EXTENDED_GENRES } from "@/lib/genres/extendedCatalog";
import { getGenreCatalogPrompt } from "@/lib/promptBuilder";
import { ACE_DICE_CAPTION_MAX } from "@/lib/randomPromptIdeas/aceDiceCaption";
import type { PromptMode } from "@/lib/randomPromptIdeas";
import type { PromptCategory } from "@/lib/randomPromptIdeas/categories/types";
import {
  pickGenreDiceNarrative,
  pickGenreDiceVocal,
  resolveThemeGroup,
} from "@/lib/randomPromptIdeas/genreDiceThemes";

type GenreDiceItem = { genre: string; prompt: string };

/** Variants per catalog genre — more variety on dice rolls. */
const VARIANTS_PER_GENRE = 3;

const BEAT_PRODUCTION: readonly string[] = [
  "punchy transient drums, clean sub, wide 2026 mix, headroom for vocals",
  "loopable beat structure, tight sidechain glue, polished club loudness, hook-ready space",
  "dry-close drums, modern trap pocket, crisp hi-hat rolls, mix-ready low end",
  "cinematic dynamics, layered percussion, controlled saturation, producer-grade stereo",
];

const SONG_PRODUCTION: readonly string[] = [
  "catchy chorus hook, stacked harmonies, emotional delivery, radio-ready 2026 mix",
  "verse-chorus contrast, ad-lib vocal layers, glossy modern production, wide stereo",
  "intimate verse vocal, powerful chorus lift, warm saturation, commercial-ready polish",
  "melodic topline focus, crisp vocal chain, immersive depth, hook-first arrangement",
];

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

function buildDetailedPrompt(genre: string, entry: { aceTags: string }, mode: PromptMode, variant: number): string {
  const base = entry.aceTags.trim() || genre.toLowerCase();
  const themeGroup = resolveThemeGroup(GENRE_GROUP.get(genre));
  const narrative = pickGenreDiceNarrative(themeGroup, mode, variant);
  const production =
    mode === "song"
      ? SONG_PRODUCTION[variant % SONG_PRODUCTION.length]!
      : BEAT_PRODUCTION[variant % BEAT_PRODUCTION.length]!;

  if (mode === "song") {
    const vocal = pickGenreDiceVocal(themeGroup, variant);
    return trimAceCaption([base, narrative, vocal, production]);
  }

  return trimAceCaption([base, narrative, production]);
}

function buildGenreDicePool(mode: PromptMode): readonly GenreDiceItem[] {
  const out: GenreDiceItem[] = [];
  for (const opt of CUSTOM_GENRE_OPTIONS) {
    const entry = GENRE_LOOKUP.get(opt.value);
    if (!entry) continue;
    for (let variant = 0; variant < VARIANTS_PER_GENRE; variant += 1) {
      out.push({
        genre: opt.value,
        prompt: buildDetailedPrompt(opt.value, entry, mode, variant),
      });
    }
  }
  return out;
}

let beatPool: readonly GenreDiceItem[] | null = null;
let songPool: readonly GenreDiceItem[] | null = null;

function getGenreDicePool(mode: PromptMode): readonly GenreDiceItem[] {
  if (mode === "song") {
    if (!songPool) songPool = buildGenreDicePool("song");
    return songPool;
  }
  if (!beatPool) beatPool = buildGenreDicePool("beat");
  return beatPool;
}

export function getGenreMenuPromptCount(mode: PromptMode): number {
  return getGenreDicePool(mode).length;
}

export function buildGenreMenuCategory(mode: PromptMode, label: string): PromptCategory {
  const pool = getGenreDicePool(mode);
  return {
    id: "genre_menu",
    label,
    mode,
    prompts: pool.map((item) => item.prompt),
  };
}

export function pickRandomGenreMenuDice(mode: PromptMode): GenreDiceItem {
  const pool = getGenreDicePool(mode);
  if (pool.length === 0) {
    return {
      genre: "Melodic Trap",
      prompt:
        "melodic trap, emotional minor piano, airy pads, crisp hats, punchy 808 glides, 3am introspection, hook headroom",
    };
  }
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
}
