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
  gain = 0.04,
  type: OscillatorType = "sine",
) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/** Cristal prismatique — tintements diamant, arpège aigu. */
export function playPrismDiamondSfx() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const chime = [1568, 1975.53, 2349.32, 3136, 2637.02];
  chime.forEach((freq, i) => {
    tone(freq, t + i * 0.038, 0.14, 0.032 - i * 0.004, "sine");
    tone(freq * 1.002, t + i * 0.038 + 0.004, 0.09, 0.012, "triangle");
  });
  tone(3920, t + 0.2, 0.22, 0.018, "sine");
  tone(5232.5, t + 0.24, 0.16, 0.01, "triangle");
}

/** Été chaud — marimba douce, onde de chaleur. */
export function playWarmSummerSfx() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const warm = [392, 493.88, 587.33, 659.25, 783.99];
  warm.forEach((freq, i) => {
    tone(freq, t + i * 0.065, 0.18, 0.038 - i * 0.005, "triangle");
  });
  tone(329.63, t + 0.08, 0.42, 0.022, "sine");
  tone(987.77, t + 0.34, 0.28, 0.014, "sine");
}

export function playThemeSkinSfx(theme: "prism" | "warm-glass") {
  if (theme === "prism") playPrismDiamondSfx();
  else playWarmSummerSfx();
}
