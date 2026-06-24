import { ACE_PROSE_PROMPT_MAX, classifyAceProseMode } from "./generate";
import type { AceProseMode } from "./lexicon";

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

const VOCAL_DEFAULTS = ["deep male vocal", "breathy female vocal", "smooth male vocal"];

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

const BEAT_VOCAL_TAGS =
  /\b(deep |breathy |smooth |raspy |airy )?(male|female) vocal\b|\bharmonies\b|\bchoir\b|\bspoken-word\b|\bvocal runs\b|\bclear lead vocals\b/gi;

/** Retire les tags vocaux d’un caption beat avant envoi ACE. */
export function sanitizeBeatAceCaption(caption: string): string {
  return caption
    .replace(BEAT_VOCAL_TAGS, "wide stereo")
    .replace(/,\s*,/g, ", ")
    .replace(/,\s*$/g, "")
    .trim();
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
  if (mode === "song" && !/\b(vocal|harmonies|choir|spoken-word|lead)\b/i.test(out)) {
    out = `${out}, ${VOCAL_DEFAULTS[Math.abs(out.length) % VOCAL_DEFAULTS.length]}`;
  }
  if (mode === "beat") {
    out = out.replace(/\b(male vocal|female vocal|harmonies|spoken-word vocal|vocal runs)\b/gi, "wide stereo");
  }
  return out.replace(/,\s*,/g, ", ").replace(/,\s*$/g, "").trim();
}

function capitalizeOpener(opener: string): string {
  const t = opener.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export type OptimizeAceProseOptions = {
  /** Force song/beat — prioritaire sur la détection automatique (dé, placeholder). */
  mode?: AceProseMode;
};

/**
 * Suno-style optimizer: 2 phrases, instruments concrets, vocal si chanson.
 */
export function optimizeAceProsePrompt(raw: string, options?: OptimizeAceProseOptions): string {
  const input = normalizeWhitespace(applyGenreAliases(raw));
  if (!input) return "";

  const mode = options?.mode ?? classifyAceProseMode(input);
  const { opener: rawOpener, tail: rawTail } = ensureTwoPartStructure(input);

  const aboutIdx = rawOpener.search(/\babout\s+/i);
  let opener = rawOpener;
  if (aboutIdx >= 0) {
    const head = rawOpener.slice(0, aboutIdx + 6);
    const theme = polishTheme(rawOpener.slice(aboutIdx + 6));
    opener = `${head}${theme}`;
  }

  const tail = ensureProductionTail(rawTail, mode);
  let out = tail ? `${capitalizeOpener(opener)}. ${tail}` : capitalizeOpener(opener);

  if (out.length > ACE_PROSE_PROMPT_MAX) {
    out = out.slice(0, ACE_PROSE_PROMPT_MAX).replace(/[,\s]+$/g, "").trim();
  }
  return mode === "beat" ? sanitizeBeatAceCaption(out) : out;
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
