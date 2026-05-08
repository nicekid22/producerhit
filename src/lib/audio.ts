function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const noteToSemitone: Record<string, number> = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

function midiToHz(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function writeString(view: DataView, offset: number, s: string) {
  for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
}

export function createPlaceholderWavUrl({
  bpm,
  loopLengthBars,
  key,
  swing,
}: {
  bpm: number;
  loopLengthBars: number;
  key: string;
  swing: number;
}) {
  const sampleRate = 44100;
  const seconds = estimatePlaceholderDurationSec({ bpm, loopLengthBars });

  const frames = Math.floor(seconds * sampleRate);
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = frames * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);

  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const root = noteToSemitone[key] ?? 0;
  const baseMidi = 48 + root;
  const f1 = midiToHz(baseMidi);
  const f3 = midiToHz(baseMidi + 7);
  const f5 = midiToHz(baseMidi + 12);

  const swingAmt = clamp(swing, 0, 100) / 100;
  const pulseHz = 2 + swingAmt * 2;
  const fade = Math.floor(sampleRate * 0.02);

  let offset = 44;
  for (let i = 0; i < frames; i++) {
    const t = i / sampleRate;
    const pulse = 0.55 + 0.45 * Math.sin(2 * Math.PI * pulseHz * t);
    const s =
      0.28 * Math.sin(2 * Math.PI * f1 * t) +
      0.18 * Math.sin(2 * Math.PI * f3 * t) +
      0.12 * Math.sin(2 * Math.PI * f5 * t);

    let amp = 0.75 * pulse;
    if (i < fade) amp *= i / fade;
    if (frames - i < fade) amp *= (frames - i) / fade;

    const v = Math.max(-1, Math.min(1, s * amp));
    view.setInt16(offset, Math.floor(v * 0x7fff), true);
    offset += 2;
  }

  const blob = new Blob([buffer], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}

export function estimatePlaceholderDurationSec({
  bpm,
  loopLengthBars,
}: {
  bpm: number;
  loopLengthBars: number;
}) {
  const secondsPerBeat = 60 / clamp(bpm, 60, 200);
  const beats = Math.max(1, loopLengthBars) * 4;
  const idealSeconds = beats * secondsPerBeat;
  return clamp(idealSeconds, 3, 12);
}

