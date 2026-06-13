/**
 * Shorts — démarrer au milieu / chorus (évite intro instrumentale longue).
 */
import { parseLyricLines } from "./communityYoutubeTitle.mjs";
import { probeAudioDurationSec } from "./trendRemixVideoDuration.mjs";
import { communityShortSec } from "./youtubeDailyCadence.mjs";

function chorusLineIndex(lyrics) {
  const raw = String(lyrics ?? "").split(/\r?\n/);
  for (let i = 0; i < raw.length; i += 1) {
    if (/\[?\s*chorus\s*\]?/i.test(raw[i])) return i;
  }
  const lines = parseLyricLines(lyrics);
  if (lines.length < 4) return Math.floor(lines.length / 2);
  const counts = new Map();
  for (const l of lines) counts.set(l.toLowerCase(), (counts.get(l.toLowerCase()) || 0) + 1);
  const chorus = lines.findIndex((l) => (counts.get(l.toLowerCase()) || 0) >= 2);
  return chorus >= 0 ? chorus : Math.floor(lines.length * 0.38);
}

/** @returns {{ startSec: number, durationSec: number }} */
export function resolveShortAudioWindow({ lyrics, totalDurationSec, slot = 0 }) {
  const durationSec = communityShortSec();
  const total = Math.max(durationSec + 1, Number(totalDurationSec) || durationSec + 30);

  const lineIdx = chorusLineIndex(lyrics);
  const lines = parseLyricLines(lyrics);
  const lineRatio = lines.length > 0 ? lineIdx / lines.length : 0.35;

  let startSec = total * Math.max(0.22, Math.min(0.55, lineRatio + 0.08));
  startSec += (slot % 3) * 9;
  startSec = Math.max(0, Math.min(total - durationSec - 1, startSec));

  return {
    startSec: Math.round(startSec * 100) / 100,
    durationSec,
  };
}

export async function resolveShortAudioWindowFromFile({ audioPath, lyrics, slot = 0 }) {
  const probed = await probeAudioDurationSec(audioPath);
  return resolveShortAudioWindow({
    lyrics,
    totalDurationSec: probed ?? 180,
    slot,
  });
}
