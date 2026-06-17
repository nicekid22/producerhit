export type AudioAnalysis = {
  peak: number;
  rms: number;
  suggestedGainDb: number;
};

/** Cible streaming (~-1 dBFS) — un peu plus de présence sans clipper. */
const TARGET_PEAK_DB = -1.0;
const TARGET_PEAK = 10 ** (TARGET_PEAK_DB / 20);

export function analyzeBuffer(buffer: AudioBuffer): AudioAnalysis {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  let peak = 0;
  let sumSq = 0;
  let count = 0;

  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      const v = Math.abs(data[i] ?? 0);
      if (v > peak) peak = v;
      sumSq += v * v;
      count += 1;
    }
  }

  const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
  const suggestedGainDb = peak > 0 ? 20 * Math.log10(TARGET_PEAK / peak) : 0;

  return { peak, rms, suggestedGainDb };
}

/** Gain de sortie prudent : audible mais sans écraser un mix déjà fort. */
export function computeMasterOutputGainDb(input: AudioAnalysis, presetOutputGainDb: number): number {
  let gainDb = input.suggestedGainDb + presetOutputGainDb * 0.45;

  if (input.peak > 0.92) gainDb = Math.min(gainDb, 0.25);
  else if (input.peak > 0.82) gainDb = Math.min(gainDb, 1);

  if (input.rms > 0.14) gainDb -= 0.8;
  else if (input.rms > 0.1) gainDb -= 0.35;

  return Math.max(-2.5, Math.min(2, gainDb));
}

export async function applyGainDb(buffer: AudioBuffer, gainDb: number): Promise<AudioBuffer> {
  if (Math.abs(gainDb) < 0.02) return buffer;
  const gain = 10 ** (gainDb / 20);
  const ctx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(g);
  g.connect(ctx.destination);
  src.start(0);
  return ctx.startRendering();
}
