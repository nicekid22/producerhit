import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Download, Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { Button } from "@/components/ui/Button";
import { coverGradient, coverImageUrl } from "@/lib/utils";
import { resolvePlayableAudioUrl, shouldUseWebAudioGraph } from "@/lib/playableAudio";

function formatTime(sec: number): string {
  if (!sec || !isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const errorToastShownRef = useRef(false);
  const audioGraphFailedRef = useRef(false);
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
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const prev = usePlayerStore((s) => s.prev);
  const next = usePlayerStore((s) => s.next);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [progress, setProgress] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const queueLen = queue.length;
  const canPrev = queueLen > 0 && queueIndex > 0;
  const canNext = queueLen > 0 && queueIndex < queueLen - 1;

  const lastLoadedKeyRef = useRef<string | null>(null);
  const loadGenRef = useRef(0);

  const ensureAudioGraph = useCallback((sourceUrl?: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audioCtxRef.current && analyserRef.current && mediaSourceRef.current) return;
    if (audioGraphFailedRef.current) return;

    const src = sourceUrl ?? audio.currentSrc ?? audio.src;
    if (src && !shouldUseWebAudioGraph(src)) return;

    try {
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
    } catch {
      audioGraphFailedRef.current = true;
      audioCtxRef.current = null;
      mediaSourceRef.current = null;
      analyserRef.current = null;
      freqDataRef.current = null;
    }
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
      const nextVal = playing ? v : bars[i] ?? 0;
      bars[i] = playing ? (bars[i] ?? 0) * 0.35 + nextVal * 0.65 : nextVal;
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
      const r = Math.round(203 + (103 - 203) * t);
      const g = Math.round(213 + (195 - 213) * t);
      const b = Math.round(225 + (255 - 225) * t);
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
      const audio = audioRef.current;
      if (!audio) return;
      ensureAudioGraph(audio.currentSrc || audio.src);
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => undefined);
    };
    window.addEventListener("pointerdown", onPointerDownOnce);
    return () => window.removeEventListener("pointerdown", onPointerDownOnce);
  }, [ensureAudioGraph]);

  useEffect(() => {
    setIsPlaying(storeIsPlaying);
  }, [storeIsPlaying]);

  const tryPlayAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src || audio.readyState < 2) return false;
    ensureAudioGraph(audio.currentSrc || audio.src);
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => undefined);
    void audio.play().catch(() => {
      setIsPlaying(false);
      setPlaying(false);
    });
    return true;
  }, [ensureAudioGraph, setPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (storeIsPlaying === true) {
      if (tryPlayAudio()) return;
      if (!audio.src) return;

      const onCanPlayOnce = () => {
        audio.removeEventListener("canplay", onCanPlayOnce);
        tryPlayAudio();
      };
      audio.addEventListener("canplay", onCanPlayOnce);
      return () => audio.removeEventListener("canplay", onCanPlayOnce);
    }

    if (storeIsPlaying === false) {
      if (!audio.paused) audio.pause();
    }
  }, [currentBeat?.audioUrl, storeIsPlaying, tryPlayAudio]);

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
      ensureAudioGraph(audio.currentSrc || audio.src);
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

    const rawUrl = currentBeat.audioUrl.trim();
    const gen = ++loadGenRef.current;

    setHasError(false);
    errorToastShownRef.current = false;

    void (async () => {
      let playableUrl = rawUrl;
      try {
        playableUrl = await resolvePlayableAudioUrl(rawUrl, currentBeat.id);
      } catch {
        if (gen !== loadGenRef.current) return;
        setHasError(true);
        setIsLoading(false);
        setIsPlaying(false);
        setPlaying(false);
        toast.error("Playback failed — tap to retry");
        errorToastShownRef.current = true;
        return;
      }

      if (gen !== loadGenRef.current) return;

      const resolvedKey = `${currentBeat.id}:${playableUrl}`;
      if (lastLoadedKeyRef.current === resolvedKey && audio.src) {
        if (storeIsPlaying && audio.paused) tryPlayAudio();
        return;
      }

      audioGraphFailedRef.current = false;
      lastLoadedKeyRef.current = resolvedKey;
      audio.src = playableUrl;
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
          if (gen !== loadGenRef.current) return;
          tryPlayAudio();
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
      }
    })();
  }, [
    currentBeat?.id,
    currentBeat?.audioUrl,
    setCurrentTimeStore,
    setDurationStore,
    setPlaying,
    setProgressStore,
    storeIsPlaying,
    tryPlayAudio,
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
      ensureAudioGraph(audio.currentSrc || audio.src);
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
      ensureAudioGraph(audio.currentSrc || audio.src);
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

  const coverBg = currentBeat ? coverGradient(currentBeat) : "";
  const coverUrl = currentBeat ? coverImageUrl(currentBeat) : "";

  return (
    <>
      {currentBeat ? (
    <div
      className="pk-prism-player pk-prism-player--dock fixed bottom-[calc(var(--pk-bottom-nav)+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 md:bottom-0 md:z-50"
      aria-busy={isLoading}
    >
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-none sm:gap-3">
          <div className="pk-prism-cover relative hidden h-11 w-11 shrink-0 overflow-hidden rounded-xl sm:block" style={{ background: coverBg }}>
            {coverUrl ? (
              <img
                key={coverUrl}
                src={coverUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                style={{ opacity: 0 }}
                onLoad={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.dataset.retry = "0";
                }}
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.opacity = "0";
                  const retry = Number(img.dataset.retry ?? "0");
                  if (retry < 4) {
                    img.dataset.retry = String(retry + 1);
                    window.setTimeout(() => {
                      img.style.opacity = "0";
                      img.src = "";
                      img.src = coverUrl;
                    }, 800 * (retry + 1));
                    return;
                  }
                  img.style.display = "none";
                }}
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{currentBeat.name}</div>
            <div className="mt-0.5 hidden flex-wrap gap-2 text-xs text-white/50 sm:flex">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">{currentBeat.genre}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">
                {currentBeat.key} {currentBeat.scale}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">{currentBeat.bpm} BPM</span>
            </div>
            <div className="mt-0.5 text-[11px] text-white/45 sm:hidden">
              {formatTime(currentTimeSec)} / {durationSec > 0 ? formatTime(durationSec) : "--:--"}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-[1.2] flex-col items-center sm:flex-1">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={prev}
              disabled={!canPrev}
              className="pk-prism-player-btn hidden h-9 w-9 items-center justify-center rounded-xl disabled:opacity-40 sm:inline-flex"
              aria-label="Previous"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => void togglePlay()}
              className="pk-prism-player-btn pk-prism-player-btn--primary inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!canNext}
              className="pk-prism-player-btn hidden h-9 w-9 items-center justify-center rounded-xl disabled:opacity-40 sm:inline-flex"
              aria-label="Next"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            {hasError ? (
              <Button variant="secondary" size="sm" onClick={() => void retryPlayback()} aria-label="Retry">
                Retry
              </Button>
            ) : null}
            <div className="hidden text-xs text-white/50 sm:block">
              {formatTime(currentTimeSec)} / {durationSec > 0 ? formatTime(durationSec) : "--:--"}
              {queueLen > 0 ? ` · ${queueIndex + 1}/${queueLen}` : ""}
            </div>
          </div>
          <canvas ref={vizCanvasRef} className="mt-1.5 hidden h-7 w-full max-w-xl opacity-90 sm:mt-2 sm:block" aria-hidden />
          <div
            className={`relative mt-2 flex h-3 w-full max-w-xl items-center group ${durationSec > 0 ? "cursor-pointer" : "cursor-default"}`}
            onClick={durationSec > 0 ? handleSeek : undefined}
          >
            <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/10">
              {durationSec > 0 ? (
                <div
                  className="h-full bg-[linear-gradient(90deg,var(--prism-chrome),var(--prism-cyan),var(--prism-violet))] transition-none"
                  style={{ width: `${progress * 100}%` }}
                />
              ) : isLoading ? (
                <div className="absolute inset-0">
                  <div
                    className="absolute left-0 top-0 h-full w-[42%] bg-gradient-to-r from-transparent via-[rgba(157,124,255,0.55)] to-transparent"
                    style={{ animation: "pkShimmer 1.1s ease-in-out infinite" }}
                  />
                </div>
              ) : (
                <div className="h-full w-full bg-transparent" />
              )}
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <div className="flex items-center gap-2 text-white/50">
            <Volume2 className="h-4 w-4" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              className="h-1 w-24 cursor-pointer accent-[var(--prism-cyan)] lg:w-28"
            />
          </div>
          <button
            type="button"
            className="pk-prism-player-btn inline-flex h-9 w-9 items-center justify-center rounded-xl"
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
          </button>
        </div>
      </div>
    </div>
      ) : null}
      <audio ref={audioRef} id="pk-audio" preload="metadata" crossOrigin="anonymous" playsInline className="hidden" aria-hidden />
    </>
  );
}
