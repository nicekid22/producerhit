import type { Loop } from "@/types/loop";
import {
  downloadVisualizerVideo,
  exportVisualizerVideo,
} from "@/lib/visualizer/exportVideo";
import type { VisualizerExportOptions, VisualizerPresetId } from "@/lib/visualizer/types";

export type ShareVideoOptions = VisualizerExportOptions & {
  preset?: VisualizerPresetId;
};

/** Client-side 9:16 visual export — no server video hosting. */
export async function exportShareVideo(loop: Loop, options: ShareVideoOptions = {}): Promise<Blob> {
  const { blob } = await exportVisualizerVideo(loop, {
    durationSec: options.durationSec,
    preset: options.preset ?? "void",
    showWatermark: options.showWatermark,
    watermarkText: options.watermarkText,
    layout: options.layout ?? "story",
    fps: options.fps,
  });
  return blob;
}

export function downloadShareVideoBlob(
  loop: Loop,
  blob: Blob,
  layout: "story" | "square" = "story",
  platform?: "tiktok" | "instagram" | "youtube",
): void {
  downloadVisualizerVideo(loop, blob, layout, platform);
}
