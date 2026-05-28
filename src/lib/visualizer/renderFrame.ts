import type { Loop } from "@/types/loop";
import { hashString } from "@/lib/utils";
import { bassEnergy } from "@/lib/visualizer/frequencyBars";
import { ParticleField } from "@/lib/visualizer/particles";
import type { RenderFrameContext } from "@/lib/visualizer/types";

const particleFields = new Map<string, ParticleField>();

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, rw: number, rh: number, r: number) {
  const rr = Math.max(0, Math.min(r, Math.floor(Math.min(rw, rh) / 2)));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + rw, y, x + rw, y + rh, rr);
  ctx.arcTo(x + rw, y + rh, x, y + rh, rr);
  ctx.arcTo(x, y + rh, x, y, rr);
  ctx.arcTo(x, y, x + rw, y, rr);
  ctx.closePath();
}

function pseudo(seed: number, x: number, y: number, t: number): number {
  return Math.abs(Math.sin(seed * 0.001 + x * 12.9898 + y * 78.233 + t * 4.141)) % 1;
}

function drawFilmGrain(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, t: number, strength: number) {
  const step = Math.max(3, Math.floor(w / 180));
  ctx.save();
  ctx.globalAlpha = strength;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const n = pseudo(seed, x, y, t);
      if (n > 0.82) {
        ctx.fillStyle = n > 0.94 ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.28)";
        ctx.fillRect(x, y, step, step);
      }
    }
  }
  ctx.restore();
}

function drawSubtleScratches(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, t: number) {
  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i < 8; i++) {
    const gate = pseudo(seed, i, 0, t * 0.04);
    if (gate < 0.42) continue;
    const x1 = pseudo(seed, i, 1, 0) * w;
    const y1 = pseudo(seed, i, 2, 0) * h;
    const len = 28 + pseudo(seed, i, 3, 0) * 140;
    const angle = pseudo(seed, i, 4, 0) * Math.PI * 2;
    ctx.strokeStyle = `rgba(255,255,255,${0.025 + pseudo(seed, i, 5, t) * 0.035})`;
    ctx.lineWidth = 0.45 + pseudo(seed, i, 6, 0) * 0.55;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + Math.cos(angle) * len, y1 + Math.sin(angle) * len);
    ctx.stroke();
  }

  if (Math.sin(t * 0.65 + seed * 0.001) > 0.985) {
    const sy = h * (0.18 + pseudo(seed, 11, 1, t) * 0.58);
    ctx.strokeStyle = "rgba(255,255,255,0.055)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-w * 0.02, sy);
    ctx.lineTo(w * 1.02, sy + Math.sin(t * 1.4) * 3);
    ctx.stroke();
  }
  ctx.restore();
}

