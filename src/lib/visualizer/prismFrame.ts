import type { Loop } from "@/types/loop";
import { hashString } from "@/lib/utils";
import { bassEnergy } from "@/lib/visualizer/frequencyBars";
import { drawCoverInRect } from "@/lib/visualizer/sleeveFrame";
import { fitImageRect, type ImageRect } from "@/lib/visualizer/imageRect";
import type { RenderFrameContext } from "@/lib/visualizer/types";

function pseudo(seed: number, x: number, y: number, t: number): number {
  return Math.abs(Math.sin(seed * 0.001 + x * 12.9898 + y * 78.233 + t * 4.141)) % 1;
}

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

function prismCoverBounds(w: number, h: number, layout: "story" | "square") {
  if (layout === "square") {
    return { maxW: w * 0.68, maxH: h * 0.52, centerX: w / 2, centerY: h * 0.44 };
  }
  return { maxW: w * 0.82, maxH: h * 0.38, centerX: w / 2, centerY: h * 0.4 };
}

function resolvePrismCoverRect(coverBitmap: ImageBitmap | null, w: number, h: number, layout: "story" | "square"): ImageRect {
  const bounds = prismCoverBounds(w, h, layout);
  return fitImageRect(coverBitmap?.width ?? 1, coverBitmap?.height ?? 1, bounds.maxW, bounds.maxH, bounds.centerX, bounds.centerY);
}

function drawPrismMesh(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, seed: number) {
  ctx.fillStyle = "#04060c";
  ctx.fillRect(0, 0, w, h);

  const hue = hashString(String(seed)) % 360;
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.38, 0, w * 0.5, h * 0.38, w * 0.65);
  glow.addColorStop(0, `hsla(${hue}, 70%, 52%, 0.18)`);
  glow.addColorStop(0.55, `hsla(${(hue + 60) % 360}, 65%, 40%, 0.08)`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const spacing = Math.max(28, w * 0.055);
  const drift = t * 18;
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "rgba(103,195,255,0.35)";
  ctx.lineWidth = 1;
  for (let x = -spacing; x < w + spacing; x += spacing) {
    const offset = Math.sin((x + drift) * 0.012 + t * 0.4) * 8;
    ctx.beginPath();
    ctx.moveTo(x + offset, 0);
    ctx.lineTo(x - offset * 0.6, h);
    ctx.stroke();
  }
  for (let y = -spacing; y < h + spacing; y += spacing) {
    const offset = Math.cos((y + drift) * 0.01 + t * 0.35) * 6;
    ctx.strokeStyle = "rgba(157,124,255,0.28)";
    ctx.beginPath();
    ctx.moveTo(0, y + offset);
    ctx.lineTo(w, y - offset * 0.5);
    ctx.stroke();
  }
  ctx.restore();

  const pulse = 0.5 + 0.5 * Math.sin(t * 1.6);
  const orb = ctx.createRadialGradient(w * 0.78, h * 0.18, 0, w * 0.78, h * 0.18, w * 0.28);
  orb.addColorStop(0, `rgba(103,195,255,${0.12 + pulse * 0.08})`);
  orb.addColorStop(1, "rgba(103,195,255,0)");
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, w, h);
}

function drawPrismCoverFrame(ctx: CanvasRenderingContext2D, rect: ImageRect, t: number) {
  const { x, y, width, height } = rect;
  const short = Math.min(width, height);
  const radius = Math.max(4, short * 0.028);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.1);

  ctx.save();
  drawRoundedRect(ctx, x - 3, y - 3, width + 6, height + 6, radius + 3);
  ctx.strokeStyle = `rgba(103,195,255,${0.28 + pulse * 0.18})`;
  ctx.lineWidth = Math.max(1.5, short * 0.006);
  ctx.shadowColor = "rgba(157,124,255,0.55)";
  ctx.shadowBlur = short * 0.08;
  ctx.stroke();
  ctx.restore();

  const sheenX = (t * 380) % (width + short * 1.2) - short * 0.6;
  ctx.save();
  drawRoundedRect(ctx, x, y, width, height, radius);
  ctx.clip();
  const sheen = ctx.createLinearGradient(x + sheenX, y, x + sheenX + short * 0.7, y + height);
  sheen.addColorStop(0, "rgba(255,255,255,0)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0.14)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, width, height);
  ctx.restore();
}

