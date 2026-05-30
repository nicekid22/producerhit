import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { fetchCachedLoopAudioBlob } from "@/stores/loopsStore";

const PEAK_POINTS = 256;
const DECODE_TIMEOUT_MS = 10_000;

const peaksCache = new Map<string, Float32Array>();
const inflightPeaks = new Map<string, Promise<Float32Array>>();
const bufferInflight = new Map<string, Promise<ArrayBuffer>>();
const decodeWaiters: Array<() => void> = [];
let activeDecodes = 0;

async function acquireDecodeSlot() {
  if (activeDecodes < 3) {
    activeDecodes += 1;
    return;
  }
  await new Promise<void>((resolve) => decodeWaiters.push(resolve));
  activeDecodes += 1;
}

function releaseDecodeSlot() {
  activeDecodes = Math.max(0, activeDecodes - 1);
  const next = decodeWaiters.shift();
  if (next) next();
}

function getAudioContextCtor(): typeof AudioContext {
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  return w.AudioContext ?? w.webkitAudioContext ?? AudioContext;
}

function computePeaks(buffer: AudioBuffer, points: number): Float32Array {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  const out = new Float32Array(points);
  const step = Math.max(1, Math.floor(length / points));
  let max = 0;
  for (let i = 0; i < points; i++) {
    const start = i * step;
    const end = Math.min(length, start + step);
    let peak = 0;
    for (let c = 0; c < channels; c++) {
      const data = buffer.getChannelData(c);
      for (let s = start; s < end; s++) {
        const v = Math.abs(data[s] ?? 0);
        if (v > peak) peak = v;
      }
    }
    out[i] = peak;
    if (peak > max) max = peak;
  }
  if (max > 0) {
    for (let i = 0; i < out.length; i++) out[i] = out[i] / max;
  }
  return out;
}

async function fetchAudioArrayBuffer(url: string, signal: AbortSignal): Promise<ArrayBuffer> {
  const existing = bufferInflight.get(url);
  if (existing) return existing;
  const task = fetch(url, { signal })
    .then((response) => {
      if (!response.ok) throw new Error("Waveform fetch failed");
      return response.arrayBuffer();
    })
    .finally(() => {
      bufferInflight.delete(url);
    });
  bufferInflight.set(url, task);
  return task;
}

async function decodePeaksFromBuffer(arrayBuffer: ArrayBuffer, signal: AbortSignal): Promise<Float32Array> {
  if (signal.aborted) throw new Error("Aborted");
  await acquireDecodeSlot();
  try {
    const Ctor = getAudioContextCtor();
    const ctx = new Ctor();
    try {
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      if (signal.aborted) throw new Error("Aborted");
      return computePeaks(audioBuffer, PEAK_POINTS);
    } finally {
      if (typeof ctx.close === "function") {
        await ctx.close().catch(() => undefined);
      }
    }
  } finally {
    releaseDecodeSlot();
  }
}

async function resolvePeaks(args: {
  audioUrl: string;
  loopId?: string;
  signal: AbortSignal;
}): Promise<Float32Array> {
  const { audioUrl, loopId, signal } = args;

  if (loopId) {
    const blob = await fetchCachedLoopAudioBlob(loopId).catch(() => null);
    if (blob && !signal.aborted) {
      try {
        return await decodePeaksFromBuffer(await blob.arrayBuffer(), signal);
      } catch {
        // fall through to network fetch
      }
    }
  }

  const arrayBuffer = await fetchAudioArrayBuffer(audioUrl, signal);
  return decodePeaksFromBuffer(arrayBuffer, signal);
}

function withDecodeTimeout<T>(promise: Promise<T>, ms: number, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("Waveform decode timeout")), ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new Error("Aborted"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    promise
      .then((value) => {
        window.clearTimeout(timer);
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      })
      .catch((err) => {
        window.clearTimeout(timer);
        signal.removeEventListener("abort", onAbort);
        reject(err);
      });
  });
}

async function getOrDecodePeaks(args: {
  audioUrl: string;
  loopId?: string;
  signal: AbortSignal;
}): Promise<Float32Array> {
  const cacheKey = args.audioUrl;
  const cached = peaksCache.get(cacheKey);
  if (cached) return cached;

  const running = inflightPeaks.get(cacheKey);
  if (running) return running;

  const task = withDecodeTimeout(resolvePeaks(args), DECODE_TIMEOUT_MS, args.signal)
    .then((peaks) => {
      peaksCache.set(cacheKey, peaks);
      inflightPeaks.delete(cacheKey);
      return peaks;
    })
    .catch((err) => {
      inflightPeaks.delete(cacheKey);
      throw err;
    });

  inflightPeaks.set(cacheKey, task);
  return task;
}

