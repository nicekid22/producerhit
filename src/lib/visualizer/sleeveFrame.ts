import type { Loop } from "@/types/loop";
import { hashString } from "@/lib/utils";
import { drawCdSleeveOverlay } from "@/lib/visualizer/cdSleeveOverlay";
import { resolveCoverRect, type ImageRect } from "@/lib/visualizer/imageRect";
import type { RenderFrameContext } from "@/lib/visualizer/types";

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
        ctx.fillStyle = n > 0.94 ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.22)";
        ctx.fillRect(x, y, step, step);
      }
    }
  }
  ctx.restore();
}

function drawSleeveAmbientBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  loop: Loop,
  coverBitmap: ImageBitmap | null,
  t: number,
  seed: number,
) {
  const hue = hashString(`${loop.id}:${loop.genre}:${loop.mood}`) % 360;

  ctx.fillStyle = "#050508";
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 6; i++) {
    const px = 0.5 + Math.sin(t * (0.11 + i * 0.015) + i * 1.9 + seed * 0.002) * 0.38;
    const py = 0.5 + Math.cos(t * (0.09 + i * 0.012) + i * 2.3) * 0.36;
    const radius = w * (0.28 + 0.1 * Math.sin(t * 0.17 + i));
    const orbHue = (hue + i * 52) % 360;
    const grad = ctx.createRadialGradient(px * w, py * h, 0, px * w, py * h, radius);
    grad.addColorStop(0, `hsla(${orbHue}, 78%, 58%, 0.42)`);
    grad.addColorStop(0.55, `hsla(${(orbHue + 24) % 360}, 70%, 42%, 0.16)`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  if (coverBitmap) {
    const iw = coverBitmap.width;
    const ih = coverBitmap.height;
    const baseScale = Math.max(w / iw, h / ih);
    const zoom = 1.12 + Math.sin(t * 0.14) * 0.07 + t * 0.004;
    const scale = baseScale * zoom;
    const panX = Math.sin(t * 0.16 + seed * 0.01) * w * 0.045;
    const panY = Math.cos(t * 0.12 + seed * 0.015) * h * 0.035;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (w - dw) / 2 + panX;
    const dy = (h - dh) / 2 + panY;

    ctx.save();
    ctx.filter = `blur(${Math.max(18, w * 0.035)}px) saturate(1.35) brightness(0.82)`;
    ctx.globalAlpha = 0.72;
    ctx.drawImage(coverBitmap, dx, dy, dw, dh);
    ctx.restore();
  }

  const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.08, w * 0.5, h * 0.5, w * 0.72);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(0.65, "rgba(0,0,0,0.22)");
  vig.addColorStop(1, "rgba(0,0,0,0.58)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

function drawGradientCoverFallback(ctx: CanvasRenderingContext2D, loop: Loop, rect: ImageRect) {
  const { x, y, width, height } = rect;
  const seed = hashString(`${loop.id}:${loop.genre}:${loop.mood}:${loop.bpm}`);
  const h1 = seed % 360;
  const h2 = (h1 + 35 + ((seed >>> 8) % 40)) % 360;
  const h3 = (h2 + 35 + ((seed >>> 16) % 40)) % 360;
  const grad = ctx.createLinearGradient(x, y, x + width, y + height);
  grad.addColorStop(0, `hsla(${h1}, 88%, 62%, 0.92)`);
  grad.addColorStop(0.42, `hsla(${h2}, 90%, 58%, 0.92)`);
  grad.addColorStop(1, `hsla(${h3}, 85%, 55%, 0.92)`);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, width, height);
}

export function drawCoverInRect(
  ctx: CanvasRenderingContext2D,
  loop: Loop,
  coverBitmap: ImageBitmap | null,
  rect: ImageRect,
  t: number,
  options?: { breathe?: number; shadow?: boolean },
) {
  const { x, y, width, height } = rect;
  const breathe = 1 + Math.sin(t * (options?.breathe ?? 0.35)) * 0.008;
  const short = Math.min(width, height);

  if (options?.shadow !== false) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = short * 0.09;
    ctx.shadowOffsetY = short * 0.028;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  }

  if (!coverBitmap) {
    drawGradientCoverFallback(ctx, loop, rect);
    return;
  }

  const sw = coverBitmap.width;
  const sh = coverBitmap.height;
  const scale = Math.max(width / sw, height / sh) * breathe;
  const dw = sw * scale;
  const dh = sh * scale;
  const cx = x + (width - dw) / 2;
  const cy = y + (height - dh) / 2;
  ctx.drawImage(coverBitmap, cx, cy, dw, dh);
}

function drawSleeveMetadata(
  ctx: CanvasRenderingContext2D,
  loop: Loop,
  w: number,
  coverBottom: number,
) {
  const title = (loop.name || "ProducerHit").slice(0, 40);
  const sub = [loop.genre, loop.mood, loop.bpm && loop.bpm > 0 ? `${loop.bpm} BPM` : null].filter(Boolean).join(" · ");
  const titleSize = Math.round(w * 0.034);
  const subSize = Math.round(w * 0.022);
  const yTitle = coverBottom + titleSize * 1.35;

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = `700 ${titleSize}px Inter, system-ui, -apple-system, Segoe UI, Arial`;
  ctx.fillText(title, w * 0.5, yTitle);

  if (sub) {
    ctx.fillStyle = "rgba(255,255,255,0.48)";
    ctx.font = `500 ${subSize}px Inter, system-ui, -apple-system, Segoe UI, Arial`;
    ctx.fillText(sub.slice(0, 48), w * 0.5, yTitle + titleSize * 1.15);
  }
  ctx.textAlign = "left";
}

let cdTextureBitmap: ImageBitmap | null | undefined;

export function primeCdSleeveTexture(bitmap: ImageBitmap | null) {
  cdTextureBitmap = bitmap;
}

export function renderSleeveFrame(input: RenderFrameContext, t: number): void {
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

  drawSleeveAmbientBackground(ctx, w, h, loop, coverBitmap, t, seed);

  const coverRect = resolveCoverRect(coverBitmap, w, h, layout);
  drawCoverInRect(ctx, loop, coverBitmap, coverRect, t);
  drawCdSleeveOverlay(ctx, coverRect, seed, t, cdTextureBitmap ?? null);

  drawFilmGrain(ctx, w, h, seed, t, 0.06);

  if (showMetadata) drawSleeveMetadata(ctx, loop, w, coverRect.y + coverRect.height);
  if (showWatermark) {
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.font = `500 ${Math.round(w * 0.02)}px Inter, system-ui, -apple-system, Segoe UI, Arial`;
    ctx.fillText(watermarkText, w * 0.93, h * 0.965);
    ctx.textAlign = "left";
  }
}