function drawPrismCover(
  ctx: CanvasRenderingContext2D,
  loop: Loop,
  coverBitmap: ImageBitmap | null,
  rect: ImageRect,
  t: number,
) {
  const { x, y, width, height } = rect;
  const short = Math.min(width, height);
  const radius = Math.max(4, short * 0.028);

  ctx.save();
  drawRoundedRect(ctx, x, y, width, height, radius);
  ctx.clip();
  drawCoverInRect(ctx, loop, coverBitmap, rect, t, { shadow: false, breathe: 0.28 });
  ctx.restore();

  drawPrismCoverFrame(ctx, rect, t);
}

function drawPrismMetadata(ctx: CanvasRenderingContext2D, loop: Loop, w: number, h: number, layout: "story" | "square") {
  const pad = Math.round(w * 0.067);
  const title = (loop.name || "ProducerHit").slice(0, 36);
  const sub = [loop.genre, loop.mood, loop.bpm && loop.bpm > 0 ? `${loop.bpm} BPM` : null].filter(Boolean).join(" · ");

  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.font = `700 ${Math.round(w * 0.046)}px Inter, system-ui, sans-serif`;
  ctx.fillText(title, pad, layout === "square" ? h * 0.1 : h * 0.072);

  ctx.fillStyle = "rgba(103,195,255,0.72)";
  ctx.font = `500 ${Math.round(w * 0.027)}px Inter, system-ui, sans-serif`;
  ctx.fillText(sub.slice(0, 48) || "ProducerHit", pad, layout === "square" ? h * 0.138 : h * 0.098);
}

function drawPrismWaveform(ctx: CanvasRenderingContext2D, bars: Float32Array, w: number, h: number, t: number) {
  const pad = Math.round(w * 0.08);
  const baseY = h * 0.86;
  const maxH = h * 0.055;
  const barCount = bars.length;
  const areaW = w - pad * 2;
  const barW = Math.max(2, Math.floor(areaW / (barCount * 2)));
  const gap = Math.max(2, Math.floor(barW * 0.9));
  const totalW = barCount * barW + (barCount - 1) * gap;
  const startX = pad + (areaW - totalW) / 2;
  const bass = bassEnergy(bars);

  for (let i = 0; i < barCount; i++) {
    const v = Math.max(0.05, Math.min(1, bars[i] ?? 0));
    const hh = Math.max(4, v * maxH);
    const x = startX + i * (barW + gap);
    const y = baseY - hh;
    const tt = i / Math.max(1, barCount - 1);
    const r = Math.round(103 + (157 - 103) * tt);
    const g = Math.round(195 + (124 - 195) * tt);
    const b = Math.round(255 + (255 - 255) * tt);
    ctx.fillStyle = `rgba(${r},${g},${b},${0.55 + bass * 0.35})`;
    ctx.fillRect(x, y, barW, hh);
  }

  ctx.strokeStyle = `rgba(103,195,255,${0.15 + Math.sin(t * 3) * 0.05})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, baseY + 8);
  ctx.lineTo(w - pad, baseY + 8);
  ctx.stroke();
}

function drawPrismGrain(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, t: number) {
  const step = Math.max(3, Math.floor(w / 200));
  ctx.save();
  ctx.globalAlpha = 0.05;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (pseudo(seed, x, y, t) > 0.84) {
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(x, y, step, step);
      }
    }
  }
  ctx.restore();
}

export function renderPrismFrame(input: RenderFrameContext, t: number): void {
  const {
    ctx,
    width: w,
    height: h,
    loop,
    coverBitmap,
    bars,
    showMetadata = true,
    showWatermark = false,
    watermarkText = "made with ProducerHit",
    layout = "story",
    seed,
  } = input;

  drawPrismMesh(ctx, w, h, t, seed);
  const coverRect = resolvePrismCoverRect(coverBitmap, w, h, layout);
  drawPrismCover(ctx, loop, coverBitmap, coverRect, t);

  if (showMetadata) drawPrismMetadata(ctx, loop, w, h, layout);
  drawPrismWaveform(ctx, bars, w, h, t);
  drawPrismGrain(ctx, w, h, seed, t);

  if (showWatermark) {
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.font = `600 ${Math.round(w * 0.022)}px Inter, system-ui, sans-serif`;
    ctx.fillText(watermarkText, Math.round(w * 0.067), h * 0.955);
  }
}
