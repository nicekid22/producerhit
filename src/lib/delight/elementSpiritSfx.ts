import type { ElementKind } from "@/components/icons/ElementIcons";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  } catch {
    /* ignore */
  }
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  return ctx;
}

function tone(
  freq: number,
  start: number,
  dur: number,
  gain = 0.05,
  type: OscillatorType = "square",
) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/** Jingle rétro « esprit / item obtenu » — inspiré fanfare Zelda, synth Web Audio. */
export function playElementSpiritSfx(element: ElementKind) {
  const c = getCtx();
  if (!c) return;

  const roots: Record<ElementKind, number> = {
    air: 659.25,
    earth: 392,
    fire: 523.25,
    water: 493.88,
  };
  const wave: Record<ElementKind, OscillatorType> = {
    air: "sine",
    earth: "triangle",
    fire: "square",
    water: "sine",
  };

  const root = roots[element];
  const type = wave[element];
  const t = c.currentTime;
  const arp = [1, 1.2, 1.5, 2];

  arp.forEach((mult, i) => {
    tone(root * mult, t + i * 0.052, 0.11, 0.042 - i * 0.007, type);
  });

  tone(root * 2.5, t + 0.26, 0.38, 0.028, "triangle");
  tone(root * 3, t + 0.22, 0.12, 0.016, "sine");
  tone(root * 4, t + 0.34, 0.2, 0.012, "sine");
}
