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
  "museum-grade contemporary installation, sculptural composition, luxury gallery aesthetic, subtle imperfections, tactile materials, soft architectural light, no text",
  "hand-carved translucent resin artwork, floating geometry, premium collectible design, monochromatic palette, refined shadows, no text",
  "editorial still life with impossible objects, luxury product photography, soft bloom, elegant composition, muted palette, no text",
  "liquid chrome sculpture emerging from velvet darkness, museum lighting, refined reflections, premium aesthetic, no text",
  "minimal brutalist composition with handcrafted textures, gallery exhibition atmosphere, sophisticated color harmony, no text",
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
