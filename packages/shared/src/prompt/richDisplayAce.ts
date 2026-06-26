import type { AppLocale } from "../i18n/locales";
import { ALL_GENRE_OPTIONS } from "../genres/genreMenu";
import { isCatalogGenreSelection } from "../genres/genrePickMode";
import { matchGenreFromPrompt } from "../genres/matchGenreFromPrompt";
import { getAceGenreTagLine } from "../generation/aceGenreTagMaps";
import { ACE_CAPTION_MAX_CHARS, normalizeAceCaption } from "./acePromptContract";
import {
  pickGenreDiceNarrative,
  pickGenreDiceProduction,
  pickGenreDiceVocal,
  resolveThemeGroup,
} from "./genreDiceThemes";
import { getInspirationChipsForGenre } from "./inspirationAndDice";
import {
  stripNonEnglishCaptionTags,
  themeAceTagsFromDiceDisplay,
  themeAceTagsFromPromptBankDisplay,
} from "./themeFromDiceDisplay";

/** ACE caption tags — toujours couches EN (même si UI en FR). */
const ACE_CAPTION_LAYER_LOCALE: AppLocale = "en";

type PromptMode = "beat" | "song";

export const RICH_ACE_CAPTION_MAX = 280;

const THEME_PHRASE_MAP: Array<[RegExp, string]> = [
  [/vacances?|été|summer holiday|summer vacation/i, "summer vacation mood"],
  [
    /bord de la mer|au bord de la mer|plage|seaside|beach|ocean|océan|mer\b|coastal/i,
    "beach seaside vibe, coastal atmosphere",
  ],
  [/nuit|night|nocturn|midnight/i, "nocturnal mood"],
  [/amour|love|cœur|coeur|heartbreak|romantic/i, "romantic emotional theme"],
  [/rue|street|banlieue|suburb|urban/i, "street life atmosphere"],
  [/fête|party|club|soirée|perreo/i, "party energy, club-ready vibe"],
  [/triste|sad|mélancol|melanchol|heartbreak/i, "melancholic emotional depth"],
  [/hype|énergie|energy|motiv|aggressive|hype/i, "high energy motivational vibe"],
  [/pluie|rain|rainy|pluvieu/i, "rainy atmospheric mood"],
  [/ville|city|downtown/i, "urban city atmosphere"],
  [/piano|rhodes|keys/i, "piano or rhodes motif"],
  [/guitare|guitar/i, "guitar-driven melody"],
  [/808|sub bass|sub-bass/i, "punchy 808 sub"],
  [/pads?|synth|supersaw/i, "airy synth pads"],
  [/vinyl|lo-?fi|dusty/i, "vinyl dust texture"],
  [/cinematic|ciné|film|trailer/i, "cinematic atmosphere"],
  [/neon|synthwave|80s|retro/i, "retro neon nostalgia"],
];

function hashDisplay(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0;
  }
  return h;
}

function trimAceCaption(parts: readonly string[]): string {
  const layers = parts.map((p) => p.trim()).filter(Boolean);
  let result = layers.join(", ");
  while (result.length > RICH_ACE_CAPTION_MAX && layers.length > 1) {
    layers.pop();
    result = layers.join(", ");
  }
  if (result.length > RICH_ACE_CAPTION_MAX) {
    result = result.slice(0, RICH_ACE_CAPTION_MAX).replace(/[,\s]+$/g, "").trim();
  }
  return result;
}

function themeTagsFromDisplay(display: string): string {
  const tags: string[] = [];
  for (const [re, tag] of THEME_PHRASE_MAP) {
    if (re.test(display)) tags.push(tag);
  }
  return tags.join(", ");
}

/** Parse segments after em-dash in v2 curated prompts. */
function parseV2ProductionHints(display: string): string {
  const parts = display.split(/[—–]/);
  if (parts.length < 2) return "";
  const tail = parts.slice(1).join(" ").trim();
  if (!tail || tail.length < 12) return "";
  return tail
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 120)
    .trim();
}

function stableGenreChips(genre: string, display: string): string {
  const chips = getInspirationChipsForGenre(genre);
  if (chips.length === 0) return "";
  const h = hashDisplay(display.toLowerCase());
  const a = chips[h % chips.length] ?? chips[0];
  const b = chips[(h + 3) % chips.length] ?? chips[0];
  if (a === b) return a ?? "";
  return [a, b].filter(Boolean).join(", ");
}

