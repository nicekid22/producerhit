/**
 * ACE playground « negative step » — champs LM CFG (voir docs ACE-Step lm_negative_prompt).
 * Envoyés en top-level sur /v1/chat/completions (acemusic + self-host).
 */
export const MELODY_COMPOSITION_LM_NEGATIVE_PROMPT =
  "drums, drum kit, drum loop, kick drum, snare, clap, hi-hat, hi hats, percussion, 808 bass, trap drums, beat programming, rhythm section, boom bap drums, four on the floor";

/** Champs à fusionner dans le body chat/completions quand melodyComposition=true. */
export function aceMelodyCompositionAceFields(): Record<string, unknown> {
  const neg = MELODY_COMPOSITION_LM_NEGATIVE_PROMPT;
  return {
    lm_negative_prompt: neg,
    negative_prompt: neg,
    /** CFG > 1 requis pour que le negative prompt ait un effet (doc ACE-Step). */
    lm_cfg_scale: 2.8,
  };
}
