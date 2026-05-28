let ctx: AudioContext | null = null;
let lastTick = 0;

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

function tone(freq: number, start: number, dur: number, gain = 0.06, type: OscillatorType = "sine") {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/** Ambient shimmer when loot modal opens */
export function playLootTeaser() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  tone(440, t, 0.35, 0.04);
  tone(554.37, t + 0.06, 0.4, 0.035);
  tone(659.25, t + 0.12, 0.5, 0.03);
}

/** Chest open / reel start */
export function playLootOpen() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  tone(220, t, 0.08, 0.05, "triangle");
  tone(330, t + 0.05, 0.12, 0.055, "sine");
  tone(440, t + 0.1, 0.18, 0.05, "sine");
  tone(880, t + 0.14, 0.22, 0.035, "sine");
}

/** Subtle tick while reel spins (throttled) */
export function playLootSpinTick() {
  const now = performance.now();
  if (now - lastTick < 90) return;
  lastTick = now;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  tone(900 + Math.random() * 120, t, 0.03, 0.018, "square");
}

/** Win reveal */
export function playLootWin() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => tone(f, t + i * 0.07, 0.35, 0.045 - i * 0.006));
  tone(1318.5, t + 0.32, 0.55, 0.03, "triangle");
}