function drawVoidDust(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, t: number) {
  ctx.save();
  for (let i = 0; i < 18; i++) {
    const n = pseudo(seed, i, 7, t * 0.08);
    if (n < 0.55) continue;
    const x = pseudo(seed, i, 8, t * 0.03) * w;
    const y = pseudo(seed, i, 9, t * 0.02) * h;
    const r = 0.4 + pseudo(seed, i, 10, 0) * 1.2;
    ctx.fillStyle = `rgba(255,255,255,${0.02 + n * 0.03})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function voidCoverRect(w: number, h: number, layout: "story" | "square") {
  if (layout === "square") {
    const size = Math.min(w, h) * 0.74;
    return { x: (w - size) / 2, y: h * 0.16, size };
  }
  const size = Math.min(w * 0.9, h * 0.56);
  return { x: (w - size) / 2, y: h * 0.24, size };
}

function drawVoidCover(
  ctx: CanvasRenderingContext2D,
  loop: Loop,
  coverBitmap: ImageBitmap | null,
  w: number,
  h: number,
  layout: "story" | "square",
  t: number,
) {
  const { x, y, size } = voidCoverRect(w, h, layout);
  const breathe = 1 + Math.sin(t * 0.52) * 0.016 + t * 0.008;
  const driftX = Math.sin(t * 0.11) * w * 0.007;
  const driftY = Math.cos(t * 0.085) * h * 0.005;

  if (!coverBitmap) {
    drawGradientCoverFallback(ctx, loop, { x, y, size, radius: 0 });
    return;
  }

  const sw = coverBitmap.width;
  const sh = coverBitmap.height;
  const scale = Math.max(size / sw, size / sh) * breathe;
  const dw = sw * scale;
  const dh = sh * scale;
  const cx = x + (size - dw) / 2 + driftX;
  const cy = y + (size - dh) / 2 + driftY;
  ctx.drawImage(coverBitmap, cx, cy, dw, dh);
}

function drawVoidVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w * 0.5;
  const cy = h * 0.42;
  const vig = ctx.createRadialGradient(cx, cy, w * 0.12, cx, cy, w * 0.82);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(0.72, "rgba(0,0,0,0.18)");
  vig.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

function drawVoidMetadata(ctx: CanvasRenderingContext2D, loop: Loop, w: number, h: number) {
  const title = (loop.name || "ProducerHit").slice(0, 42);
  const sub = [loop.genre, loop.mood].filter(Boolean).join(" · ").slice(0, 36);
  const titleSize = Math.round(w * 0.034);
  const subSize = Math.round(w * 0.022);

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.font = `500 ${titleSize}px Inter, system-ui, -apple-system, Segoe UI, Arial`;
  ctx.fillText(title, w * 0.5, h * 0.905);

  if (sub) {
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.font = `400 ${subSize}px Inter, system-ui, -apple-system, Segoe UI, Arial`;
    ctx.fillText(sub, w * 0.5, h * 0.905 + titleSize * 1.15);
  }
  ctx.textAlign = "left";
}

function renderVoidFrame(input: RenderFrameContext, t: number): void {
  const {
    ctx,
    width: w,
    height: h,
    loop,
    coverBitmap,
    showMetadata = true,
    showWatermark = false,
    watermarkText = "made with ProducerHit",
    layout = "story",
    seed,
  } = input;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);

  drawVoidCover(ctx, loop, coverBitmap, w, h, layout, t);
  drawVoidVignette(ctx, w, h);
  drawSubtleScratches(ctx, w, h, seed, t);
  drawVoidDust(ctx, w, h, seed, t);
  drawFilmGrain(ctx, w, h, seed, t, 0.055);

  if (showMetadata) drawVoidMetadata(ctx, loop, w, h);
  if (showWatermark) {
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.font = `500 ${Math.round(w * 0.02)}px Inter, system-ui, -apple-system, Segoe UI, Arial`;
    ctx.fillText(watermarkText, w * 0.93, h * 0.965);
    ctx.textAlign = "left";
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, loop: Loop, t: number) {
  const hue = hashString(`${loop.id}:${loop.genre}`) % 360;
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, `hsla(${hue}, 55%, 8%, 1)`);
  bg.addColorStop(0.45, `hsla(${(hue + 40) % 360}, 60%, 10%, 1)`);
  bg.addColorStop(1, `hsla(${(hue + 80) % 360}, 50%, 7%, 1)`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const glow1 = ctx.createRadialGradient(w * 0.2, h * 0.15, 0, w * 0.2, h * 0.15, w * 0.55);
  glow1.addColorStop(0, "rgba(236,72,153,0.26)");
  glow1.addColorStop(1, "rgba(236,72,153,0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, w, h);

  const glow2 = ctx.createRadialGradient(w * 0.82, h * 0.78, 0, w * 0.82, h * 0.78, w * 0.62);
  glow2.addColorStop(0, "rgba(6,182,212,0.2)");
  glow2.addColorStop(1, "rgba(6,182,212,0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, w, h);

  const pulse = 0.5 + 0.5 * Math.sin(t * 1.8);
  const glow3 = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, w * (0.35 + pulse * 0.08));
  glow3.addColorStop(0, "rgba(167,139,250,0.12)");
  glow3.addColorStop(1, "rgba(167,139,250,0)");
  ctx.fillStyle = glow3;
  ctx.fillRect(0, 0, w, h);
}

function layoutCoverRect(w: number, h: number, layout: "story" | "square") {
  const pad = Math.round(w * 0.067);
  if (layout === "square") {
    const size = Math.min(w - pad * 2, h * 0.62);
    return { x: Math.floor((w - size) / 2), y: Math.floor(h * 0.18), size, radius: Math.round(size * 0.056) };
  }
  const size = Math.min(w - pad * 2, Math.floor(h * 0.48));
  return { x: pad, y: Math.floor(h * 0.135), size, radius: Math.round(size * 0.056) };
}

function drawGradientCoverFallback(
  ctx: CanvasRenderingContext2D,
  loop: Loop,
  rect: { x: number; y: number; size: number; radius: number },
) {
  const { x, y, size, radius } = rect;
  const seed = hashString(`${loop.id}:${loop.genre}:${loop.mood}:${loop.bpm}`);
  const h1 = seed % 360;
  const h2 = (h1 + 35 + ((seed >>> 8) % 40)) % 360;
  const h3 = (h2 + 35 + ((seed >>> 16) % 40)) % 360;
  ctx.save();
  drawRoundedRect(ctx, x, y, size, size, radius);
  ctx.clip();
  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, `hsla(${h1}, 88%, 62%, 0.92)`);
  grad.addColorStop(0.42, `hsla(${h2}, 90%, 58%, 0.92)`);
  grad.addColorStop(1, `hsla(${h3}, 85%, 55%, 0.92)`);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, size, size);
  ctx.restore();
}

function drawCoverArt(
  ctx: CanvasRenderingContext2D,
  loop: Loop,
  coverBitmap: ImageBitmap | null,
  rect: { x: number; y: number; size: number; radius: number },
  t: number,
  preset: RenderFrameContext["preset"],
) {
  const { x, y, size, radius } = rect;
  const zoom = 1 + t * 0.045 + (preset === "vhs" ? Math.sin(t * 6) * 0.004 : 0);
  const panX = Math.sin(t * 0.18) * size * 0.025;
  const panY = Math.cos(t * 0.14) * size * 0.02;

  const drawCoverLayer = (dx: number, dy: number, alpha: number, composite?: GlobalCompositeOperation) => {
    ctx.save();
    drawRoundedRect(ctx, x, y, size, size, radius);
    ctx.clip();
    if (composite) ctx.globalCompositeOperation = composite;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(x, y, size, size);
    if (coverBitmap) {
      const sw = coverBitmap.width;
      const sh = coverBitmap.height;
      const scale = Math.max(size / sw, size / sh) * zoom;
      const dw = sw * scale;
      const dh = sh * scale;
      const cx = x + (size - dw) / 2 + panX + dx;
      const cy = y + (size - dh) / 2 + panY + dy;
      ctx.drawImage(coverBitmap, cx, cy, dw, dh);
    }
    ctx.restore();
  };

  if (!coverBitmap) {
    drawGradientCoverFallback(ctx, loop, rect);
  } else if (preset === "vhs") {
    drawCoverLayer(-3, 0, 0.45, "screen");
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255,0,80,0.08)";
    drawCoverLayer(4, 0, 0.35);
    ctx.fillStyle = "rgba(0,220,255,0.08)";
    drawCoverLayer(-4, 1, 0.35);
    ctx.restore();
    drawCoverLayer(0, 0, 1);
  } else {
    drawCoverLayer(0, 0, 1);
  }

  const sheenX = (t * 420) % (size + 560) - 560;
  ctx.save();
  drawRoundedRect(ctx, x, y, size, size, radius);
  ctx.clip();
  const sheen = ctx.createLinearGradient(x + sheenX, y, x + sheenX + 560, y + size);
  sheen.addColorStop(0, "rgba(255,255,255,0)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0.12)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, size, size);
  ctx.restore();
}

function drawVhsOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, seed: number) {
  ctx.save();
  for (let y = 0; y < h; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? "rgba(0,0,0,0.09)" : "rgba(255,255,255,0.015)";
    ctx.fillRect(0, y, w, 2);
  }
  const glitchY = (((Math.floor(t * 2.3) * 137 + seed) % 1000) / 1000) * h;
  if (Math.sin(t * 9.1) > 0.92) {
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(0, glitchY, w, 8 + (seed % 24));
  }
  ctx.restore();
}

function drawMetadata(ctx: CanvasRenderingContext2D, loop: Loop, w: number, h: number, layout: "story" | "square") {
  const pad = Math.round(w * 0.067);
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.font = `700 ${Math.round(w * 0.05)}px Inter, system-ui, -apple-system, Segoe UI, Arial`;
  const title = (loop.name || "ProducerHit").slice(0, 36);
  ctx.fillText(title, pad, layout === "square" ? Math.round(h * 0.1) : Math.round(h * 0.078));

  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.font = `500 ${Math.round(w * 0.029)}px Inter, system-ui, -apple-system, Segoe UI, Arial`;
  const sub = [loop.genre, loop.mood, loop.bpm && loop.bpm > 0 ? `${loop.bpm} BPM` : null].filter(Boolean).join(" · ");
  ctx.fillText(sub.slice(0, 48) || "dreamy · ProducerHit", pad, layout === "square" ? Math.round(h * 0.145) : Math.round(h * 0.103));
}

function drawAudioBars(ctx: CanvasRenderingContext2D, bars: Float32Array, w: number, h: number) {
  const pad = Math.round(w * 0.067);
  const barCount = bars.length;
  const areaW = w - pad * 2;
  const baseY = Math.round(h * 0.812);
  const maxH = Math.round(h * 0.104);
  const barW = Math.max(3, Math.floor(areaW / (barCount * 1.75)));
  const gap = Math.max(3, Math.floor(barW * 0.75));
  const totalW = barCount * barW + (barCount - 1) * gap;
  const startX = pad + Math.floor((areaW - totalW) / 2);

  for (let i = 0; i < barCount; i++) {
    const v = Math.max(0.04, Math.min(1, bars[i] ?? 0));
    const hh = Math.max(6, Math.floor(v * maxH));
    const x = startX + i * (barW + gap);
    const y = baseY - hh;
    const tt = i / (barCount - 1);
    const r = Math.round(236 + (6 - 236) * tt);
    const g = Math.round(72 + (182 - 72) * tt);
    const b = Math.round(153 + (212 - 153) * tt);
    ctx.fillStyle = `rgba(${r},${g},${b},0.92)`;
    ctx.fillRect(x, y, barW, hh);
  }
}

function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, text: string) {
  const pad = Math.round(w * 0.067);
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.font = `600 ${Math.round(w * 0.024)}px Inter, system-ui, -apple-system, Segoe UI, Arial`;
  ctx.fillText(text, pad, Math.round(h * 0.944));
}

export function renderVisualizerFrame(input: RenderFrameContext, dt = 1 / 30): void {
  const {
    ctx,
    width: w,
    height: h,
    timeSec: t,
    loop,
    coverBitmap,
    bars,
    preset,
    showMetadata = true,
    showWatermark = false,
    watermarkText = "made with ProducerHit",
    layout = "story",
    seed,
  } = input;

  if (preset === "void") {
    renderVoidFrame(input, t);
    return;
  }

  drawBackground(ctx, w, h, loop, t);
  const coverRect = layoutCoverRect(w, h, layout);

  if (preset === "particles") {
    const key = `${loop.id}:${w}x${h}`;
    let field = particleFields.get(key);
    if (!field) {
      field = new ParticleField(48, seed);
      field.reset(w, h);
      particleFields.set(key, field);
    }
    field.update(dt, w, h, bassEnergy(bars));
    field.draw(ctx, w, h, bassEnergy(bars));
  }

  drawCoverArt(ctx, loop, coverBitmap, coverRect, t, preset);

  if (preset === "vhs") drawVhsOverlay(ctx, w, h, t, seed);

  if (showMetadata) drawMetadata(ctx, loop, w, h, layout);
  drawAudioBars(ctx, bars, w, h);

  drawFilmGrain(ctx, w, h, seed, t, preset === "vhs" ? 0.14 : 0.08);

  if (showWatermark) drawWatermark(ctx, w, h, watermarkText);
}

export function resolveExportDuration(loop: Loop, requested?: number): number {
  const fromLoop = loop.details?.duration;
  const base = typeof fromLoop === "number" && fromLoop > 0 ? fromLoop : 15;
  const chosen = requested ?? base;
  return Math.min(30, Math.max(8, chosen));
}

export function canvasSizeForLayout(layout: "story" | "square"): { width: number; height: number } {
  if (layout === "square") return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
}
