import { adaptPresetForInput, MASTER_PRESETS } from "@/lib/mastering/presets";
import { analyzeBuffer, applyGainDb, computeMasterOutputGainDb } from "@/lib/mastering/analyze";
import { fetchCachedLoopAudioBlob } from "@/stores/loopsStore";
import type { MasterPreset, MasterPresetId } from "@/lib/mastering/presets";

function getAudioContextCtor(): typeof AudioContext {
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  return w.AudioContext ?? w.webkitAudioContext ?? AudioContext;
}

/** Saturation douce type tanh — pas de distorsion agressive. */
function makeSaturationCurve(amount: number): Float32Array<ArrayBuffer> | null {
  if (amount <= 0.008) return null;
  const samples = 2048;
  const curve = new Float32Array(samples);
  const drive = 1 + amount * 2.5;
  const norm = Math.tanh(drive);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = norm > 0 ? Math.tanh(x * drive) / norm : x;
  }
  return curve;
}

async function decodeArrayBuffer(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
  const Ctor = getAudioContextCtor();
  const ctx = new Ctor();
  try {
    return await ctx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    void ctx.close?.();
  }
}

export async function loadMasteringSource(loopId: string, audioUrl: string | null, ensureAudioReady: (id: string) => Promise<string>): Promise<AudioBuffer> {
  const cached = await fetchCachedLoopAudioBlob(loopId).catch(() => null);
  if (cached?.size) return decodeArrayBuffer(await cached.arrayBuffer());

  const src = audioUrl?.trim() || (await ensureAudioReady(loopId));
  if (!src) throw new Error("Audio unavailable");
  const res = await fetch(src);
  if (!res.ok) throw new Error("Audio fetch failed");
  return decodeArrayBuffer(await res.arrayBuffer());
}

function connectChain(
  ctx: OfflineAudioContext,
  source: AudioBufferSourceNode,
  preset: MasterPreset,
): void {
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 28;
  hp.Q.value = 0.5;

  const low = ctx.createBiquadFilter();
  low.type = "lowshelf";
  low.frequency.value = 120;
  low.gain.value = preset.lowGain;

  const mid = ctx.createBiquadFilter();
  mid.type = "peaking";
  mid.frequency.value = 2200;
  mid.Q.value = 0.7;
  mid.gain.value = preset.midGain;

  const high = ctx.createBiquadFilter();
  high.type = "highshelf";
  high.frequency.value = 9000;
  high.gain.value = preset.highGain;

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = preset.compressor.threshold;
  comp.ratio.value = preset.compressor.ratio;
  comp.attack.value = preset.compressor.attack;
  comp.release.value = preset.compressor.release;
  comp.knee.value = preset.compressor.knee;

  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = preset.limiter.threshold;
  limiter.ratio.value = preset.limiter.ratio;
  limiter.attack.value = 0.004;
  limiter.release.value = 0.12;
  limiter.knee.value = 2;

  source.connect(hp);
  hp.connect(low);
  low.connect(mid);
  mid.connect(high);
  high.connect(comp);

  const satCurve = makeSaturationCurve(preset.saturation);
  if (satCurve) {
    const shaper = ctx.createWaveShaper();
    shaper.curve = satCurve;
    shaper.oversample = "2x";
    comp.connect(shaper);
    shaper.connect(limiter);
  } else {
    comp.connect(limiter);
  }

  limiter.connect(ctx.destination);
}

export async function masterAudioBuffer(
  input: AudioBuffer,
  presetId: MasterPresetId,
  onProgress?: (value: number) => void,
): Promise<AudioBuffer> {
  onProgress?.(0.05);
  const preset = MASTER_PRESETS[presetId];
  if (!preset) throw new Error("Unknown mastering preset: " + presetId);

  const inputAnalysis = analyzeBuffer(input);
  const adapted = adaptPresetForInput(preset, inputAnalysis);

  const channels = input.numberOfChannels;
  const length = input.length;
  const sampleRate = input.sampleRate;
  const ctx = new OfflineAudioContext(channels, length, sampleRate);

  const source = ctx.createBufferSource();
  source.buffer = input;
  connectChain(ctx, source, adapted);

  source.start(0);
  onProgress?.(0.3);

  let rendered = await ctx.startRendering();
  onProgress?.(0.75);

  const postAnalysis = analyzeBuffer(rendered);
  const gainDb = computeMasterOutputGainDb(postAnalysis, adapted.outputGainDb);
  rendered = await applyGainDb(rendered, gainDb);

  onProgress?.(1);
  return rendered;
}
