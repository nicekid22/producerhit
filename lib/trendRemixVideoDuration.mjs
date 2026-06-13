/**
 * Trend remix video length — match audio duration (no 45s preview cap).
 */
import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

/** Hard ceiling only (safety). Default 10 min — not a target length. */
export function trendRemixDurationCeiling() {
  const raw = Number(process.env.TREND_REMIX_MAX_SEC ?? 600);
  if (!Number.isFinite(raw) || raw <= 0) return 600;
  return Math.max(30, raw);
}

export function durationFromLoopMeta(loop) {
  const ace = loop?.stems_url?.ace;
  if (!ace || typeof ace !== "object") return null;
  const d = Number(ace.duration);
  if (Number.isFinite(d) && d > 5) return d;
  return null;
}

export async function probeAudioDurationSec(audioPath) {
  const bin = ffmpegPath;
  if (!bin || !audioPath) return null;

  return new Promise((resolve) => {
    const proc = spawn(bin, ["-i", audioPath], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    proc.on("error", () => resolve(null));
    proc.on("close", () => {
      const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (!match) return resolve(null);
      const sec = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
      resolve(Number.isFinite(sec) && sec > 0 ? sec : null);
    });
  });
}

/** Resolve render duration: explicit override → probed audio → ACE meta → env fallback. */
export async function resolveTrendRemixVideoDuration(loop, audioPath, explicitMaxSec) {
  if (explicitMaxSec != null && Number.isFinite(Number(explicitMaxSec)) && Number(explicitMaxSec) > 0) {
    return Math.min(Number(explicitMaxSec), trendRemixDurationCeiling());
  }

  const probed = audioPath ? await probeAudioDurationSec(audioPath) : null;
  const meta = durationFromLoopMeta(loop);
  const fallback = Number(process.env.TREND_REMIX_DURATION_SEC ?? 90);
  const sec = probed ?? meta ?? (Number.isFinite(fallback) ? fallback : 90);

  return Math.min(Math.max(5, Math.round(sec * 100) / 100), trendRemixDurationCeiling());
}
