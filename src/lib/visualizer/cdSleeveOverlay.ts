/** Procedural CD jewel-case wear + optional PNG overlay (`/img/overlays/cd-sleeve-wear.png`). */

import type { ImageRect } from "@/lib/visualizer/imageRect";

const CD_TEXTURE_SRC = "/img/overlays/cd-sleeve-wear.png";

let cdTexturePromise: Promise<ImageBitmap | null> | null = null;

export function loadCdSleeveTexture(): Promise<ImageBitmap | null> {
  if (!cdTexturePromise) {
    cdTexturePromise = fetch(CD_TEXTURE_SRC)
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => (b ? createImageBitmap(b) : null))
      .catch(() => null);
  }
  return cdTexturePromise;
}

function pseudo(seed: number, x: number, y: number, t: number): number {
  return Math.abs(Math.sin(seed * 0.001 + x * 12.9898 + y * 78.233 + t * 4.141)) % 1;
}

function drawEdgeWear(
  ctx: CanvasRenderingContext2D,
  rect: ImageRect,
  seed: number,
  t: number,
) {
  const { x, y, width, height } = rect;
  const short = Math.min(width, height);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();

  for (let i = 0; i < 32; i++) {
    const edge = i % 4;
    const n = pseudo(seed, i, 0, t * 0.05);
    if (n < 0.38) continue;

    const alongW = pseudo(seed, i, 1, 0) * width;
    const alongH = pseudo(seed, i, 1, 0) * height;
    const depth = 4 + pseudo(seed, i, 2, 0) * Math.min(18, short * 0.06);
    const alpha = 0.04 + pseudo(seed, i, 3, t) * 0.12;

    let x1 = x;
    let y1 = y;
    let x2 = x;
    let y2 = y;

    if (edge === 0) {
      x1 = x + alongW;
      y1 = y;
      x2 = x1 + (pseudo(seed, i, 4, 0) - 0.5) * short * 0.08;
      y2 = y + depth;
    } else if (edge === 1) {
      x1 = x + width;
      y1 = y + alongH;
      x2 = x + width - depth;
      y2 = y1 + (pseudo(seed, i, 4, 0) - 0.5) * short * 0.08;
    } else if (edge === 2) {
      x1 = x + alongW;
      y1 = y + height;
      x2 = x1 + (pseudo(seed, i, 4, 0) - 0.5) * short * 0.08;
      y2 = y + height - depth;
    } else {
      x1 = x;
      y1 = y + alongH;
      x2 = x + depth;
      y2 = y1 + (pseudo(seed, i, 4, 0) - 0.5) * short * 0.08;
    }

    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 0.4 + pseudo(seed, i, 5, 0) * 1.1;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  const corners = [
    [x + 2, y + 2],
    [x + width - 2, y + 2],
    [x + 2, y + height - 2],
    [x + width - 2, y + height - 2],
  ];
  for (let c = 0; c < corners.length; c++) {
    const [cx, cy] = corners[c]!;
    const r = short * (0.06 + pseudo(seed, c, 6, 0) * 0.04);
    const corner = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    corner.addColorStop(0, "rgba(255,255,255,0.14)");
    corner.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = corner;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawPlasticGlare(ctx: CanvasRenderingContext2D, rect: ImageRect, t: number) {
  const { x, y, width, height } = rect;
  const short = Math.min(width, height);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();

  const sweep = ((t * 0.22) % 1) * (width * 1.8) - width * 0.4;
  const glare = ctx.createLinearGradient(x + sweep, y, x + sweep + short * 0.55, y + height);
  glare.addColorStop(0, "rgba(255,255,255,0)");
  glare.addColorStop(0.42, "rgba(255,255,255,0.16)");
  glare.addColorStop(0.52, "rgba(255,255,255,0.06)");
  glare.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glare;
  ctx.fillRect(x, y, width, height);

  const diag = ctx.createLinearGradient(x, y, x + width, y + height);
  diag.addColorStop(0, "rgba(255,255,255,0.1)");
  diag.addColorStop(0.18, "rgba(255,255,255,0)");
  diag.addColorStop(0.82, "rgba(255,255,255,0)");
  diag.addColorStop(1, "rgba(255,255,255,0.05)");
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = diag;
  ctx.fillRect(x, y, width, height);
  ctx.restore();
}

function drawJewelCaseFrame(ctx: CanvasRenderingContext2D, rect: ImageRect) {
  const { x, y, width, height } = rect;
  const short = Math.min(width, height);
  const inset = Math.max(1, short * 0.004);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = Math.max(1, short * 0.005);
  ctx.strokeRect(x + inset, y + inset, width - inset * 2, height - inset * 2);

  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(x, y, Math.max(2, short * 0.011), height);

  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(x + width - Math.max(1, short * 0.004), y, Math.max(1, short * 0.004), height);
  ctx.restore();
}

export function drawCdSleeveOverlay(
  ctx: CanvasRenderingContext2D,
  rect: ImageRect,
  seed: number,
  t: number,
  texture: ImageBitmap | null,
) {
  const { x, y, width, height } = rect;

  drawJewelCaseFrame(ctx, rect);
  drawPlasticGlare(ctx, rect, t);
  drawEdgeWear(ctx, rect, seed, t);

  if (texture) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.42;
    ctx.drawImage(texture, x, y, width, height);
    ctx.restore();
  }
}
