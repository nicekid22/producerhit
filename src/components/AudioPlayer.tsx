import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Download, Pause, Play, Volume2 } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { Button } from "@/components/ui/Button";

function formatTime(sec: number): string {
  if (!sec || !isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const errorToastShownRef = useRef(false);
  const vizCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqDataRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastBarsRef = useRef<Float32Array>(new Float32Array(64));
  const currentBeat = usePlayerStore((s) => s.current);
  const storeIsPlaying = usePlayerStore((s) => s.isPlaying);
  const seekToPct = usePlayerStore((s) => s.seekToPct);
  const setPlaying = usePlayerStore((s) => s.setPlaying);
  const setProgressStore = usePlayerStore((s) => s.setProgress);
  const setCurrentTimeStore = usePlayerStore((s) => s.setCurrentTime);
  const setDurationStore = usePlayerStore((s) => s.setDuration);
  const clearSeek = usePlayerStore((s) => s.clearSeek);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [progress, setProgress] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const ensureAudioGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audioCtxRef.current && analyserRef.current && mediaSourceRef.current) return;

    const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const Ctor = w.AudioContext ?? w.webkitAudioContext ?? AudioContext;
    const ctx = new Ctor();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.85;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    audioCtxRef.current = ctx;
    mediaSourceRef.current = source;
    analyserRef.current = analyser;
    freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);
  }, []);

  const stopRaf = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const drawVisualizer = useCallback(() => {
    const canvas = vizCanvasRef.current;
    if (!canvas) return;
    const audio = audioRef.current;
    const playing = Boolean(audio && !audio.paused && !audio.ended);
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const w = Math.floor(cssW * dpr);
    const h = Math.floor(cssH * dpr);
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    ctx2d.clearRect(0, 0, w, h);

    const analyser = analyserRef.current;
    const freq = freqDataRef.current;
    if (analyser && freq) analyser.getByteFrequencyData(freq);

    const bars = lastBarsRef.current;
    const barCount = bars.length;
    for (let i = 0; i < barCount; i++) {
      const bin = freq ? Math.min(freq.length - 1, Math.floor((i / barCount) * freq.length)) : 0;
      const v = freq ? (freq[bin] ?? 0) / 255 : 0;
      const next = playing ? v : bars[i] ?? 0;
      bars[i] = playing ? (bars[i] ?? 0) * 0.35 + next * 0.65 : next;
    }

    const barW = Math.max(1, Math.floor(w / (barCount * 1.6)));
    const gap = Math.max(1, Math.floor(barW * 0.6));
    const totalW = barCount * barW + (barCount - 1) * gap;
    const startX = Math.max(0, Math.floor((w - totalW) / 2));

    for (let i = 0; i < barCount; i++) {
      const v = Math.max(0, Math.min(1, bars[i] ?? 0));
      const barH = Math.max(1, Math.floor(v * h));
      const x = startX + i * (barW + gap);
      const y = Math.floor(h - barH);
      const t = barCount === 1 ? 0 : i / (barCount - 1);
      const r = Math.round(124 + (167 - 124) * t);
      const g = Math.round(58 + (139 - 58) * t);
      const b = Math.round(237 + (250 - 237) * t);
      ctx2d.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx2d.fillRect(x, y, barW, barH);
    }
  }, []);

  const startVisualizer = useCallback(() => {
    stopRaf();
    const tick = () => {
      drawVisualizer();
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, [drawVisualizer, stopRaf]);

  const decayVisualizerToZero = useCallback(() => {
    stopRaf();
    const bars = lastBarsRef.current;
    const tick = () => {
      let any = false;
      for (let i = 0; i < bars.length; i++) {
        const v = (bars[i] ?? 0) * 0.88;
        bars[i] = v;
        if (v > 0.01) any = true;
      }
      drawVisualizer();
      if (any) rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, [drawVisualizer, stopRaf]);

  useEffect(() => {
    const onPointerDownOnce = () => {
      ensureAudioGraph();
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => undefined);
    };
    window.addEventListener("pointerdown", onPointerDownOnce);
    return () => window.removeEventListener("pointerdown", onPointerDownOnce);
  }, [ensureAudioGraph]);

  useEffect(() => {
    setIsPlaying(storeIsPlaying);
  }, [storeIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (storeIsPlaying === true) {
      if (audio.paused) {
        ensureAudioGraph();
        const ctx = audioCtxRef.current;
        if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => undefined);
        void audio.play().catch(() => {
          setIsPlaying(false);
          setPlaying(false);
        });
      }
      return;
    }

    if (storeIsPlaying === false) {
      if (!audio.paused) audio.pause();
    }
  }, [ensureAudioGraph, setPlaying, storeIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || seekToPct == null) return;
    if (!audio.duration) return;
    audio.currentTime = seekToPct * audio.duration;
    clearSeek();
  }, [clearSeek, seekToPct]);

  useEffect(() => {
    const startTick = () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const ct = audio.currentTime ?? 0;
        const dur = audio.duration;
        const isFiniteDur = !!dur && isFinite(dur) && dur > 0;
        setCurrentTimeSec(ct);
        setDurationSec(isFiniteDur ? dur : 0);
        setProgress(isFiniteDur ? Math.min(ct / dur, 1) : 0);
      }, 250);
    };

    const stopTick = () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };

    if (isPlaying) startTick();
    else stopTick();

    return () => stopTick();
  }, [isPlaying]);

  useEffect(() => {
    setProgressStore(progress);
    setCurrentTimeStore(currentTimeSec);
    setDurationStore(durationSec);
  }, [currentTimeSec, durationSec, progress, setCurrentTimeStore, setDurationStore, setProgressStore]);

  useEffect(() => {
    setCurrentTimeSec(0);
    setDurationSec(0);
    setProgress(0);
    setProgressStore(0);
    setCurrentTimeStore(0);
    setDurationStore(0);
  }, [currentBeat?.id, setCurrentTimeStore, setDurationStore, setProgressStore]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => {
      ensureAudioGraph();
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => undefined);
      setHasError(false);
      errorToastShownRef.current = false;
      setIsPlaying(true);
      setPlaying(true);
      startVisualizer();
    };
    const onPause = () => {
      setIsPlaying(false);
      setPlaying(false);
      stopRaf();
    };
    const onEnded = () => {
      setIsPlaying(false);
      setPlaying(false);
      setIsLoading(false);
      setProgress(0);
      setCurrentTimeSec(0);
      decayVisualizerToZero();
    };
    const onLoadStart = () => {
      setHasError(false);
      setIsLoading(true);
    };
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onPlaying = () => setIsLoading(false);
    const onStalled = () => {
      if (audio.readyState < 3) setIsLoading(true);
    };
    const onError = () => {
      setIsLoading(false);
      setHasError(true);
      setIsPlaying(false);
      setPlaying(false);
      stopRaf();
      if (!errorToastShownRef.current) {
        toast.error("Playback failed — tap to retry");
        errorToastShownRef.current = true;
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("loadstart", onLoadStart);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("stalled", onStalled);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("loadstart", onLoadStart);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("stalled", onStalled);
      audio.removeEventListener("error", onError);
    };
  }, [decayVisualizerToZero, ensureAudioGraph, setPlaying, startVisualizer, stopRaf]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentBeat?.audioUrl) return;
    setHasError(false);
    errorToastShownRef.current = false;
    if (audio.src !== currentBeat.audioUrl) {
      audio.crossOrigin = "anonymous";
      audio.src = currentBeat.audioUrl;
      audio.load();
      audio.muted = false;
      audio.volume = volume;
      setIsLoading(true);
      setProgress(0);
      setProgressStore(0);
      setCurrentTimeSec(0);
      setCurrentTimeStore(0);
      setDurationSec(0);
      setDurationStore(0);

      if (storeIsPlaying) {
        const playNow = () => {
            ensureAudioGraph();
            const ctx = audioCtxRef.current;
            if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => undefined);
          void audio.play().catch(() => {
            setIsPlaying(false);
            setPlaying(false);
          });
        };

        if (audio.readyState >= 3) {
          playNow();
          return;
        }

        const onCanPlayOnce = () => {
          audio.removeEventListener("canplay", onCanPlayOnce);
          playNow();
        };
        audio.addEventListener("canplay", onCanPlayOnce);
        return () => {
          audio.removeEventListener("canplay", onCanPlayOnce);
        };
      }
    }
  }, [
    currentBeat?.audioUrl,
    setCurrentTimeStore,
    setDurationStore,
    setPlaying,
    setProgressStore,
    storeIsPlaying,
    ensureAudioGraph,
    volume,
  ]);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      const dur = audio.duration;
      const isFiniteDur = !!dur && isFinite(dur) && dur > 0;
      setDurationSec(isFiniteDur ? dur : 0);
      setDurationStore(isFiniteDur ? dur : 0);
      setIsLoading(false);
    };

    const onDurationChange = () => {
      const dur = audio.duration;
      const isFiniteDur = !!dur && isFinite(dur) && dur > 0;
      if (isFiniteDur) {
        setDurationSec(dur);
        setDurationStore(dur);
      }
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
    };
  }, [setDurationStore]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setPlaying(false);
      return;
    }
    try {
      ensureAudioGraph();
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === "suspended") await ctx.resume();
      await audio.play();
      setIsPlaying(true);
      setPlaying(true);
    } catch (e) {
      console.error("Playback error:", e);
      setHasError(true);
    }
  };

  const retryPlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setHasError(false);
    errorToastShownRef.current = false;
    setIsLoading(true);
    audio.load();
    try {
      ensureAudioGraph();
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === "suspended") await ctx.resume();
      await audio.play();
      setIsPlaying(true);
      setPlaying(true);
    } catch (e) {
      console.error("Playback error:", e);
      setIsLoading(false);
      setHasError(true);
      toast.error("Playback failed — tap to retry");
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || durationSec <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * audio.duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  useEffect(() => {
    return () => {
      stopRaf();
      try {
        analyserRef.current?.disconnect();
      } catch (e) {
        void e;
      }
      try {
        mediaSourceRef.current?.disconnect();
      } catch (e) {
        void e;
      }
      const ctx = audioCtxRef.current;
      audioCtxRef.current = null;
      analyserRef.current = null;
      mediaSourceRef.current = null;
      freqDataRef.current = null;
      if (ctx && typeof ctx.close === "function") void ctx.close().catch(() => undefined);
    };
  }, [stopRaf]);

  if (!currentBeat) return <audio ref={audioRef} id="pk-audio" preload="metadata" crossOrigin="anonymous" />;

  return (
    <div className="fixed bottom-14 left-0 right-0 z-30 border-t border-pk-border bg-pk-panel/95 backdrop-blur md:bottom-0" aria-busy={isLoading}>
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{currentBeat.name}</div>
          <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-pk-muted">
            <span className="rounded-full bg-white/5 px-2 py-0.5">{currentBeat.genre}</span>
            <span className="rounded-full bg-white/5 px-2 py-0.5">
              {currentBeat.key} {currentBeat.scale}
            </span>
            <span className="rounded-full bg-white/5 px-2 py-0.5">{currentBeat.bpm} BPM</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            {hasError ? (
              <Button variant="secondary" size="sm" onClick={retryPlayback} aria-label="Retry">
                Retry
              </Button>
            ) : null}
            <div className="text-xs text-pk-muted">
              {formatTime(currentTimeSec)} / {durationSec > 0 ? formatTime(durationSec) : "--:--"}
            </div>
          </div>
          <canvas ref={vizCanvasRef} className="mt-2 h-8 w-full" aria-hidden />
          <div
            className={`relative mt-2 flex h-3 w-full items-center group ${durationSec > 0 ? "cursor-pointer" : "cursor-default"}`}
            onClick={durationSec > 0 ? handleSeek : undefined}
          >
            <div className="h-1 w-full overflow-hidden rounded-full bg-pk-border">
              {durationSec > 0 ? (
                <div className="h-full rounded-full bg-pk-accent transition-none" style={{ width: `${progress * 100}%` }} />
              ) : isLoading ? (
                <div className="h-full w-2/5 rounded-full bg-pk-accent/60" style={{ animation: "indeterminate 2s ease-in-out infinite" }} />
              ) : (
                <div className="h-full w-full rounded-full bg-transparent" />
              )}
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <div className="flex items-center gap-2 text-pk-muted">
            <Volume2 className="h-4 w-4" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              className="h-1 w-28 cursor-pointer accent-[#7c3aed]"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Download"
            onClick={() => {
              void (async () => {
                try {
                  const res = await fetch(currentBeat.audioUrl);
                  if (!res.ok) throw new Error("Download failed");
                  const blob = await res.blob();
                  const formatHint = (currentBeat.details?.audioFormat || "").toLowerCase();
                  const type = (blob.type || "").toLowerCase();
                  const ext =
                    formatHint === "wav" || formatHint === "wav32"
                      ? "wav"
                      : formatHint === "flac"
                        ? "flac"
                        : formatHint === "opus"
                          ? "opus"
                          : formatHint === "aac"
                            ? "aac"
                            : type.includes("wav")
                              ? "wav"
                              : type.includes("flac")
                                ? "flac"
                                : type.includes("opus")
                                  ? "opus"
                                  : type.includes("aac")
                                    ? "aac"
                                    : "mp3";
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${currentBeat.name}.${ext}`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch (e) {
                  console.error(e);
                }
              })();
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <audio ref={audioRef} id="pk-audio" preload="metadata" crossOrigin="anonymous" />
    </div>
  );
}

