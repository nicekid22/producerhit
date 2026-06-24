import type { AceProseMode } from "./lexicon";
import {
  ACE_PROSE_GENRES_BEAT,
  ACE_PROSE_GENRES_SONG,
  ACE_PROSE_PRODUCTION_BEAT,
  ACE_PROSE_PRODUCTION_SONG,
  ACE_PROSE_VOCALS_EXTRA,
} from "./lexicon";
import {
  getAceProseLexicon,
  resolveAceProseLocale,
  type AceProseLocale,
} from "./locales";
import type { AppLocale } from "../i18n/locales";

export const ACE_PROSE_PROMPT_MAX = 240;

/** Mulberry32 — deterministic seeded RNG. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, pool: readonly T[]): T {
  return pool[Math.floor(rng() * pool.length)]!;
}

function buildOpener(
  locale: AceProseLocale,
  mode: AceProseMode,
  rng: () => number,
): string {
  const lex = getAceProseLexicon(locale);
  const moodA = pick(rng, lex.moods);
  const moodB = pick(rng, lex.moodsB);
  const genre = pick(rng, mode === "song" ? ACE_PROSE_GENRES_SONG : ACE_PROSE_GENRES_BEAT);
  const theme = pick(rng, lex.themes);
  return lex.buildOpener({ mode, moodA, moodB, genre, theme });
}

function buildTail(mode: AceProseMode, rng: () => number): string {
  if (mode === "beat") {
    return pick(rng, ACE_PROSE_PRODUCTION_BEAT);
  }
  const base = pick(rng, ACE_PROSE_PRODUCTION_SONG);
  if (/\b(vocal|lead|choir|spoken-word)\b/i.test(base)) return base;
  return `${base}, ${pick(rng, ACE_PROSE_VOCALS_EXTRA)}`;
}

function trimPrompt(opener: string, tail: string): string {
  const cleanOpener = opener.replace(/[。.．]\s*$/u, "").trim();
  const full = `${cleanOpener}. ${tail}`;
  if (full.length <= ACE_PROSE_PROMPT_MAX) return full;
  const shortTail = tail
    .split(",")
    .slice(0, 3)
    .join(",")
    .trim();
  return `${opener}. ${shortTail}`.slice(0, ACE_PROSE_PROMPT_MAX).replace(/[,\s]+$/g, "").trim();
}

/** Infinite combinatorial ACE prose — opener localisé + production EN. */
export function generateAceProsePrompt(
  mode: AceProseMode,
  seed = Date.now(),
  locale: AceProseLocale | AppLocale = "en",
): string {
  const resolved = typeof locale === "string" && locale.length === 2
    ? resolveAceProseLocale(locale as AppLocale)
    : (locale as AceProseLocale);
  const rng = mulberry32(typeof seed === "number" ? seed : 0);
  const opener = buildOpener(resolved, mode, rng);
  const tail = buildTail(mode, rng);
  return trimPrompt(opener, tail);
}

const OPENER_MARKERS =
  /\b(song|beat)\s+about\b|\b(chanson|beat)\b.+\b(sur|sobre|su)\b|\b(canción|música)\b.+\bsobre\b|\bcanzone\b.+\bsu\b|(?:Song|Beat)\b.+über|\bbeat\b.+عن|أغنية.+عن|テーマは|테마는|主题是/i;

/** Song vs beat — même heuristique que la validation des pools. */
export function classifyAceProseMode(text: string): AceProseMode {
  const t = text.trim();
  const isBeat =
    /\bbeat\s+about\b/i.test(t) ||
    /\bbeat\b.+\b(sur|sobre|su|about)\b/i.test(t) ||
    /\bbeat\b.+عن/.test(t) ||
    /-Beat\b.+über/i.test(t) ||
    (/(ビート|비트|伴奏)/.test(t) && /(テーマは|테마는|主题是)/.test(t)) ||
    (/\bbeat\b/i.test(t) &&
      !/\b(chanson|canción|canzone|song|música|أغنية|歌曲|ソング|송|-Song\b)/i.test(t) &&
      !/أغنية/.test(t));
  return isBeat ? "beat" : "song";
}

export function isValidAceProsePrompt(text: string, mode?: AceProseMode): boolean {
  const t = text.trim();
  if (t.length < 50 || t.length > ACE_PROSE_PROMPT_MAX) return false;
  if (!OPENER_MARKERS.test(t)) return false;
  if (!/[。.]\s+/.test(t)) return false;
  const kind = classifyAceProseMode(t);
  if (mode && mode !== kind) return false;
  if (kind === "song" && !/\b(vocal|lead|choir|spoken-word|harmonies)\b/i.test(t)) return false;
  if (kind === "beat" && /\b(male vocal|female vocal|harmonies)\b/i.test(t)) return false;
  return true;
}

export function generateUniqueAceProsePool(
  mode: AceProseMode,
  count: number,
  startSeed = 1,
  locale: AceProseLocale | AppLocale = "en",
): string[] {
  const resolved = typeof locale === "string" && locale.length === 2
    ? resolveAceProseLocale(locale as AppLocale)
    : (locale as AceProseLocale);
  const seen = new Set<string>();
  const out: string[] = [];
  let seed = startSeed;
  const maxAttempts = count * 40;
  for (let attempt = 0; attempt < maxAttempts && out.length < count; attempt += 1) {
    seed += 1;
    const prompt = generateAceProsePrompt(mode, seed, resolved);
    const key = prompt.toLowerCase();
    if (seen.has(key) || !isValidAceProsePrompt(prompt, mode)) continue;
    seen.add(key);
    out.push(prompt);
  }
  return out;
}
