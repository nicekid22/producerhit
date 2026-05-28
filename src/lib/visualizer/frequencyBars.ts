export const BAR_COUNT = 72;

export function createBarBuffer(count = BAR_COUNT): Float32Array {
  return new Float32Array(count);
}

export function readAnalyserBars(analyser: AnalyserNode, freq: Uint8Array, bars: Float32Array, playing: boolean): void {
  analyser.getByteFrequencyData(freq);
  const n = bars.length;
  for (let i = 0; i < n; i++) {
    const bin = Math.min(freq.length - 1, Math.floor((i / n) * freq.length * 0.85));
    const v = (freq[bin] ?? 0) / 255;
    const target = playing ? v : 0;
    bars[i] = bars[i] * 0.38 + target * 0.62;
  }
}

/** Fallback motion when analyser unavailable (CORS / preview idle). */
export function animateFakeBars(bars: Float32Array, timeSec: number): void {
  const n = bars.length;
  for (let i = 0; i < n; i++) {
    const v =
      0.08 +
      0.92 *
        (0.5 + 0.5 * Math.sin(timeSec * 3.4 + i * 0.24)) *
        (0.55 + 0.45 * Math.sin(timeSec * 1.1 + i * 0.11));
    bars[i] = bars[i] * 0.42 + v * 0.58;
  }
}

export function bassEnergy(bars: Float32Array): number {
  const n = Math.max(1, Math.floor(bars.length * 0.18));
  let sum = 0;
  for (let i = 0; i < n; i++) sum += bars[i] ?? 0;
  return sum / n;
}
