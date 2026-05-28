import type { Loop } from "@/types/loop";

export type VisualizerPresetId = "prism" | "vhs" | "particles";

export type VisualizerLayout = "story" | "square";

export type VisualizerExportOptions = {
  durationSec?: number;
  preset?: VisualizerPresetId;
  showWatermark?: boolean;
  watermarkText?: string;
  layout?: VisualizerLayout;
  fps?: number;
};

export type RenderFrameContext = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  timeSec: number;
  loop: Loop;
  coverBitmap: ImageBitmap | null;
  bars: Float32Array;
  preset: VisualizerPresetId;
  showMetadata?: boolean;
  showWatermark?: boolean;
  watermarkText?: string;
  layout?: VisualizerLayout;
  /** Deterministic noise seed from loop id */
  seed: number;
};

export type PresetMeta = {
  id: VisualizerPresetId;
  labelFr: string;
  labelEn: string;
  hintFr: string;
  hintEn: string;
};
