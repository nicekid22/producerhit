import { getAceModelForQuality, type AceModelQuality } from "./types";

export const ACE_QUALITY_DEFAULTS = {
  thinking: true,
  useFormat: true,
  shift: 3,
  inferenceSteps: 8,
} as const;

export type AceQualityFlags = {
  thinking: boolean;
  useFormat: boolean;
  shift: number;
};

/** Default model quality tier */
export const DEFAULT_ACE_MODEL_QUALITY: AceModelQuality = "base";

/** Get the ACE model name for a given quality tier */
export function resolveAceModel(quality?: AceModelQuality | null): string {
  return getAceModelForQuality(quality ?? DEFAULT_ACE_MODEL_QUALITY);
}

export function resolveAceQualityFlags(input: {
  thinking?: boolean | null;
  useFormat?: boolean | null;
  sampleMode?: boolean;
}): AceQualityFlags {
  const sampleMode = input.sampleMode === true;
  return {
    thinking: input.thinking !== false,
    useFormat: !sampleMode && input.useFormat !== false,
    shift: ACE_QUALITY_DEFAULTS.shift,
  };
}
