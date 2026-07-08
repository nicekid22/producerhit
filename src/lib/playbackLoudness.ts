/**
 * Loudness à la lecture (navigateur) — sans modifier les fichiers générés.
 * Rollback : VITE_PLAYBACK_LOUDNESS=0
 */

import { analyzeBuffer } from "@/lib/mastering/analyze";
import { fetchCachedLoopAudioBlob } from "@/stores/loopsStore";

const TARGET_PEAK_DB = -1.2;
const TARGET_PEAK = 10 ** (TARGET_PEAK_DB / 20);

export const PLAYBACK_LOUDNESS = import.meta.env.VITE_PLAYBACK_LOUDNESS !== "0";

/** Makeup par défaut (~+3 dB) avant analyse du pic réel. */
export const PLAYBACK_DEFAULT_MAKEUP_LINEAR = 1.4;

/** Plafond de gain (~+12 dB) pour limiter la distorsion sur pistes très faibles. */
export const MAX_PLAYBACK_GAIN_LINEAR = 4;

const peakGainCache = new Map<string, number>();

function getAudioContextCtor(): typeof AudioContext {
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  return w.AudioContext ?? w.webkitAudioContext ?? AudioContext;
}

/** Gain linéaire cible à partir du pic (aligné mastering, -1.2 dBFS). */
export function computePlaybackMakeupLinear(peak: number): number {
  if (!Number.isFinite(peak) || peak <= 0) return PLAYBACK_DEFAULT_MAKEUP_LINEAR;
  const fromPeak = peak > 0 ? TARGET_PEAK / peak : 1;
  if (peak >= 0.92) return Math.min(1.15, Math.max(1, fromPeak));
  return Math.min(MAX_PLAYBACK_GAIN_LINEAR, Math.max(1, fromPeak));
}

export function getCachedPlaybackMakeup(cacheKey: string): number | undefined {
  return peakGainCache.get(cacheKey);
}

export function setCachedPlaybackMakeup(cacheKey: string, linear: number) {
  peakGainCache.set(cacheKey, linear);
}

async function decodePeakFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<number> {
  const Ctor = getAudioContextCtor();
  const ctx = new Ctor();
  try {
    const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const { peak } = analyzeBuffer(buffer);
    return peak;
  } finally {
    if (typeof ctx.close === "function") await ctx.close().catch(() => undefined);
  }
}

/**
 * Mesure le pic (cache loop ou fetch CORS) et retourne un gain makeup linéaire.
 */
export async function measurePlaybackMakeupLinear(
  sourceUrl: string,
  cacheKey?: string,
): Promise<number> {
  const key = (cacheKey?.trim() || sourceUrl.trim()) || sourceUrl;
  const cached = peakGainCache.get(key);
  if (cached != null) return cached;

  const trimmed = sourceUrl.trim();
  if (!trimmed) return PLAYBACK_DEFAULT_MAKEUP_LINEAR;

  let arrayBuffer: ArrayBuffer | null = null;

  if (cacheKey?.trim() && !cacheKey.includes(":")) {
    try {
      const blob = await fetchCachedLoopAudioBlob(cacheKey.trim());
      if (blob?.size) arrayBuffer = await blob.arrayBuffer();
    } catch {
      /* ignore */
    }
  }

  if (!arrayBuffer && (trimmed.startsWith("http://") || trimmed.startsWith("https://"))) {
    try {
      const res = await fetch(trimmed, { mode: "cors", credentials: "omit", referrerPolicy: "no-referrer" });
      if (res.ok) arrayBuffer = await res.arrayBuffer();
    } catch {
      /* ignore */
    }
  }

  if (!arrayBuffer) {
    peakGainCache.set(key, PLAYBACK_DEFAULT_MAKEUP_LINEAR);
    return PLAYBACK_DEFAULT_MAKEUP_LINEAR;
  }

  try {
    const peak = await decodePeakFromArrayBuffer(arrayBuffer);
    const gain = computePlaybackMakeupLinear(peak);
    peakGainCache.set(key, gain);
    return gain;
  } catch {
    peakGainCache.set(key, PLAYBACK_DEFAULT_MAKEUP_LINEAR);
    return PLAYBACK_DEFAULT_MAKEUP_LINEAR;
  }
}
