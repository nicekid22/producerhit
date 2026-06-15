import type { Loop } from "@/types/loop";
import { hashString } from "@/lib/utils";
import { bassEnergy } from "@/lib/visualizer/frequencyBars";
import { drawCoverInRect } from "@/lib/visualizer/sleeveFrame";
import { fitImageRect, type ImageRect } from "@/lib/visualizer/imageRect";
import type { RenderFrameContext } from "@/lib/visualizer/types";

function pseudo(seed: number, x: number, y: number, t: number): number {
  return Math.abs(Math.sin(seed * 0.001 + x * 12.9898 + y * 78.233 + t * 4.141)) % 1;
}

/** Inner 4:3 camcorder frame inside the canvas. */
function vhsScreenRect(w: number, h: number, layout: "story" | "square"): ImageRect {
  if (layout === "square") {
    const screenW = w * 0.88;
    const screenH = screenW * 0.75;
    return { x: (w - screenW) / 2, y: (h - screenH) / 2 - h * 0.02, width: screenW, height: screenH };
  }
  const screenW = w * 0.92;
  const screenH = screenW * 0.75;
  return { x: (w - screenW) / 2, y: h * 0.16, width: screenW, height: screenH };
}

function resolveVhsCoverRect(coverBitmap: ImageBitmap | null, screen: ImageRect): ImageRect {
  const pad = Math.min(screen.width, screen.height) * 0.04;
  return fitImageRect(
    coverBitmap?.width ?? 1,
    coverBitmap?.height ?? 1,
    screen.width - pad * 2,
    screen.height - pad * 2,
    screen.x + screen.width / 2,
    screen.y + screen.height / 2,
  );
}

function drawVhsBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, w, h);
}

function drawVhsScreenBezel(ctx: CanvasRenderingContext2D, screen: ImageRect) {
  const { x, y, width, height } = screen;

  ctx.save();
  ctx.fillStyle = "#111";
  ctx.fillRect(x - 10, y - 10, width + 20, height + 20);

  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 6, y - 6, width + 12, height + 12);

  ctx.fillStyle = "#050505";
  ctx.fillRect(x, y, width, height);
  ctx.restore();
}

