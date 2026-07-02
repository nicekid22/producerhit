import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  audioUrl: string;
  offsetSec: number;
  onOffsetChange: (offsetSec: number) => void;
  durationHint?: number;
  tagDurationSec?: number;
  disabled?: boolean;
  className?: string;
  playing?: boolean;
  playbackPosition?: number;
};

export function WaveformMarker({
  audioUrl,
  offsetSec,
  onOffsetChange,
  durationHint,
  tagDurationSec = 2.5,
  disabled = false,
  className = "",
  playing = false,
  playbackPosition = 0,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [duration, setDuration] = useState(durationHint ?? 0);
  const peaksRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!audioUrl) return;
    let cancelled = false;
    const ctx = new AudioContext();
    fetch(audioUrl)
      .then((r) => r.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((decoded) => {
        if (cancelled) return;
        setDuration(decoded.duration);
        const raw = decoded.getChannelData(0);
        const targetPeaks = 500;
        const step = Math.floor(raw.length / targetPeaks);
        const peaks = new Float32Array(targetPeaks);
        for (let i = 0; i < targetPeaks; i++) {
          let max = 0;
          const start = i * step;
          const end = Math.min(start + step, raw.length);
          for (let j = start; j < end; j++) {
            const abs = Math.abs(raw[j]);
            if (abs > max) max = abs;
          }
          peaks[i] = max;
        }
        peaksRef.current = peaks;
      })
      .catch(() => {});
    return () => { cancelled = true; void ctx.close(); };
  }, [audioUrl]);

  useEffect(() => { drawWaveform(); }, [duration, offsetSec, tagDurationSec, playbackPosition, playing]);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const peaks = peaksRef.current;
    if (!canvas || !peaks) return;
    const ctx2 = canvas.getContext("2d");
    if (!ctx2) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx2.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;
    const mid = h / 2;
    ctx2.clearRect(0, 0, w, h);

    // Played region gradient
    if (playing && duration > 0) {
      const playedX = (playbackPosition / duration) * w;
      const grad = ctx2.createLinearGradient(0, 0, playedX, 0);
      grad.addColorStop(0, "rgba(167, 139, 250, 0.10)");
      grad.addColorStop(1, "rgba(167, 139, 250, 0.02)");
      ctx2.fillStyle = grad;
      ctx2.fillRect(0, 0, playedX, h);
    }

    // Tag region
    if (duration > 0 && tagDurationSec > 0) {
      const tagStartX = (offsetSec / duration) * w;
      const tagWidth = (tagDurationSec / duration) * w;
      ctx2.fillStyle = "rgba(167, 139, 250, 0.15)";
      ctx2.fillRect(tagStartX, 0, tagWidth, h);
    }

    // Bar grid
    if (duration > 0) {
      const barSec = 2;
      ctx2.strokeStyle = "rgba(255,255,255,0.04)";
      ctx2.lineWidth = 1;
      for (let t = 0; t < duration; t += barSec) {
        const x = (t / duration) * w;
        ctx2.beginPath(); ctx2.moveTo(x, 0); ctx2.lineTo(x, h); ctx2.stroke();
      }
    }

    // Waveform bars
    const barW = Math.max(1, w / peaks.length - 0.4);
    const maxPeak = Math.max(...peaks, 0.01);
    const playX = playing && duration > 0 ? (playbackPosition / duration) * w : -1;
    const tagStartX = duration > 0 ? (offsetSec / duration) * w : 0;
    const tagEndX = tagStartX + (tagDurationSec / duration) * w;

    for (let i = 0; i < peaks.length; i++) {
      const x = (i / peaks.length) * w;
      const barH = (peaks[i] / maxPeak) * (h * 0.82);
      const inTag = x >= tagStartX && x <= tagEndX;
      const nearPlayhead = playing && Math.abs(x - playX) < w * 0.015;
      if (nearPlayhead) {
        ctx2.fillStyle = "#a78bfa";
      } else if (inTag) {
        ctx2.fillStyle = "rgba(167, 139, 250, 0.7)";
      } else if (playing && x < playX) {
        ctx2.fillStyle = "rgba(255,255,255,0.35)";
      } else {
        ctx2.fillStyle = "rgba(255,255,255,0.18)";
      }
      ctx2.fillRect(x, mid - barH / 2, barW, barH);
    }

    // Tag placement marker (triangle + line)
    const markerX = (offsetSec / duration) * w;
    ctx2.strokeStyle = "#a78bfa";
    ctx2.lineWidth = 2;
    ctx2.beginPath(); ctx2.moveTo(markerX, 0); ctx2.lineTo(markerX, h); ctx2.stroke();
    ctx2.fillStyle = "#a78bfa";
    ctx2.beginPath();
    ctx2.moveTo(markerX - 5, 0);
    ctx2.lineTo(markerX + 5, 0);
    ctx2.lineTo(markerX, 8);
    ctx2.closePath();
    ctx2.fill();

    // Playhead (during playback)
    if (playing && duration > 0) {
      const phX = (playbackPosition / duration) * w;
      ctx2.shadowColor = "#a78bfa";
      ctx2.shadowBlur = 8;
      ctx2.strokeStyle = "#c4b5fd";
      ctx2.lineWidth = 2;
      ctx2.beginPath(); ctx2.moveTo(phX, 0); ctx2.lineTo(phX, h); ctx2.stroke();
      ctx2.shadowBlur = 0;
      // Playhead dot
      ctx2.fillStyle = "#fff";
      ctx2.beginPath(); ctx2.arc(phX, mid, 3, 0, Math.PI * 2); ctx2.fill();
    }

    // Time label under marker
    ctx2.fillStyle = "rgba(255,255,255,0.5)";
    ctx2.font = "10px system-ui, sans-serif";
    ctx2.textAlign = "center";
    ctx2.fillText(formatTime(offsetSec), markerX, h - 4);
  }, [duration, offsetSec, tagDurationSec, playbackPosition, playing]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => drawWaveform());
    ro.observe(el);
    return () => ro.disconnect();
  }, [drawWaveform]);

  const pointerToOffset = useCallback(
    (clientX: number): number => {
      const canvas = canvasRef.current;
      if (!canvas || duration <= 0) return 0;
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);
      onOffsetChange(pointerToOffset(e.clientX));
    },
    [disabled, onOffsetChange, pointerToOffset],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || disabled) return;
      onOffsetChange(pointerToOffset(e.clientX));
    },
    [dragging, disabled, onOffsetChange, pointerToOffset],
  );

  const onPointerUp = useCallback(() => { setDragging(false); }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="h-20 w-full rounded-xl cursor-ew-resize"
        style={{ touchAction: "none", background: "rgba(0,0,0,0.3)" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      {!duration && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl text-xs text-white/30" style={{ background: "rgba(0,0,0,0.3)" }}>
          Loading waveform…
        </div>
      )}
    </div>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 10);
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}.${ms}` : `${s}.${ms}s`;
}
