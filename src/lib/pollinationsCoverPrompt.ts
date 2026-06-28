import {
  pickCoverSurpriseSuggestion,
  buildCoverPromptSuggestionsFromLoop,
  buildStructuredCoverPrompt,
  COVER_PROMPT_MAX_LENGTH,
  type StructuredCoverPromptInput,
} from "@producerhit/shared";
import { buildCoverPromptSnapshot, shuffleArray } from "@/lib/utils";
import type { Loop } from "@/types/loop";

export {
  COVER_PROMPT_MAX_LENGTH,
  buildStructuredCoverPrompt,
  pickCoverSurpriseSuggestion,
};
export type { StructuredCoverPromptInput };

const STYLE_TAILS = [
  "anime key visual, expressive manga composition, vibrant cel shading, dramatic lighting, premium illustration, no text",
  "kawaii dreamcore, pastel palette, plush aesthetic, cute floating objects, magical sparkle, soft gradients, premium artwork, no text",
  "glitchcore anime, digital corruption, RGB split, CRT scanlines, holographic distortion, cyber aesthetic, dark background, no text",
  "retro 90s manga cover, vintage print texture, halftone shading, bold ink lines, nostalgic Japanese magazine aesthetic, no text",
  "anime street fashion editorial, Harajuku inspired, colorful accessories, glossy finish, dynamic pose, premium illustration, no text",
  "vaporwave anime, neon sunset, chrome reflections, retro grid horizon, dreamy atmosphere, high contrast, no text",
  "dark anime fantasy, cursed symbols, crimson moonlight, cinematic composition, gothic elegance, premium artwork, no text",
  "chibi kawaii chaos, oversized expressions, candy colors, playful composition, adorable mascot energy, polished illustration, no text",
  "cyber anime heroine, holographic armor, neon rain, futuristic Tokyo nightlife, cinematic lighting, premium concept art, no text",
  "surreal manga dreamscape, impossible architecture, floating sakura petals, ethereal lighting, emotional atmosphere, no text",
] as const;

/** Legacy free-form suggestions (dé). */
export function buildPollinationsCoverPromptSuggestions(loop: Pick<Loop, "prompt" | "genre" | "mood" | "influence" | "name">): string[] {
  const structured = buildCoverPromptSuggestionsFromLoop(loop);
  const fromStructured = structured.map((s) => buildStructuredCoverPrompt(s));

  const base = buildCoverPromptSnapshot(loop).trim();
  const tails = shuffleArray(STYLE_TAILS);
  const legacy: string[] = [];
  if (base) {
    for (const tail of tails.slice(0, 2)) {
      legacy.push(`${base}, ${tail}`.slice(0, COVER_PROMPT_MAX_LENGTH));
    }
  }

  return [...new Set([...fromStructured, ...legacy])].slice(0, 8);
}

export function randomStructuredCoverSuggestion(
  loop: Pick<Loop, "prompt" | "genre" | "mood" | "influence" | "name">,
  seed?: number,
): StructuredCoverPromptInput {
  return pickCoverSurpriseSuggestion(loop, { seed });
}