function drawVhsCoverWithAberration(
  ctx: CanvasRenderingContext2D,
  loop: Loop,
  coverBitmap: ImageBitmap | null,
  rect: ImageRect,
  t: number,
) {
  const wobble = Math.sin(t * 5.5) * 1.5;

  const drawLayer = (dx: number, dy: number, alpha: number, rgb?: [number, number, number]) => {
    const r = { ...rect, x: rect.x + dx + wobble, y: rect.y + dy };
    ctx.save();
    ctx.globalAlpha = alpha;
    drawCoverInRect(ctx, loop, coverBitmap, r, t, { shadow: false, breathe: 0.15 });
    if (rgb) {
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.14)`;
      ctx.fillRect(r.x, r.y, r.width, r.height);
    }
    ctx.restore();
  };

  drawLayer(-2.5, 0, 0.42, [255, 40, 120]);
  drawLayer(2.5, 0.5, 0.42, [40, 220, 255]);
  drawLayer(0, 0, 1);
}

function drawVhsScanlines(ctx: CanvasRenderingContext2D, screen: ImageRect, t: number) {
  const { x, y, width, height } = screen;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();

  for (let row = 0; row < height; row += 3) {
    ctx.fillStyle = row % 6 === 0 ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.018)";
    ctx.fillRect(x, y + row, width, 1);
  }

  const trackY = y + ((t * 42 + hashString(String(Math.floor(t * 10))) * 0.01) % 1) * height;
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(x, trackY, width, 6 + Math.sin(t * 12) * 2);

  if (Math.sin(t * 8.5) > 0.93) {
    const glitchY = y + pseudo(hashString("vhs"), 0, 1, t) * height * 0.8;
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(x, glitchY, width, 10);
  }
  ctx.restore();
}

function drawVhsHud(ctx: CanvasRenderingContext2D, w: number, h: number, screen: ImageRect, t: number, loop: Loop) {
  const fontSize = Math.max(10, Math.round(w * 0.026));
  const small = Math.max(8, Math.round(w * 0.02));
  const blink = Math.sin(t * 4.2) > 0 ? 1 : 0.35;
  const dateStr = "JAN 12 '98";

  ctx.save();
  ctx.font = `700 ${fontSize}px "Courier New", Courier, monospace`;
  ctx.fillStyle = `rgba(255,255,255,${0.82 * blink})`;
  ctx.fillText("● REC", screen.x + 12, screen.y + fontSize + 8);

  ctx.font = `600 ${small}px "Courier New", Courier, monospace`;
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.textAlign = "right";
  ctx.fillText(dateStr, screen.x + screen.width - 12, screen.y + small + 8);
  ctx.textAlign = "left";

  ctx.font = `600 ${small}px "Courier New", Courier, monospace`;
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("SP", screen.x + 12, screen.y + screen.height - 10);

  const title = (loop.name || "ProducerHit").slice(0, 28);
  ctx.textAlign = "right";
  ctx.fillText(title, screen.x + screen.width - 12, screen.y + screen.height - 10);
  ctx.textAlign = "left";
  ctx.restore();

  ctx.save();
  ctx.font = `600 ${Math.round(w * 0.024)}px "Courier New", Courier, monospace`;
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.textAlign = "center";
  ctx.fillText("▶ PLAY", w / 2, screen.y + screen.height + Math.round(h * 0.045));
  ctx.textAlign = "left";
  ctx.restore();
}

function drawVhsTapeDeck(ctx: CanvasRenderingContext2D, w: number, h: number, screen: ImageRect, t: number) {
  const deckY = screen.y + screen.height + Math.round(h * 0.07);
  const deckH = Math.max(28, h * 0.055);
  const deckW = screen.width * 0.72;
  const deckX = (w - deckW) / 2;

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(deckX, deckY, deckW, deckH);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.strokeRect(deckX, deckY, deckW, deckH);

  const reelR = deckH * 0.32;
  const leftCx = deckX + deckW * 0.22;
  const rightCx = deckX + deckW * 0.78;
  const cy = deckY + deckH / 2;

  for (const cx of [leftCx, rightCx]) {
    ctx.beginPath();
    ctx.arc(cx, cy, reelR, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, reelR * 0.35, t * (cx < w / 2 ? 2.4 : -2.1), t * (cx < w / 2 ? 2.4 : -2.1) + Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawVhsAudioMeter(ctx: CanvasRenderingContext2D, bars: Float32Array, screen: ImageRect) {
  const bass = bassEnergy(bars);
  const { x, y, width, height } = screen;
  const meterW = width * 0.18;
  const meterH = 6;
  const mx = x + width - meterW - 10;
  const my = y + height - 18;

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(mx, my, meterW, meterH);
  ctx.fillStyle = bass > 0.5 ? "rgba(255,80,80,0.85)" : "rgba(255,255,255,0.55)";
  ctx.fillRect(mx, my, meterW * Math.min(1, 0.2 + bass * 0.8), meterH);
}

function drawVhsGrain(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, t: number) {
  const step = Math.max(3, Math.floor(w / 160));
  ctx.save();
  ctx.globalAlpha = 0.12;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (pseudo(seed, x, y, t) > 0.8) {
        ctx.fillStyle = pseudo(seed, x, y, t + 1) > 0.9 ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)";
        ctx.fillRect(x, y, step, step);
      }
    }
  }
  ctx.restore();
}

export function renderVhsFrame(input: RenderFrameContext, t: number): void {
  const {
    ctx,
    width: w,
    height: h,
    loop,
    coverBitmap,
    bars,
    showWatermark = false,
    watermarkText = "made with ProducerHit",
    layout = "story",
    seed,
  } = input;

  drawVhsBackground(ctx, w, h);
  const screen = vhsScreenRect(w, h, layout);
  drawVhsScreenBezel(ctx, screen);

  const coverRect = resolveVhsCoverRect(coverBitmap, screen);
  drawVhsCoverWithAberration(ctx, loop, coverBitmap, coverRect, t);
  drawVhsScanlines(ctx, screen, t);
  drawVhsAudioMeter(ctx, bars, screen);
  drawVhsHud(ctx, w, h, screen, t, loop);
  drawVhsTapeDeck(ctx, w, h, screen, t);
  drawVhsGrain(ctx, w, h, seed, t);

  if (showWatermark) {
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.font = `500 ${Math.round(w * 0.02)}px "Courier New", Courier, monospace`;
    ctx.fillText(watermarkText, Math.round(w * 0.067), h * 0.965);
  }
}
