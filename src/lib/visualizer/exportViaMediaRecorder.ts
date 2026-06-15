import { resolvePlayableAudioUrl } from "@/lib/playableAudio";

export type RecorderExportOptions = {
  width: number;
  height: number;
  durationSec: number;
  fps?: number;
  audioUrl: string;
  loopId?: string;
  renderFrame: (ctx: CanvasRenderingContext2D, t: number, dt: number) => void;
};

const RECORDER_MIMES = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4;codecs=h264,aac",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
] as const;

export function pickRecorderMime(): string {
  if (typeof MediaRecorder === "undefined") throw new Error("unsupported");
  for (const mime of RECORDER_MIMES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  throw new Error("unsupported");
}

export function recorderMimeIsMp4(mime: string): boolean {
  return mime.startsWith("video/mp4");
}

/** Real-time canvas + audio capture — fallback when WebCodecs mux fails. */
export async function exportCanvasViaMediaRecorder(opts: RecorderExportOptions): Promise<Blob> {
  const mime = pickRecorderMime();
  const fps = opts.fps ?? 30;

  const canvas = document.createElement("canvas");
  canvas.width = opts.width;
  canvas.height = opts.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const audioUrl = await resolvePlayableAudioUrl(opts.audioUrl, opts.loopId);
  const audio = new Audio();
  audio.crossOrigin = "anonymous";
  audio.preload = "auto";
  audio.src = audioUrl;

  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaElementSource(audio);
  const dest = audioCtx.createMediaStreamDestination();
  source.connect(dest);

  const canvasStream = canvas.captureStream(fps);
  const out = new MediaStream([...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const rec = new MediaRecorder(out, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => {
    if (e.data?.size) chunks.push(e.data);
  };
  const stopPromise = new Promise<Blob>((resolve) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: mime.split(";")[0] }));
  });

  const startTs = performance.now();
  let rafId = 0;

  const tick = () => {
    const t = (performance.now() - startTs) / 1000;
    opts.renderFrame(ctx, t, 1 / fps);
    if (t < opts.durationSec) rafId = requestAnimationFrame(tick);
  };

  rec.start(100);
  await audioCtx.resume().catch(() => undefined);
  await audio.play().catch(() => undefined);
  tick();

  await new Promise<void>((resolve) => window.setTimeout(resolve, opts.durationSec * 1000));
  cancelAnimationFrame(rafId);

  rec.stop();
  audio.pause();
  canvasStream.getTracks().forEach((tr) => tr.stop());
  dest.stream.getTracks().forEach((tr) => tr.stop());
  await audioCtx.close().catch(() => undefined);

  return stopPromise;
}
