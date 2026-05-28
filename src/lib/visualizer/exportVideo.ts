import type { Loop } from "@/types/loop";
import { hashString } from "@/lib/utils";
import { loadCoverBitmap } from "@/lib/visualizer/coverLoader";
import { BAR_COUNT, createBarBuffer, readAnalyserBars } from "@/lib/visualizer/frequencyBars";
import { canvasSizeForLayout, renderVisualizerFrame, resolveExportDuration } from "@/lib/visualizer/renderFrame";
import type { VisualizerExportOptions, VisualizerPresetId } from "@/lib/visualizer/types";
import { resolvePlayableAudioUrl } from "@/lib/playableAudio";

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "video/webm";
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) return "video/webm;codecs=vp9,opus";
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) return "video/webm;codecs=vp8,opus";
  return "video/webm";
}

export async function exportVisualizerVideo(loop: Loop, options: VisualizerExportOptions = {}): Promise<Blob> {
  if (!loop.audioUrl) throw new Error("missing_audio");
  if (typeof MediaRecorder === "undefined") throw new Error("unsupported");

  const layout = options.layout ?? "story";
  const preset: VisualizerPresetId = options.preset ?? "prism";
  const durationSec = resolveExportDuration(loop, options.durationSec);
  const fps = options.fps ?? 30;
  const showWatermark = options.showWatermark !== false;
  const watermarkText = options.watermarkText ?? "made with ProducerHit";
  const { width: w, height: h } = canvasSizeForLayout(layout);
  const seed = hashString(loop.id);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const [coverBitmap, audioUrl] = await Promise.all([
    loadCoverBitmap(loop, 1024),
    resolvePlayableAudioUrl(loop.audioUrl, loop.id),
  ]);

  const audio = new Audio();
  audio.crossOrigin = "anonymous";
  audio.preload = "auto";
  audio.src = audioUrl;

  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaElementSource(audio);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.82;
  const dest = audioCtx.createMediaStreamDestination();
  source.connect(analyser);
  analyser.connect(dest);

  const freq = new Uint8Array(analyser.frequencyBinCount);
  const bars = createBarBuffer(BAR_COUNT);

  const canvasStream = canvas.captureStream(fps);
  const out = new MediaStream([...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const mime = pickMimeType();
  const rec = new MediaRecorder(out, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => {
    if (e.data?.size) chunks.push(e.data);
  };
  const stopPromise = new Promise<Blob>((resolve) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
  });

  const startTs = performance.now();
  let lastTs = startTs;

  const tick = () => {
    const now = performance.now();
    const t = (now - startTs) / 1000;
    const dt = Math.min(0.05, (now - lastTs) / 1000);
    lastTs = now;

    readAnalyserBars(analyser, freq, bars, !audio.paused && !audio.ended);

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

    if (t < durationSec) requestAnimationFrame(tick);
  };

  rec.start(100);
  await audioCtx.resume().catch(() => undefined);
  await audio.play().catch(() => undefined);
  tick();

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationSec * 1000);
  });

  rec.stop();
  audio.pause();
  canvasStream.getTracks().forEach((tr) => tr.stop());
  dest.stream.getTracks().forEach((tr) => tr.stop());
  await audioCtx.close().catch(() => undefined);
  coverBitmap?.close?.();

  return stopPromise;
}

export function downloadVisualizerVideo(loop: Loop, blob: Blob, layout: "story" | "square" = "story"): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const cleanName = (loop.name || "producerhit")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 64);
  const suffix = layout === "square" ? "visual-square" : "visual-tiktok";
  a.download = `${cleanName || "producerhit"}-${suffix}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
