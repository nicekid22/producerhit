import type { ProducerTagFxPreset, ProducerTagPlacement } from "@producerhit/shared";

export type TagPreviewParams = {
  beatUrl: string;
  tagUrl: string;
  offsetSec: number;
  volumeDb: number;
  durationSec: number;
};

/** Client-side preview (gratuit) — mix beat + tag via Web Audio. */
export async function previewProducerTagMix(params: TagPreviewParams): Promise<{ stop: () => void }> {
  const ctx = new AudioContext();
  const [beatRes, tagRes] = await Promise.all([fetch(params.beatUrl), fetch(params.tagUrl)]);
  const [beatBuf, tagBuf] = await Promise.all([beatRes.arrayBuffer(), tagRes.arrayBuffer()]);
  const beat = await ctx.decodeAudioData(beatBuf.slice(0));
  const tag = await ctx.decodeAudioData(tagBuf.slice(0));

  const beatSrc = ctx.createBufferSource();
  beatSrc.buffer = beat;

  const tagSrc = ctx.createBufferSource();
  tagSrc.buffer = tag;

  const tagGain = ctx.createGain();
  tagGain.gain.value = Math.pow(10, params.volumeDb / 20);

  const master = ctx.createGain();
  master.gain.value = 1;

  beatSrc.connect(master);
  tagSrc.connect(tagGain);
  tagGain.connect(master);
  master.connect(ctx.destination);

  const startAt = ctx.currentTime;
  beatSrc.start(startAt);
  tagSrc.start(startAt + Math.max(0, params.offsetSec));

  const stopAt = startAt + Math.min(params.durationSec, beat.duration + 1);
  const timer = window.setTimeout(() => {
    try {
      beatSrc.stop();
      tagSrc.stop();
    } catch {
      // ignore
    }
    void ctx.close();
  }, (stopAt - startAt) * 1000);

  return {
    stop: () => {
      window.clearTimeout(timer);
      try {
        beatSrc.stop();
        tagSrc.stop();
      } catch {
        // ignore
      }
      void ctx.close();
    },
  };
}

export const BASIC_PLACEMENTS: ProducerTagPlacement[] = ["intro", "outro"];

export const EXTENDED_PLACEMENTS: ProducerTagPlacement[] = [
  "intro",
  "outro",
  "pre_drop",
  "bar_8",
  "bar_16",
  "random_bars",
  "smart_intro",
];

export const FX_PRESETS: Array<{ id: ProducerTagFxPreset; labelFr: string; labelEn: string }> = [
  { id: "clean", labelFr: "Clean", labelEn: "Clean" },
  { id: "radio", labelFr: "Radio", labelEn: "Radio" },
  { id: "reverb", labelFr: "Reverb", labelEn: "Reverb" },
  { id: "phone", labelFr: "Téléphone", labelEn: "Phone" },
  { id: "pitch_up", labelFr: "Pitch +", labelEn: "Pitch +" },
  { id: "pitch_down", labelFr: "Pitch -", labelEn: "Pitch -" },
];
