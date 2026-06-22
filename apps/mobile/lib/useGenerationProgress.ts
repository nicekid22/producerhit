import { useEffect, useRef, useState } from "react";
import {
  estimateGenerationDurationMs,
  estimateSongDurationFromLyrics,
  simulatedGenerationPercent,
  type GenerationJobStatus,
} from "@producerhit/shared";

type Options = {
  active: boolean;
  mode: "song" | "beat";
  jobStatus: GenerationJobStatus | null;
  done: boolean;
  lyricsText?: string;
  manualLyrics?: boolean;
};

/** Progression fluide alignée desktop — ACE ne fournit pas de % réel. */
export function useGenerationProgress({
  active,
  mode,
  jobStatus,
  done,
  lyricsText,
  manualLyrics,
}: Options): number {
  const [progress, setProgress] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      startedAtRef.current = null;
      setProgress(0);
      return;
    }

    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
    }

    if (done || jobStatus === "completed") {
      setProgress(100);
      return;
    }

    if (jobStatus === "failed") {
      setProgress(0);
      return;
    }

    const durationSec =
      mode === "song" && manualLyrics && lyricsText?.trim()
        ? estimateSongDurationFromLyrics(lyricsText)
        : null;
    const expectedMs = estimateGenerationDurationMs(mode, durationSec, lyricsText);

    const tick = () => {
      const startedAt = startedAtRef.current ?? Date.now();
      const pct = simulatedGenerationPercent(Date.now() - startedAt, expectedMs);
      setProgress((prev) => (pct > prev ? pct : prev));
    };

    tick();
    const id = setInterval(tick, 450);
    return () => clearInterval(id);
  }, [active, mode, jobStatus, done, lyricsText, manualLyrics]);

  return progress;
}
