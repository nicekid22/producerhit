import { useEffect, useMemo, useRef, useState } from "react";

const peaksCache = new Map<string, Float32Array>();
const inflight = new Map<string, Promise<Float32Array>>();
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

async function decodePeaks(audioUrl: string, signal: AbortSignal): Promise<Float32Array> {
  await acquireDecodeSlot();
  try {
    const response = await fetch(audioUrl, { signal });
    if (!response.ok) throw new Error("Waveform fetch failed");
    const arrayBuffer = await response.arrayBuffer();
    if (signal.aborted) throw new Error("Aborted");
    const Ctor = getAudioContextCtor();
    const ctx = new Ctor();
    try {
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      if (signal.aborted) throw new Error("Aborted");
      return computePeaks(audioBuffer, 1024);
    } finally {
      if (typeof ctx.close === "function") {
        await ctx.close().catch(() => undefined);
      }
    }
  } finally {
    releaseDecodeSlot();
  }
}

async function getOrDecodePeaks(audioUrl: string, signal: AbortSignal): Promise<Float32Array> {
  const cached = peaksCache.get(audioUrl);
  if (cached) return cached;
  const running = inflight.get(audioUrl);
  if (running) return running;
  const p = decodePeaks(audioUrl, signal)
    .then((peaks) => {
      peaksCache.set(audioUrl, peaks);
      inflight.delete(audioUrl);
      return peaks;
    })
    .catch((err) => {
      inflight.delete(audioUrl);
      throw err;
    });
  inflight.set(audioUrl, p);
  return p;
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

export function WaveformVisualizer({ isPlaying, barCount = 40 }: { isPlaying: boolean; barCount?: number }) {
  const getBarHeight = (i: number) => {
    const heights = [
      3, 5, 8, 12, 7, 15, 10, 4, 18, 9, 6, 14, 11, 3, 16, 8, 5, 13, 7, 19, 4, 11, 9, 6, 15, 12, 3, 17, 8,
      5, 14, 10, 6, 18, 7, 3, 12, 9, 16, 5,
    ];
    return heights[i % heights.length];
  };

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
          return (
            <div
              key={i}
              className="flex-1 origin-bottom rounded-full"
              style={{
                height: `${h}px`,
                backgroundColor: isPlaying ? "#7c3aed" : "#2d2d3d",
                animationName: isPlaying ? "ph-waveform" : undefined,
                animationDuration: isPlaying ? "0.9s" : undefined,
                animationTimingFunction: isPlaying ? "ease-in-out" : undefined,
                animationIterationCount: isPlaying ? "infinite" : undefined,
                animationDelay: isPlaying ? `${(i * 0.05) % 0.4}s` : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function AudioWaveform({
  audioUrl,
  isPlaying,
  progress,
  onSeek,
  height = 28,
  color = "#7c3aed",
  unplayedColor = "#2d2d3d",
}: {
  audioUrl: string | null;
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
  const [loading, setLoading] = useState(false);
  const clampedProgress = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));

  useEffect(() => {
    setPeaks(audioUrl ? peaksCache.get(audioUrl) ?? null : null);
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
    const url = audioUrl;
    if (!visible || !url) return;
    if (peaksCache.get(url)) return;
    const controller = new AbortController();
    setLoading(true);
    void getOrDecodePeaks(url, controller.signal)
      .then((p) => setPeaks(p))
      .catch(() => undefined)
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [audioUrl, visible]);

  const draw = useMemo(() => {
    return () => {
      const canvas = canvasRef.current;
      if (!canvas || !peaks) return;
      drawWaveform({ canvas, peaks, progress: clampedProgress, playedColor: color, unplayedColor });
    };
  }, [clampedProgress, color, peaks, unplayedColor]);

  useEffect(() => {
    let raf = 0;
    const run = () => {
      draw();
      if (isPlaying) raf = requestAnimationFrame(run);
    };
    run();
    return () => cancelAnimationFrame(raf);
  }, [draw, isPlaying]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div
      ref={containerRef}
      className="w-full"
      onClick={(e) => {
        if (!onSeek) return;
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        onSeek(pct);
      }}
      role={onSeek ? "button" : undefined}
      tabIndex={onSeek ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onSeek) return;
        if (e.key === "Enter" || e.key === " ") onSeek(clampedProgress);
      }}
    >
      {peaks ? (
        <canvas ref={canvasRef} style={{ height }} className={onSeek ? "w-full cursor-pointer" : "w-full"} aria-hidden />
      ) : (
        <div className="opacity-70" style={{ height }}>
          <WaveformVisualizer isPlaying={loading} barCount={40} />
        </div>
      )}
    </div>
  );
}