function drawWaveform({
  canvas,
  peaks,
  progress,
  playedColor,
  unplayedColor,
}: {
  canvas: HTMLCanvasElement;
  peaks: Float32Array;
  progress: number;
  playedColor: string;
  unplayedColor: string;
}) {
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(1, rect.width);
  const cssH = Math.max(1, rect.height);
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const w = Math.floor(cssW * dpr);
  const h = Math.floor(cssH * dpr);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);

  const barW = Math.max(1, Math.floor(2 * dpr));
  const gap = Math.max(1, Math.floor(1 * dpr));
  const stride = barW + gap;
  const bars = Math.max(8, Math.floor(w / stride));
  const playedBars = Math.max(0, Math.min(bars, Math.round(progress * bars)));

  for (let i = 0; i < bars; i++) {
    const t = bars === 1 ? 0 : i / (bars - 1);
    const idx = Math.min(peaks.length - 1, Math.floor(t * (peaks.length - 1)));
    const amp = Math.max(0, Math.min(1, peaks[idx] ?? 0));
    const barH = Math.max(1, Math.floor(amp * (h - 2)));
    const x = i * stride;
    const y = Math.floor((h - barH) / 2);
    ctx.fillStyle = i < playedBars ? playedColor : unplayedColor;
    ctx.fillRect(x, y, barW, barH);
  }
}

const LOADER_SEGMENT_COUNT = 32;

export function WaveformLoader({
  height = 28,
  active = true,
  onRetry,
}: {
  height?: number;
  active?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div
      className={`pk-waveform-loader ${active ? "pk-waveform-loader--active" : "pk-waveform-loader--idle"}`}
      style={{ height }}
      aria-hidden={active}
      aria-label={active ? undefined : "Waveform unavailable"}
      role={!active && onRetry ? "button" : undefined}
      tabIndex={!active && onRetry ? 0 : undefined}
      onClick={!active && onRetry ? onRetry : undefined}
      onKeyDown={
        !active && onRetry
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRetry();
              }
            }
          : undefined
      }
    >
      <div className="pk-waveform-loader__grid" aria-hidden />
      <div className="pk-waveform-loader__baseline" aria-hidden />
      <div className="pk-waveform-loader__scan" aria-hidden />
      <div className="pk-waveform-loader__segments" aria-hidden>
        {Array.from({ length: LOADER_SEGMENT_COUNT }).map((_, i) => (
          <span
            key={i}
            className="pk-waveform-loader__segment"
            style={{ animationDelay: `${(i * 0.045) % 0.72}s` }}
          />
        ))}
      </div>
      {!active && onRetry ? (
        <span className="pk-waveform-loader__hint">↻</span>
      ) : null}
    </div>
  );
}

