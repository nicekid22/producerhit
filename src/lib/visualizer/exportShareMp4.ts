import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import { resolvePlayableAudioUrl } from "@/lib/playableAudio";

const VIDEO_CODECS = ["avc1.42001E", "avc1.42E01E", "avc1.640028"] as const;
const AUDIO_CODEC = "mp4a.40.2";
const AUDIO_SAMPLE_RATE = 48_000;
const AUDIO_BITRATE = 128_000;
const VIDEO_BITRATE = 6_000_000;
const AUDIO_FRAME_SIZE = 1024;

export type CanvasMp4ExportOptions = {
  width: number;
  height: number;
  durationSec: number;
  fps?: number;
  audioUrl: string;
  loopId?: string;
  renderFrame: (ctx: CanvasRenderingContext2D, t: number, dt: number) => void;
};

export async function supportsShareMp4Export(): Promise<boolean> {
  if (typeof VideoEncoder !== "undefined") return true;
  if (typeof MediaRecorder !== "undefined") {
    try {
      pickRecorderMimeForProbe();
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

function pickRecorderMimeForProbe(): string {
  const mimes = ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm"];
  for (const mime of mimes) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  throw new Error("unsupported");
}

async function decodeAudio(url: string): Promise<AudioBuffer> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error("audio_load_failed");
  const bytes = await res.arrayBuffer();
  const ctx = new AudioContext();
  try {
    return await ctx.decodeAudioData(bytes.slice(0));
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

async function toStereo48k(buffer: AudioBuffer, maxDurationSec: number): Promise<AudioBuffer> {
  const length = Math.min(buffer.length, Math.ceil(maxDurationSec * buffer.sampleRate));
  const offline = new OfflineAudioContext(2, Math.ceil(maxDurationSec * AUDIO_SAMPLE_RATE), AUDIO_SAMPLE_RATE);
  const trim = offline.createBuffer(Math.max(1, buffer.numberOfChannels), length, buffer.sampleRate);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    trim.copyToChannel(buffer.getChannelData(c).subarray(0, length), c);
  }
  if (buffer.numberOfChannels === 1) {
    trim.copyToChannel(buffer.getChannelData(0).subarray(0, length), 0);
  }
  const source = offline.createBufferSource();
  source.buffer = trim;
  source.connect(offline.destination);
  source.start(0);
  return offline.startRendering();
}

async function resolveVideoEncoderConfig(width: number, height: number, fps: number) {
  for (const codec of VIDEO_CODECS) {
    const config: VideoEncoderConfig = {
      codec,
      width,
      height,
      bitrate: VIDEO_BITRATE,
      framerate: fps,
    };
    try {
      if (typeof VideoEncoder.isConfigSupported === "function") {
        const probe = await VideoEncoder.isConfigSupported(config);
        if (!probe.supported) continue;
      }
      return config;
    } catch {
      continue;
    }
  }
  throw new Error("video_encoder_unsupported");
}

async function encodeAudioTrack(
  muxer: Muxer<ArrayBufferTarget>,
  audioBuffer: AudioBuffer,
  durationSec: number,
): Promise<boolean> {
  if (typeof AudioEncoder === "undefined" || typeof AudioData === "undefined") return false;

  const resampled = await toStereo48k(audioBuffer, durationSec);
  const maxSamples = Math.min(resampled.length, Math.ceil(durationSec * AUDIO_SAMPLE_RATE));
  const ch0 = resampled.getChannelData(0);
  const ch1 = resampled.numberOfChannels > 1 ? resampled.getChannelData(1) : ch0;

  const audioEncoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: (err) => {
      throw err;
    },
  });

  try {
    audioEncoder.configure({
      codec: AUDIO_CODEC,
      sampleRate: AUDIO_SAMPLE_RATE,
      numberOfChannels: 2,
      bitrate: AUDIO_BITRATE,
    });
  } catch {
    audioEncoder.close();
    return false;
  }

  let sampleOffset = 0;
  while (sampleOffset < maxSamples) {
    const frames = Math.min(AUDIO_FRAME_SIZE, maxSamples - sampleOffset);
    const planar = new Float32Array(frames * 2);
    for (let i = 0; i < frames; i++) {
      planar[i] = ch0[sampleOffset + i] ?? 0;
      planar[frames + i] = ch1[sampleOffset + i] ?? ch0[sampleOffset + i] ?? 0;
    }
    const audioData = new AudioData({
      format: "f32-planar",
      sampleRate: AUDIO_SAMPLE_RATE,
      numberOfFrames: frames,
      numberOfChannels: 2,
      timestamp: Math.round((sampleOffset / AUDIO_SAMPLE_RATE) * 1_000_000),
      data: planar,
    });
    audioEncoder.encode(audioData);
    audioData.close();
    sampleOffset += frames;
  }

  await audioEncoder.flush();
  audioEncoder.close();
  return true;
}

async function encodeVideoTrack(
  muxer: Muxer<ArrayBufferTarget>,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  opts: CanvasMp4ExportOptions,
  videoConfig: VideoEncoderConfig,
): Promise<void> {
  const fps = opts.fps ?? 30;
  const frameCount = Math.max(1, Math.ceil(opts.durationSec * fps));
  const frameDurationUs = Math.round(1_000_000 / fps);

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (err) => {
      throw err;
    },
  });

  videoEncoder.configure(videoConfig);

  for (let i = 0; i < frameCount; i++) {
    const t = i / fps;
    opts.renderFrame(ctx, t, 1 / fps);
    const frame = new VideoFrame(canvas, { timestamp: i * frameDurationUs });
    videoEncoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
    frame.close();
  }

  await videoEncoder.flush();
  videoEncoder.close();
}

/** H.264 + AAC MP4 via WebCodecs — no pre-flight block on AudioEncoder.isConfigSupported. */
export async function exportCanvasToMp4(opts: CanvasMp4ExportOptions): Promise<Blob> {
  if (typeof VideoEncoder === "undefined") throw new Error("video_encoder_unsupported");

  const canvas = document.createElement("canvas");
  canvas.width = opts.width;
  canvas.height = opts.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const fps = opts.fps ?? 30;
  const videoConfig = await resolveVideoEncoderConfig(opts.width, opts.height, fps);
  const playableUrl = await resolvePlayableAudioUrl(opts.audioUrl, opts.loopId);
  const audioBuffer = await decodeAudio(playableUrl);

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: "avc", width: opts.width, height: opts.height, frameRate: fps },
    audio: { codec: "aac", sampleRate: AUDIO_SAMPLE_RATE, numberOfChannels: 2 },
    fastStart: "in-memory",
    firstTimestampBehavior: "offset",
  });

  await encodeVideoTrack(muxer, canvas, ctx, opts, videoConfig);
  const hasAudio = await encodeAudioTrack(muxer, audioBuffer, opts.durationSec);
  if (!hasAudio) throw new Error("audio_encoder_unsupported");

  muxer.finalize();
  return new Blob([target.buffer], { type: "video/mp4" });
}
