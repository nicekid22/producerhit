/**
 * ACE-Step v1.5 XL Base quality defaults (aligned with official HF recommendations).
 * Keep in sync with supabase/functions/generate-loop-ace/index.ts
 * @see https://huggingface.co/ACE-Step/acestep-v15-xl-base
 */
export const ACE_QUALITY_DEFAULTS = {
  /** 5Hz LM generates audio codes (lm-dit) — major quality boost for text2music */
  thinking: true,
  /** AI Enhance — LM rewrites/enriches caption (+ lyrics when provided) */
  useFormat: true,
  /** Timestep shift — effective on base models; harmless/no-op on turbo */
  shift: 3,
  /** XL Base official: 50 steps with CFG (NOT 8 — that's Turbo only) */
  inferenceSteps: 50,
  /** Classifier-Free Guidance scale — XL Base official recommendation */
  guidanceScale: 7.0,
} as const;

/** Legacy ACE release_task + query_result (404 sur api.acemusic.ai depuis 2026).
 * Défaut : chat/completions uniquement. Rollback : VITE_ACE_RELEASE_TASK=1
 */
export function isAceReleaseTaskEnabled(): boolean {
  return import.meta.env.VITE_ACE_RELEASE_TASK === "1";
}

/** @deprecated Alias — préférer isAceReleaseTaskEnabled */
export function isAceSongQualityV2Enabled(): boolean {
  return isAceReleaseTaskEnabled();
}

export const ACE_RELEASE_MODEL = "acestep-v15-xl-base" as const;

export type AceQualityFlags = {
  thinking: boolean;
  useFormat: boolean;
  shift: number;
};

/** Derive release_task quality flags from request options. */
export function resolveAceQualityFlags(input: {
  thinking?: boolean | null;
  useFormat?: boolean | null;
  sampleMode?: boolean;
}): AceQualityFlags {
  const sampleMode = input.sampleMode === true;
  return {
    thinking: input.thinking !== false,
    // Sample mode auto-generates via LM — skip format enhancement to avoid double-processing
    useFormat: !sampleMode && input.useFormat !== false,
    shift: ACE_QUALITY_DEFAULTS.shift,
  };
}

export function appendAceQualityToParamObj(
  paramObj: Record<string, unknown>,
  shift = ACE_QUALITY_DEFAULTS.shift,
): Record<string, unknown> {
  if (typeof paramObj.shift !== "number") paramObj.shift = shift;
  if (typeof paramObj.inference_steps !== "number")
    paramObj.inference_steps = ACE_QUALITY_DEFAULTS.inferenceSteps;
  if (typeof paramObj.guidance_scale !== "number")
    paramObj.guidance_scale = ACE_QUALITY_DEFAULTS.guidanceScale;
  if (paramObj.cfg !== true) paramObj.cfg = true;
  return paramObj;
}
