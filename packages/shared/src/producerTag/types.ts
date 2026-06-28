export const PRODUCER_TAG_CREDIT_COST = 1;

export const PRODUCER_TAG_MAX_DURATION_SEC = 8;
export const PRODUCER_TAG_MIN_DURATION_SEC = 0.5;

/** Phase 1 placements */
export type ProducerTagPlacementBasic = "intro" | "outro";

/** Phase 2+ extended placements */
export type ProducerTagPlacementExtended =
  | ProducerTagPlacementBasic
  | "pre_drop"
  | "bar_8"
  | "bar_16"
  | "random_bars"
  | "smart_intro";

export type ProducerTagPlacement = ProducerTagPlacementExtended;

export type ProducerTagFxPreset =
  | "clean"
  | "radio"
  | "reverb"
  | "phone"
  | "pitch_up"
  | "pitch_down";

export type ProducerTagSettings = {
  volumeDb?: number;
  fxPreset?: ProducerTagFxPreset;
  defaultPlacement?: ProducerTagPlacement;
  fadeMs?: number;
};

export type ProducerTagVariant = {
  id: string;
  label: string;
  storagePath: string;
  fxPreset: ProducerTagFxPreset;
};

export type LoopProducerTagMeta = {
  tagId: string;
  tagName: string;
  placement: ProducerTagPlacement;
  appliedAt: string;
  originalAudioPath?: string;
  volumeDb?: number;
  fxPreset?: ProducerTagFxPreset;
  variantId?: string;
  creditConsumed?: boolean;
};

export type ProducerTagRecord = {
  id: string;
  name: string;
  storage_path: string;
  duration_sec: number | null;
  settings_json: ProducerTagSettings;
  created_at: string;
};

export const PRODUCER_TAG_MAX_BY_PLAN: Record<string, number> = {
  free: 0,
  pro: 2,
  studio: 5,
  plus: 10,
};

export function producerTagMaxCount(plan: string | null | undefined): number {
  const p = plan ?? "free";
  if (p === "plus") return 10;
  if (p === "studio") return 5;
  if (p === "pro") return 2;
  return 0;
}

export function canUseProducerTag(plan: string | null | undefined): boolean {
  return producerTagMaxCount(plan) > 0;
}

export function producerTagUsageKey(userId: string, loopId: string): string {
  return `producer-tag:${userId}:${loopId}`;
}

export function canUseProducerTagFx(plan: string | null | undefined): boolean {
  const p = plan ?? "free";
  return p === "studio" || p === "plus";
}

export function canUseExtendedProducerTagPlacement(plan: string | null | undefined): boolean {
  return canUseProducerTagFx(plan);
}
