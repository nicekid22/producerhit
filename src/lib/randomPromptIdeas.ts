import type { AppLocale } from "@/i18n/config";
import { POOLS_EN } from "@/lib/randomPromptIdeas/localePools/en";
import { POOLS_FR } from "@/lib/randomPromptIdeas/localePools/fr";
import { resolvePromptPools } from "@/lib/randomPromptIdeas/localePools";

export type PromptMode = "beat" | "song";

/**
 * ACE Step 1.5 XL Turbo — random dice captions.
 *
 * Official ACE 1.5 guidance (caption / tags field):
 * - Comma-separated keywords (≈5–12), not Suno-style prose
 * - Genre or subgenre first, then mood, 2–3 named instruments, timbre, production
 * - Specific instruments beat adjectives ("rhodes piano" > "sad")
 * - Avoid BPM/key here — ProducerHit sends those via autoMeta params
 * - Avoid "instrumental / no vocals" on beats — buildAceCaption adds them
 * - No conflicting pairs (lo-fi + hi-fi, aggressive + serene)
 *
 * These strings feed `params.prompt` → merged into buildAceCaption (140 char extra cap).
 */
export const ACE_DICE_CAPTION_MAX = 140;

export function formatAceDiceCaption(raw: string): string {
  const t = raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/,\s*,+/g, ", ")
    .replace(/,\s*$/g, "")
    .trim();
  if (t.length <= ACE_DICE_CAPTION_MAX) return t;
  return t.slice(0, ACE_DICE_CAPTION_MAX).replace(/[,\s]+$/g, "").trim();
}

/** Hero landing typewriter — phrases courtes lisibles (marketing), pas le format dice ACE. */
export const LANDING_HERO_PROMPTS_EN = POOLS_EN.hero;
export const LANDING_HERO_PROMPTS_FR = POOLS_FR.hero;

export function getHeroPromptPool(locale: AppLocale): readonly string[] {
  return resolvePromptPools(locale).hero;
}

export function getRandomPromptPool(locale: AppLocale, mode: PromptMode): readonly string[] {
  const pools = resolvePromptPools(locale);
  return mode === "song" ? pools.song : pools.beat;
}

export function pickRandomPrompt(locale: AppLocale, mode: PromptMode): string {
  const pool = getRandomPromptPool(locale, mode);
  if (pool.length === 0) return "";
  const raw = pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
  return formatAceDiceCaption(raw);
}

export function pickNextHeroPromptIndex(pool: readonly string[], current: number): number {
  if (pool.length <= 1) return 0;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * pool.length);
  }
  return next;
}
