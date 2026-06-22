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
