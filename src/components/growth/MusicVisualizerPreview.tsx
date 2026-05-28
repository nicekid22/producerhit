import { useCallback, useEffect, useRef, useState } from "react";
import type { Loop } from "@/types/loop";
import { hashString } from "@/lib/utils";
import { loadCoverBitmap } from "@/lib/visualizer/coverLoader";
import { animateFakeBars, BAR_COUNT, createBarBuffer, readAnalyserBars } from "@/lib/visualizer/frequencyBars";
import { renderVisualizerFrame } from "@/lib/visualizer/renderFrame";
import type { VisualizerLayout, VisualizerPresetId } from "@/lib/visualizer/types";
import { resolvePlayableAudioUrl, shouldUseWebAudioGraph } from "@/lib/playableAudio";

type Props = {
  loop: Loop;
  preset: VisualizerPresetId;
  layout?: VisualizerLayout;
  active?: boolean;
  muted?: boolean;
  showWatermark?: boolean;
  className?: string;
};

export function MusicVisualizerPreview({
  loop,
  preset,
  layout = "story",
  active = true,
  muted = true,
  showWatermark = false,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const coverRef = useRef<ImageBitmap | null>(null);
  const barsRef = useRef(createBarBuffer(BAR_COUNT));
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqRef = useRef<Uint8Array | null>(null);
  const graphFailedRef = useRef(false);
  const [ready, setReady] = useState(false);

  const stop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startRef.current = null;
    audioRef.current?.pause();
  }, []);

  const ensureGraph = useCallback(async () => {
    if (graphFailedRef.current || analyserRef.current) return;
    const audio = audioRef.current;
    if (!audio?.src) return;
    if (!shouldUseWebAudioGraph(audio.src)) return;
    try {
      const ctx = new AudioContext();
      await ctx.resume().catch(() => undefined);
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      freqRef.current = new Uint8Array(analyser.frequencyBinCount);
    } catch {
      graphFailedRef.current = true;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    coverRef.current?.close?.();
    coverRef.current = null;
    setReady(false);

    void loadCoverBitmap(loop, 768).then((bitmap) => {
      if (cancelled) {
        bitmap?.close?.();
        return;
      }
      coverRef.current = bitmap;
      setReady(true);
    });

    return () => {
      cancelled = true;
      coverRef.current?.close?.();
      coverRef.current = null;
    };
  }, [loop.id, loop.details?.coverPrompt, loop.seed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !loop.audioUrl) return;
    let cancelled = false;

    void (async () => {
      try {
        const url = await resolvePlayableAudioUrl(loop.audioUrl!, loop.id);
        if (cancelled) return;
        audio.crossOrigin = "anonymous";
        audio.src = url;
        audio.loop = true;
        audio.muted = muted;
        await audio.load();
      } catch {
        // preview falls back to fake bars
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loop.audioUrl, loop.id, muted]);

  useEffect(() => {
    if (!active || !ready) {
      stop();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = (now: number) => {
      if (startRef.current == null) startRef.current = now;
      const t = (now - startRef.current) / 1000;
      const dt = 1 / 30;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const analyser = analyserRef.current;
      const freq = freqRef.current;
      const audio = audioRef.current;
      const playing = Boolean(audio && !audio.paused && !audio.ended);
      if (analyser && freq) readAnalyserBars(analyser, freq, barsRef.current, playing);
      else animateFakeBars(barsRef.current, t);

      renderVisualizerFrame(
        {
          ctx,
          width: w,
          height: h,
          timeSec: t,
          loop,
          coverBitmap: coverRef.current,
          bars: barsRef.current,
          preset,
          showMetadata: true,
          showWatermark,
          layout,
          seed: hashString(loop.id),
        },
        dt,
      );

      rafRef.current = requestAnimationFrame(draw);
    };

    void (async () => {
      await ensureGraph();
      const audio = audioRef.current;
      if (audio && active) {
        audio.muted = muted;
        await audio.play().catch(() => undefined);
      }
      rafRef.current = requestAnimationFrame(draw);
    })();

    return () => stop();
  }, [active, ensureGraph, layout, loop, muted, preset, ready, showWatermark, stop]);

  useEffect(() => () => stop(), [stop]);

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
      <audio ref={audioRef} playsInline preload="auto" className="hidden" />
    </div>
  );
}