export function WaveformVisualizer({
  isPlaying,
  barCount = 40,
  variant = "default",
}: {
  isPlaying: boolean;
  barCount?: number;
  variant?: "default" | "prism";
}) {
  const getBarHeight = (i: number) => {
    const heights = [
      3, 5, 8, 12, 7, 15, 10, 4, 18, 9, 6, 14, 11, 3, 16, 8, 5, 13, 7, 19, 4, 11, 9, 6, 15, 12, 3, 17, 8,
      5, 14, 10, 6, 18, 7, 3, 12, 9, 16, 5,
    ];
    return heights[i % heights.length];
  };

  const playedColor = variant === "prism" ? "rgba(103, 195, 255, 0.92)" : "#7c3aed";
  const idleColor = variant === "prism" ? "rgba(255, 255, 255, 0.14)" : "#2d2d3d";

  return (
    <div className="h-10 w-full">
      <style>{`
        @keyframes ph-waveform {
          0% { transform: scaleY(0.55); opacity: 0.75; }
          50% { transform: scaleY(1.0); opacity: 1; }
          100% { transform: scaleY(0.65); opacity: 0.85; }
        }
      `}</style>
      <div className="flex h-10 w-full items-end gap-[2px]">
        {Array.from({ length: barCount }).map((_, i) => {
          const h = Math.min(40, getBarHeight(i) * 2);
          const prismGradient =
            variant === "prism"
              ? `linear-gradient(to top, rgba(157, 124, 255, 0.55), rgba(103, 195, 255, 0.95))`
              : undefined;
          return (
            <div
              key={i}
              className="flex-1 origin-bottom rounded-full"
              style={{
                height: `${h}px`,
                background: isPlaying && prismGradient ? prismGradient : undefined,
                backgroundColor: isPlaying && !prismGradient ? playedColor : !isPlaying ? idleColor : undefined,
                animationName: isPlaying ? "ph-waveform" : undefined,
                animationDuration: isPlaying ? "1.1s" : undefined,
                animationTimingFunction: isPlaying ? "ease-in-out" : undefined,
                animationIterationCount: isPlaying ? "infinite" : undefined,
                animationDelay: isPlaying ? `${(i * 0.05) % 0.45}s` : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

type PeaksLoadState = "idle" | "loading" | "ready" | "failed";

export function AudioWaveform({
  audioUrl,
  loopId,
  isPlaying,
  progress,
  onSeek,
  height = 28,
  color = "#7c3aed",
  unplayedColor = "#2d2d3d",
}: {
  audioUrl: string | null;
  loopId?: string;
  isPlaying: boolean;
  progress: number;
  onSeek?: (pct: number) => void;
  height?: number;
  color?: string;
  unplayedColor?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [peaks, setPeaks] = useState<Float32Array | null>(() => (audioUrl ? peaksCache.get(audioUrl) ?? null : null));
  const [loadState, setLoadState] = useState<PeaksLoadState>(() =>
    audioUrl && peaksCache.has(audioUrl) ? "ready" : "idle",
  );
  const [decodeAttempt, setDecodeAttempt] = useState(0);
  const clampedProgress = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const coarsePointer = useCoarsePointer();
  const liteWaveform = coarsePointer;

  const retryDecode = useCallback(() => {
    if (!audioUrl) return;
    peaksCache.delete(audioUrl);
    inflightPeaks.delete(audioUrl);
    setPeaks(null);
    setLoadState("idle");
    setDecodeAttempt((n) => n + 1);
  }, [audioUrl]);

  useEffect(() => {
    if (!audioUrl) {
      setPeaks(null);
      setLoadState("idle");
      return;
    }
    const cached = peaksCache.get(audioUrl);
    if (cached) {
      setPeaks(cached);
      setLoadState("ready");
      return;
    }
    setPeaks(null);
    setLoadState("idle");
  }, [audioUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        setVisible(Boolean(entries[0]?.isIntersecting));
      },
      { rootMargin: "250px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!loopId || peaks) return;
    const onCached = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (detail?.id === loopId) retryDecode();
    };
    window.addEventListener("producerhit-audio-cached", onCached);
    return () => window.removeEventListener("producerhit-audio-cached", onCached);
  }, [loopId, peaks, retryDecode]);

  useEffect(() => {
    const url = audioUrl;
    if (!visible || !url || liteWaveform) return;
    if (peaksCache.get(url)) return;

    const controller = new AbortController();
    let cancelled = false;
    setLoadState("loading");

    void getOrDecodePeaks({ audioUrl: url, loopId, signal: controller.signal })
      .then((p) => {
        if (cancelled) return;
        setPeaks(p);
        setLoadState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setLoadState("failed");
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [audioUrl, liteWaveform, visible, loopId, decodeAttempt]);

  const draw = useMemo(() => {
    return () => {
      const canvas = canvasRef.current;
      if (!canvas || !peaks) return;
      drawWaveform({ canvas, peaks, progress: clampedProgress, playedColor: color, unplayedColor });
    };
  }, [clampedProgress, color, peaks, unplayedColor]);

  useEffect(() => {
    if (liteWaveform) return;
    let raf = 0;
    const run = () => {
      draw();
      if (isPlaying) raf = requestAnimationFrame(run);
    };
    run();
    return () => cancelAnimationFrame(raf);
  }, [draw, isPlaying, liteWaveform]);

  useEffect(() => {
    draw();
  }, [draw]);

  const seekEnabled = Boolean(onSeek && peaks && !liteWaveform);

  if (liteWaveform) {
    return (
      <div
        className="w-full overflow-hidden rounded-md border border-white/10 bg-white/[0.03]"
        style={{ height }}
        aria-hidden
      >
        <div className="flex h-full items-end gap-[2px] px-1 pb-1">
          {Array.from({ length: 24 }).map((_, i) => {
            const played = i / 24 <= clampedProgress;
            const barH = `${Math.max(18, 35 + Math.sin(i * 0.65) * 28)}%`;
            return (
              <div
                key={i}
                className="flex-1 rounded-full"
                style={{
                  height: barH,
                  backgroundColor: played ? color : unplayedColor,
                  opacity: played ? 1 : 0.85,
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full"
      onClick={(e) => {
        if (!seekEnabled) return;
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        onSeek!(pct);
      }}
      role={seekEnabled ? "button" : undefined}
      tabIndex={seekEnabled ? 0 : undefined}
      onKeyDown={(e) => {
        if (!seekEnabled) return;
        if (e.key === "Enter" || e.key === " ") onSeek!(clampedProgress);
      }}
    >
      {peaks ? (
        <canvas ref={canvasRef} style={{ height }} className={seekEnabled ? "w-full cursor-pointer" : "w-full"} aria-hidden />
      ) : loadState === "failed" ? (
        <WaveformLoader height={height} active={false} onRetry={retryDecode} />
      ) : (
        <WaveformLoader
          height={height}
          active={loadState === "loading" || (loadState === "idle" && visible && Boolean(audioUrl))}
        />
      )}
    </div>
  );
}
