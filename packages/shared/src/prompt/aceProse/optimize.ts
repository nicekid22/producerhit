import { ACE_PROSE_PROMPT_MAX, classifyAceProseMode } from "./generate";
import type { AceProseMode } from "./lexicon";
import { normalizeAceCaption } from "../acePromptContract";

const VAGUE_IN_THEME: Record<string, string> = {
  nice: "tender",
  good: "meaningful",
  cool: "electric",
  amazing: "unforgettable",
  beautiful: "bittersweet",
  vibe: "moment",
  vibes: "energy",
};

const GENRE_ALIASES: Record<string, string> = {
  hiphop: "boom bap",
  "hip-hop": "melodic trap",
  rnb: "contemporary R&B",
  edm: "future bass",
  dnb: "drum and bass",
  ukg: "UK garage",
};

const PRODUCTION_BOOSTERS_SONG = ["heavy 808", "cinematic atmosphere", "crisp hi-hats"];
const PRODUCTION_BOOSTERS_BEAT = ["heavy 808", "cinematic atmosphere", "wide reverb"];

const PROSE_GENRE_PATTERNS: RegExp[] = [
  /^(.+?)\s+(?:song|beat)\s+about\s+/i,
  /^(.+?)\s+chanson\s+sur\s+/i,
  /^(.+?)\s+beat\s+sur\s+/i,
  /^(.+?)\s+canción\s+sobre\s+/i,
  /^(.+?)\s+canzone\s+su\s+/i,
];

const PROSE_THEME_PATTERNS: RegExp[] = [
  /\babout\s+(.+)$/i,
  /\bsur\s+(.+)$/i,
  /\bsobre\s+(.+)$/i,
  /\bsu\s+(.+)$/i,
  /\büber\s+(.+)$/i,
  /عن\s+(.+)$/,
];

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Retire les tags vocaux d’un caption beat avant envoi ACE. */
export function sanitizeBeatAceCaption(caption: string): string {
  return normalizeAceCaption(caption, { mode: "beat", instrumental: true }).caption;
}

function applyGenreAliases(text: string): string {
  let out = text;
  for (const [alias, genre] of Object.entries(GENRE_ALIASES)) {
    out = out.replace(new RegExp(`\\b${alias}\\b`, "gi"), genre);
  }
  return out;
}

function polishTheme(theme: string): string {
  let out = theme.trim();
  for (const [vague, specific] of Object.entries(VAGUE_IN_THEME)) {
    out = out.replace(new RegExp(`\\b${vague}\\b`, "gi"), specific);
  }
  return out;
}

function ensureTwoPartStructure(text: string): { opener: string; tail: string } {
  const t = normalizeWhitespace(text);
  const dotIdx = t.indexOf(". ");
  if (dotIdx > 0) {
    return { opener: t.slice(0, dotIdx).trim(), tail: t.slice(dotIdx + 2).trim() };
  }
  const aboutMatch = t.match(/^(.+?\b(?:song|beat)\s+about\s+)(.+)$/i);
  if (aboutMatch) {
    const prefix = aboutMatch[1]!.trim();
    const rest = aboutMatch[2]!.trim();
    const comma = rest.indexOf(",");
    if (comma > 0 && comma < rest.length - 8) {
      return { opener: `${prefix}${rest.slice(0, comma).trim()}`, tail: rest.slice(comma + 1).trim() };
    }
    return { opener: `${prefix}${rest}`, tail: "" };
  }
  return { opener: t, tail: "" };
}

function ensureProductionTail(tail: string, mode: "song" | "beat"): string {
  let out = tail.trim();
  const hasProduction =
    /\b(808|drums|rhodes|piano|guitar|bass|synth|pads|hi-hat|kick|snare|sub|reverb|mix|vocoder|organ|choir|cowbell|dembow|log drum)\b/i.test(
      out,
    );
  if (!hasProduction) {
    const boosters = mode === "song" ? PRODUCTION_BOOSTERS_SONG : PRODUCTION_BOOSTERS_BEAT;
    out = out ? `${boosters.join(", ")}, ${out}` : boosters.join(", ");
  }
  if (mode === "beat") {
    out = out.replace(/\b(male vocal|female vocal|harmonies|spoken-word vocal|vocal runs)\b/gi, "wide stereo");
  }
  return out.replace(/,\s*,/g, ", ").replace(/,\s*$/g, "").trim();
}

