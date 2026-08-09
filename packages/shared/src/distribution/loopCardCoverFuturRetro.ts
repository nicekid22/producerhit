import type { StructuredCoverPromptInput } from "./coverPrompt";

/**
 * Rollback instantané : passer à `false` (ou `LOOP_CARD_COVER_AESTHETIC = "classic"`)
 * pour revenir aux covers sans couche futur-rétro.
 */
export const LOOP_CARD_COVER_FUTUR_RETRO_ENABLED = false;

export type LoopCardCoverAesthetic = "classic" | "futurRetro";

/** Alias explicite pour rollback / A-B test. */
export const LOOP_CARD_COVER_AESTHETIC: LoopCardCoverAesthetic = LOOP_CARD_COVER_FUTUR_RETRO_ENABLED
  ? "futurRetro"
  : "classic";

const FUTUR_RETRO_PALETTES = [
  "holographic cyan magenta iridescent",
  "deep violet laser amber glow",
  "midnight teal with hot pink flare",
  "chrome silver on void black",
  "sunset orange fading into electric blue",
  "phosphor green CRT on charcoal",
  "oil-slick rainbow on navy",
  "dusty rose neon bleed on indigo",
  "anime sunset violet pink cyan",
  "manga ink black with neon magenta accent",
] as const;

const FUTUR_RETRO_LIGHTING = [
  "volumetric fog with neon spill",
  "hologram projection glow",
  "CRT scanline phosphor bloom",
  "analog light leak streak",
  "rim light through heavy grain haze",
  "underlit gradient mesh glow",
  "laser grid floor reflection",
  "soft bloom on chromatic edges",
  "anime rim light cel-shade glow",
  "manga high-contrast ink shadow",
] as const;

/** Courtes finitions « wow » — grain, hologramme, glitch, manga. */
const FUTUR_RETRO_FINISHES = [
  "heavy film grain",
  "holographic foil shimmer",
  "VHS chromatic drift",
  "degraded gradient mesh",
  "retro-future mystery mood",
  "analog noise overlay",
  "iridescent chrome highlights",
  "soft gaussian glow halo",
  "scanline texture subtle",
  "light leak color wash",
  "RGB glitch tear bands",
  "manga screentone halftone overlay",
  "cel-shaded ink edge glow",
  "datamosh smear subtle",
  "anime speed line motion streaks",
  "pixel sorting glitch wash",
] as const;

const GLITCH_ANIME_ACCENTS = [
  "manga panel frame collage",
  "anime lens flare streak",
  "glitch chromatic aberration",
  "halftone dot screentone texture",
] as const;

const MYSTERY_MOODS = ["mysterious", "hypnotic", "ethereal", "cinematic"] as const;

function hashPick(seed: number, length: number): number {
  let t = (seed >>> 0) + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) % Math.max(1, length);
}

export function pickFuturRetroFinish(seed: number): string {
  return FUTUR_RETRO_FINISHES[hashPick(seed + 11, FUTUR_RETRO_FINISHES.length)]!;
}

/**
 * Enrichit une suggestion cover (grain, hologramme, dégradés) sans écraser le sujet.
 */
export function enrichLoopCardCoverForFuturRetro(
  input: StructuredCoverPromptInput,
  seed: number,
): StructuredCoverPromptInput {
  if (!LOOP_CARD_COVER_FUTUR_RETRO_ENABLED) return input;

  const roll = hashPick(seed + 3, 10);
  const palette =
    roll < 6
      ? FUTUR_RETRO_PALETTES[hashPick(seed + 5, FUTUR_RETRO_PALETTES.length)]!
      : input.palette;

  const lighting =
    roll < 7
      ? FUTUR_RETRO_LIGHTING[hashPick(seed + 7, FUTUR_RETRO_LIGHTING.length)]!
      : input.lighting;

  const mood =
    roll < 4 || MYSTERY_MOODS.includes(input.mood as (typeof MYSTERY_MOODS)[number])
      ? MYSTERY_MOODS[hashPick(seed + 9, MYSTERY_MOODS.length)]!
      : input.mood;

  const finish = pickFuturRetroFinish(seed);
  const accent =
    hashPick(seed + 19, 10) < 4
      ? GLITCH_ANIME_ACCENTS[hashPick(seed + 21, GLITCH_ANIME_ACCENTS.length)]!
      : "";

  const styleParts = [input.style, finish];
  if (accent) styleParts.push(accent);
  const style = styleParts.join(", ");

  return { ...input, mood, palette, lighting, style };
}
