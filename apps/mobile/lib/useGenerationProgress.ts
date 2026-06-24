import { useEffect, useRef, useState } from "react";
import {
  estimateGenerationDurationMs,
  estimateSongDurationFromLyrics,
  simulatedGenerationPercent,
  type GenerationJobStatus,
} from "@producerhit/shared";

type Options = {
  active: boolean;
  /** Bump on each new generation so progress never resets mid-job. */
  sessionId: number;
  mode: "song" | "beat";
  jobStatus: GenerationJobStatus | null;
  done: boolean;
  /** Texte saisi par l'utilisateur uniquement — pas les placeholders rotatifs. */
  lyricsText?: string;
  manualLyrics?: boolean;
};

/** Aligné web (~900 ms) — setInterval fiable sur iOS (rAF peut être bridé avec WebGL). */
const TICK_MS = 500;
const MIN_VISIBLE_PCT = 3;

function statusFloor(status: GenerationJobStatus | null): number {
  switch (status) {
    case "running":
      return 40;
    case "completed":
      return 94;
    case "pending":
      return 6;
    default:
      return MIN_VISIBLE_PCT;
  }
}

/**
 * Progression fluide — ACE ne fournit pas de % réel.
 * Courbe temps (shared/web) + plancher lié au statut job (pending → running → completed).
 */
export function useGenerationProgress({
  active,
  sessionId,
  mode,
  jobStatus,
  done,
  lyricsText,
  manualLyrics,
}: Options): number {
  const [progress, setProgress] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const displayRef = useRef(0);
  const sessionIdRef = useRef(sessionId);
  const jobStatusRef = useRef(jobStatus);
  const doneRef = useRef(done);
  const modeRef = useRef(mode);
  const lyricsRef = useRef(lyricsText);
  const manualLyricsRef = useRef(manualLyrics);

  jobStatusRef.current = jobStatus;
  doneRef.current = done;
  modeRef.current = mode;
  lyricsRef.current = lyricsText;
  manualLyricsRef.current = manualLyrics;

  useEffect(() => {
    if (!active) {
      startedAtRef.current = null;
      displayRef.current = 0;
      setProgress(0);
      return;
    }

    if (sessionIdRef.current !== sessionId) {
      sessionIdRef.current = sessionId;
      startedAtRef.current = Date.now();
      displayRef.current = MIN_VISIBLE_PCT;
      setProgress(MIN_VISIBLE_PCT);
    } else if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
      displayRef.current = MIN_VISIBLE_PCT;
      setProgress(MIN_VISIBLE_PCT);
    }
  }, [active, sessionId]);

  useEffect(() => {
    if (!active) return;

    const tick = () => {
      if (!startedAtRef.current) return;

      const status = jobStatusRef.current;
      if (status === "failed") {
        displayRef.current = 0;
        setProgress(0);
        return;
      }

      const durationSec =
        modeRef.current === "song" && manualLyricsRef.current && lyricsRef.current?.trim()
          ? estimateSongDurationFromLyrics(lyricsRef.current)
          : null;
      const expectedMs = estimateGenerationDurationMs(modeRef.current, durationSec, lyricsRef.current);
      const elapsed = Date.now() - startedAtRef.current;

      if (doneRef.current || status === "completed") {
        const next = displayRef.current + Math.max(1.5, (100 - displayRef.current) * 0.32);
        displayRef.current = next >= 99.5 ? 100 : next;
        setProgress(displayRef.current);
        return;
      }

      const timePct = simulatedGenerationPercent(elapsed, expectedMs);
      const floor = statusFloor(status);
      const target = Math.min(97, Math.max(timePct, floor));

      const prev = displayRef.current;
      let next: number;
      if (target <= prev) {
        next = prev;
      } else if (status === "running" && target - prev > 12) {
        // Saut perceptible quand le job passe en running (évite le « blocage » à ~17 %).
        next = Math.max(prev + 8, target * 0.55);
      } else {
        const gap = target - prev;
        next = prev + gap * (gap > 6 ? 0.5 : 0.65);
      }
      next = Math.max(prev, Math.min(97, next));
      displayRef.current = next;
      setProgress(next);
    };

    tick();
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [active, sessionId]);

  return progress;
}
