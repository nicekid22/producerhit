import type { Loop } from "@/types/loop";
import { hashString } from "@/lib/utils";
import { loadCoverBitmap } from "@/lib/visualizer/coverLoader";
import { loadCdSleeveTexture } from "@/lib/visualizer/cdSleeveOverlay";
import { animateFakeBars, BAR_COUNT, createBarBuffer } from "@/lib/visualizer/frequencyBars";
import { canvasSizeForLayout, renderVisualizerFrame, resolveExportDuration } from "@/lib/visualizer/renderFrame";
import { exportCanvasToMp4, supportsShareMp4Export } from "@/lib/visualizer/exportShareMp4";
import { exportCanvasViaMediaRecorder, recorderMimeIsMp4 } from "@/lib/visualizer/exportViaMediaRecorder";
import { buildShareVideoFilename } from "@/lib/sharePlatform";
import type { SharePlatform } from "@/lib/sharePlatform";
import { primeCdSleeveTexture } from "@/lib/visualizer/sleeveFrame";
import type { VisualizerExportOptions, VisualizerPresetId } from "@/lib/visualizer/types";

export { supportsShareMp4Export };

export type ShareVideoBlob = {
  blob: Blob;
  /** True when the blob is H.264 MP4 (WebCodecs or native recorder). */
  isMp4: boolean;
};

export async function exportVisualizerVideo(loop: Loop, options: VisualizerExportOptions = {}): Promise<ShareVideoBlob> {
  if (!loop.audioUrl) throw new Error("missing_audio");

  const layout = options.layout ?? "story";
  const preset: VisualizerPresetId = options.preset ?? "void";
  const durationSec = resolveExportDuration(loop, options.durationSec);
  const fps = options.fps ?? 30;
  const showWatermark = options.showWatermark !== false;
  const watermarkText = options.watermarkText ?? "made with ProducerHit";
  const { width: w, height: h } = canvasSizeForLayout(layout);
  const seed = hashString(loop.id);

  const [coverBitmap, cdTexture] = await Promise.all([loadCoverBitmap(loop, 1024), loadCdSleeveTexture()]);
  primeCdSleeveTexture(cdTexture);

  const bars = createBarBuffer(BAR_COUNT);

  const renderFrame = (ctx: CanvasRenderingContext2D, t: number, dt: number) => {
    animateFakeBars(bars, t);
    renderVisualizerFrame(
      {
        ctx,
        width: w,
        height: h,
        timeSec: t,
        loop,
        coverBitmap,
        bars,
        preset,
        showMetadata: true,
        showWatermark,
        watermarkText,
        layout,
        seed,
      },
      dt,
    );
  };

  try {
    try {
      const blob = await exportCanvasToMp4({
        width: w,
        height: h,
        durationSec,
        fps,
        audioUrl: loop.audioUrl,
        loopId: loop.id,
        renderFrame,
      });
      return { blob, isMp4: true };
    } catch {
      const blob = await exportCanvasViaMediaRecorder({
        width: w,
        height: h,
        durationSec,
        fps,
        audioUrl: loop.audioUrl,
        loopId: loop.id,
        renderFrame,
      });
      const mime = blob.type || "video/webm";
      return { blob, isMp4: recorderMimeIsMp4(mime) };
    }
  } finally {
    coverBitmap?.close?.();
  }
}

export function downloadVisualizerVideo(
  loop: Loop,
  blob: Blob,
  layout: "story" | "square" = "story",
  platform: SharePlatform = "tiktok",
): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const baseName = buildShareVideoFilename(loop, layout, platform);
  const isMp4 = blob.type.includes("mp4") || baseName.endsWith(".mp4");
  a.download = isMp4 ? baseName : baseName.replace(/\.mp4$/i, ".webm");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
