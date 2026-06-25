import type { AppLocale } from "../../i18n/locales";
import type { AceProseMode } from "./lexicon";
import { generateAceProsePrompt, generateUniqueAceProsePool, mulberry32 } from "./generate";
import { looksLikeAceProsePrompt, optimizeAceProsePrompt } from "./optimize";
import { ACE_PROSE_BEAT_POOL, ACE_PROSE_SONG_POOL } from "./pool500.generated";
import { ACE_PROSE_LOCALE_POOLS } from "./poolLocales.generated";
import {
  ACE_PROSE_LOCALE_SEEDS,
  resolveAceProseLocale,
  type AceProseLocale,
} from "./locales";

export type { AceProseMode };
export {
  generateAceProsePrompt,
  generateUniqueAceProsePool,
  isValidAceProsePrompt,
  classifyAceProseMode,
  mulberry32,
  ACE_PROSE_PROMPT_MAX,
} from "./generate";
export {
  looksLikeAceProsePrompt,
  optimizeAceProsePrompt,
  proseToAceTags,
  sanitizeBeatAceCaption,
  type OptimizeAceProseOptions,
} from "./optimize";
export {
  resolveAceProseLocale,
  getAceProseLexicon,
  listAceProseLocales,
  type AceProseLocale,
} from "./locales";
export * from "./lexicon";

const poolCache = new Map<string, readonly string[]>();

function poolCacheKey(locale: AceProseLocale, mode: AceProseMode): string {
  return `${locale}:${mode}`;
}

function buildLocalePool(locale: AceProseLocale, mode: AceProseMode): readonly string[] {
  if (locale === "en") {
    return mode === "song" ? ACE_PROSE_SONG_POOL : ACE_PROSE_BEAT_POOL;
  }
  const localized = ACE_PROSE_LOCALE_POOLS[locale];
  if (localized) {
    return mode === "song" ? localized.song : localized.beat;
  }
  const key = poolCacheKey(locale, mode);
  const cached = poolCache.get(key);
  if (cached) return cached;
  const startSeed = ACE_PROSE_LOCALE_SEEDS[locale] ?? 10_000;
  const generated = generateUniqueAceProsePool(mode, 250, startSeed, locale);
  poolCache.set(key, generated);
  return generated;
}

/** Pool curated — EN statique 500 ; autres locales pré-générées (250+250). */
export function getAceProseCuratedPool(
  mode: AceProseMode,
  locale: AceProseLocale | AppLocale = "en",
): readonly string[] {
  const resolved = resolveAceProseLocale(locale as AppLocale);
  return buildLocalePool(resolved, mode);
}

export type PickAceProseOptions = {
  seed?: number;
  /** 0–1 : fraction de rolls dynamiques (défaut 0.35). */
  dynamicRatio?: number;
  locale?: AceProseLocale | AppLocale;
};

/**
 * Pick ACE prose — opener langue UI + production EN.
 */
export function pickAceProsePrompt(mode: AceProseMode, options?: PickAceProseOptions): string {
  const seed = options?.seed ?? Date.now();
  const locale = resolveAceProseLocale((options?.locale ?? "en") as AppLocale);
  const rng = mulberry32(seed);
  const dynamicRatio = options?.dynamicRatio ?? 0.35;
  const useDynamic = rng() < dynamicRatio;

  const raw = useDynamic
    ? generateAceProsePrompt(mode, Math.floor(rng() * 1_000_000) + seed, locale)
    : pickFromCurated(mode, seed, rng, locale);

  return optimizeAceProsePrompt(raw, { mode });
}

function pickFromCurated(
  mode: AceProseMode,
  seed: number,
  rng: () => number,
  locale: AceProseLocale,
): string {
  const pool = getAceProseCuratedPool(mode, locale);
  if (!pool.length) return generateAceProsePrompt(mode, seed, locale);
  const idx = Math.floor(rng() * pool.length);
  return pool[idx] ?? pool[0]!;
}

export function getAceProsePoolStats(locale: AceProseLocale | AppLocale = "en"): {
  song: number;
  beat: number;
  total: number;
  locale: AceProseLocale;
} {
  const resolved = resolveAceProseLocale(locale as AppLocale);
  const song = getAceProseCuratedPool("song", resolved).length;
  const beat = getAceProseCuratedPool("beat", resolved).length;
  return { song, beat, total: song + beat, locale: resolved };
}