function resolveEffectiveGenre(display: string, formGenre: string): string {
  if (isCatalogGenreSelection(formGenre) && formGenre !== "Auto") return formGenre;
  return matchGenreFromPrompt(display) ?? (formGenre !== "Auto" ? formGenre : "Melodic Trap");
}

function genreGroupFor(genre: string): string | undefined {
  return ALL_GENRE_OPTIONS.find((o) => o.value === genre)?.group;
}

/** Remove redundant genre tokens when display repeats the selected genre (never strips catalogue base tags). */
export function dedupeGenreInCaption(
  caption: string,
  genre: string,
  display: string,
  protectedPrefix?: string,
): string {
  const genreNorm = genre.toLowerCase();
  const displayNorm = display.toLowerCase();
  const genreTokens = genreNorm.split(/[\s/&+-]+/).filter((t) => t.length > 3);
  const redundant = genreTokens.filter((t) => displayNorm.includes(t));
  if (redundant.length === 0) return caption;

  const protectedParts = new Set(
    (protectedPrefix ?? "")
      .split(",")
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean),
  );

  const parts = caption.split(",").map((p) => p.trim());
  const filtered = parts.filter((part) => {
    const pl = part.toLowerCase();
    if (protectedParts.has(pl)) return true;
    if (protectedPrefix && pl && protectedPrefix.toLowerCase().includes(pl)) return true;
    return !redundant.some((t) => pl === t || (pl.includes(t) && pl.length < genreNorm.length + 12));
  });
  return filtered.join(", ");
}

export type BuildRichAceCaptionArgs = {
  display: string;
  locale: AppLocale;
  mode: PromptMode;
  formGenre: string;
  preferPrebuiltAce?: string | null;
};

/** Rich ACE caption — même qualité que le dé genre (catalogue + narrative + production). */
function parseCaptionSeedTags(caption: string): string[] {
  return caption
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

export function buildRichAceCaption(args: BuildRichAceCaptionArgs): string {
  const display = args.display.trim();
  if (!display) return "";

  const prebuilt = args.preferPrebuiltAce?.trim();
  const genre = resolveEffectiveGenre(display, args.formGenre);
  const isSong = args.mode === "song";
  const variant = hashDisplay(display) % 3;
  const themeGroup = resolveThemeGroup(genreGroupFor(genre));

  const base = getAceGenreTagLine(genre, isSong);
  const narrative = pickGenreDiceNarrative(ACE_CAPTION_LAYER_LOCALE, themeGroup, args.mode, variant);
  const production = pickGenreDiceProduction(ACE_CAPTION_LAYER_LOCALE, args.mode, variant);
  const themeTags = [
    themeTagsFromDisplay(display),
    themeAceTagsFromDiceDisplay(display, args.locale),
    themeAceTagsFromPromptBankDisplay(display, args.locale),
  ]
    .filter(Boolean)
    .join(", ");
  const v2Hints = parseV2ProductionHints(display);
  const chips = stableGenreChips(genre, display);

  const seedTags = prebuilt ? parseCaptionSeedTags(prebuilt) : [];
  const layers = prebuilt
    ? [...seedTags, narrative, themeTags, v2Hints, chips, production]
    : [base, narrative, themeTags, v2Hints, chips, production];
  if (isSong) {
    const vocal = pickGenreDiceVocal(ACE_CAPTION_LAYER_LOCALE, themeGroup, variant);
    layers.splice(prebuilt ? seedTags.length + 2 : 3, 0, vocal);
  }

  let raw = trimAceCaption(layers);
  raw = dedupeGenreInCaption(raw, genre, display, prebuilt ? seedTags.join(", ") : base);
  raw = stripNonEnglishCaptionTags(raw);

  const normalized = normalizeAceCaption(raw, {
    mode: isSong ? "song" : "beat",
    instrumental: !isSong,
  }).caption;

  if (normalized.length > ACE_CAPTION_MAX_CHARS) {
    return normalized.slice(0, ACE_CAPTION_MAX_CHARS).replace(/[,\s]+$/g, "").trim();
  }
  return normalized;
}

/** @deprecated Alias — use buildRichAceCaption */
export function buildDiceAceCaptionFromDisplayRich(
  locale: AppLocale,
  mode: PromptMode,
  genre: string,
  displayPrompt: string,
  preferPrebuiltAce?: string | null,
): string {
  return buildRichAceCaption({
    display: displayPrompt,
    locale,
    mode,
    formGenre: genre,
    preferPrebuiltAce,
  });
}
