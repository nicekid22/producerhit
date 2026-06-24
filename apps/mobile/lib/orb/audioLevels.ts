export type AudioLevels = {
  bass: number;
  mid: number;
  high: number;
  overall: number;
};

const IDLE: AudioLevels = { bass: 0.12, mid: 0.1, high: 0.07, overall: 0.1 };

/** Niveaux audio simulés — beat-sync BPM en lecture, mode démo sinon. */
export function sampleAudioLevels(input: {
  enabled: boolean;
  playing: boolean;
  bpm?: number;
  positionMs: number;
  demoT: number;
  energy: "idle" | "active" | "playing";
}): AudioLevels {
  if (!input.enabled) return IDLE;

  const t = input.demoT;

  if (input.playing && input.bpm && input.bpm > 0) {
    const beatMs = 60000 / input.bpm;
    const beatPhase = ((input.positionMs % beatMs) + beatMs) % beatMs / beatMs;
    const kick = Math.pow(Math.max(0, 1 - beatPhase * 1.15), 2.2);
    const hat = Math.pow(Math.sin(beatPhase * Math.PI * 4), 2) * 0.35;
    const bass = 0.22 + kick * 0.62 + Math.sin(t * 1.4) * 0.08;
    const mid = 0.18 + hat * 0.45 + Math.sin(t * 2.3 + 1) * 0.12;
    const high = 0.1 + Math.sin(t * 4.5 + 2) * 0.18 + kick * 0.15;
    return {
      bass: clamp01(bass),
      mid: clamp01(mid),
      high: clamp01(high),
      overall: clamp01((bass + mid + high) / 3),
    };
  }

  const energyMul = input.energy === "active" ? 1.35 : input.energy === "playing" ? 1.15 : 1;
  const b = 0.3 + 0.25 * Math.sin(t * 1.3) + 0.12 * Math.sin(t * 3.7);
  const m = 0.25 + 0.2 * Math.sin(t * 2.1 + 1) + 0.1 * Math.sin(t * 5.1);
  const h = 0.15 + 0.15 * Math.sin(t * 4.2 + 2) + 0.08 * Math.sin(t * 7.3);
  return {
    bass: clamp01(b * energyMul),
    mid: clamp01(m * energyMul),
    high: clamp01(h * energyMul),
    overall: clamp01(((b + m + h) / 3) * energyMul),
  };
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function smoothAudioLevels(current: AudioLevels, target: AudioLevels, speed = 0.08): AudioLevels {
  return {
    bass: current.bass + (target.bass - current.bass) * speed,
    mid: current.mid + (target.mid - current.mid) * speed,
    high: current.high + (target.high - current.high) * speed,
    overall: current.overall + (target.overall - current.overall) * speed,
  };
}
