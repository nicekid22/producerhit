import { buildStructuredCoverPrompt } from "./coverPrompt";
import { pickCoverSurpriseSuggestion } from "./coverSurpriseLibrary";

const CARD_STYLE_SUFFIX = "no faces, no text, no logo";
const LOOP_CARD_PROMPT_MAX = 220;
const LOOP_CARD_CORE_PROMPT_MAX = 168;

/**
 * Prompt Pollinations pour les cartes audio (workspace / bibliothèque).
 * Scènes, objets, paysages, textures — aligné genre/mood, sans visages ni texte.
 */
export function buildLoopCardCoverPrompt(
  loop: {
    genre?: string;
    mood?: string;
    influence?: string;
    name?: string;
    prompt?: string;
    seed?: number | null;
    id?: string;
  },
  options?: { seed?: number },
): string {
  const seedBase =
    options?.seed ??
    (typeof loop.seed === "number" && Number.isFinite(loop.seed) ? loop.seed : undefined) ??
    hashLoopSeed(loop.id ?? loop.genre ?? "loop");

  const structured = pickCoverSurpriseSuggestion(loop, { seed: seedBase, favorGenre: true });
  const core = buildStructuredCoverPrompt(
    {
      ...structured,
      style: structured.style,
    },
    { maxLength: LOOP_CARD_CORE_PROMPT_MAX },
  );
  const genreTag = loop.genre?.trim() ? `${loop.genre} music vibe` : "";
  const moodTag = loop.mood?.trim() ? `${loop.mood} mood` : "";

  let combined = [genreTag, moodTag, core]
    .filter((p) => p.length > 0)
    .join(", ")
    .replace(/\s+/g, " ");

  const guardSuffix = `, ${CARD_STYLE_SUFFIX}`;
  if (combined.length + guardSuffix.length > LOOP_CARD_PROMPT_MAX) {
    combined = combined.slice(0, LOOP_CARD_PROMPT_MAX - guardSuffix.length).replace(/,\s*$/, "");
  }
  combined += guardSuffix;

  return combined.slice(0, LOOP_CARD_PROMPT_MAX);
}

function hashLoopSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