function extractProseGenre(opener: string, mode: AceProseMode): string {
  for (const re of PROSE_GENRE_PATTERNS) {
    const m = opener.match(re);
    if (m?.[1]) return normalizeWhitespace(m[1]);
  }
  const kind = mode === "song" ? "song" : "beat";
  return opener.split(/\s+/).slice(0, 4).join(" ") || kind;
}

function extractProseTheme(opener: string): string {
  for (const re of PROSE_THEME_PATTERNS) {
    const m = opener.match(re);
    if (m?.[1]) {
      const theme = polishTheme(m[1].split(/[,.]/)[0]?.trim() ?? "");
      if (theme) return theme.length > 56 ? theme.slice(0, 56).trim() : theme;
    }
  }
  return "";
}

function splitProductionTags(tail: string): string[] {
  return tail
    .split(",")
    .map((t) => normalizeWhitespace(t))
    .filter(Boolean);
}

/** Convertit une prose ACE (dé / landing) en caption tags normalisé. */
export function proseToAceTags(raw: string, mode: AceProseMode): string {
  const input = normalizeWhitespace(applyGenreAliases(raw));
  if (!input) return "";

  const { opener: rawOpener, tail: rawTail } = ensureTwoPartStructure(input);
  const genre = extractProseGenre(rawOpener, mode);
  const theme = extractProseTheme(rawOpener);
  const production = ensureProductionTail(rawTail, mode);
  const productionTags = splitProductionTags(
    production.replace(/\b(deep|breathy|smooth|raspy|airy)\s+(male|female)\s+vocal\b/gi, "clean studio vocal"),
  );

  const tags = [
    genre,
    theme ? `${theme} mood` : "",
    ...productionTags,
    mode === "song" ? "radio-ready mix" : "polished mix",
  ].filter(Boolean);

  return normalizeAceCaption(tags.join(", "), {
    mode: mode === "beat" ? "beat" : "song",
    instrumental: mode === "beat",
  }).caption;
}

export type OptimizeAceProseOptions = {
  /** Force song/beat — prioritaire sur la détection automatique (dé, placeholder). */
  mode?: AceProseMode;
};

/**
 * Convertit une prose ACE en caption tags (comma-separated EN).
 */
export function optimizeAceProsePrompt(raw: string, options?: OptimizeAceProseOptions): string {
  const input = normalizeWhitespace(applyGenreAliases(raw));
  if (!input) return "";

  const mode = options?.mode ?? classifyAceProseMode(input);
  const tags = proseToAceTags(raw, mode);
  if (tags.length > ACE_PROSE_PROMPT_MAX) {
    return tags.slice(0, ACE_PROSE_PROMPT_MAX).replace(/[,\s]+$/g, "").trim();
  }
  return tags;
}

export function looksLikeAceProsePrompt(text: string): boolean {
  const t = text.trim();
  if (!t || t.length < 50) return false;
  if (
    !/\b(song|beat)\s+about\b/i.test(t) &&
    !/\b(chanson|beat)\b.+\b(sur|sobre|su)\b/i.test(t) &&
    !/\b(canción|música)\b.+\b(sobre)\b/i.test(t) &&
    !/\bcanzone\b.+\b(su)\b/i.test(t) &&
    !/(?:Song|Beat)\b.+über/i.test(t) &&
    !/\bbeat\b.+عن/i.test(t) &&
    !/أغنية.+عن/.test(t) &&
    !/テーマは/.test(t) &&
    !/테마는/.test(t) &&
    !/主题是/.test(t)
  ) {
    return false;
  }
  if (!/[。.]\s+/.test(t)) return false;
  const commas = (t.match(/,/g) || []).length;
  return commas >= 1 && commas <= 8;
}
