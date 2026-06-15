export type ImageRect = { x: number; y: number; width: number; height: number };

/** Fit image inside max bounds, preserve aspect ratio, centered on anchor. */
export function fitImageRect(
  imageW: number,
  imageH: number,
  maxW: number,
  maxH: number,
  centerX: number,
  centerY: number,
): ImageRect {
  if (imageW <= 0 || imageH <= 0) {
    const side = Math.min(maxW, maxH);
    return { x: centerX - side / 2, y: centerY - side / 2, width: side, height: side };
  }

  const aspect = imageW / imageH;
  let width = maxW;
  let height = width / aspect;
  if (height > maxH) {
    height = maxH;
    width = height * aspect;
  }

  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  };
}

export function sleeveCoverBounds(w: number, h: number, layout: "story" | "square") {
  if (layout === "square") {
    return { maxW: w * 0.72, maxH: h * 0.58, centerX: w / 2, centerY: h * 0.46 };
  }
  return { maxW: w * 0.78, maxH: h * 0.42, centerX: w / 2, centerY: h * 0.44 };
}

export function resolveCoverRect(
  coverBitmap: ImageBitmap | null,
  w: number,
  h: number,
  layout: "story" | "square",
): ImageRect {
  const bounds = sleeveCoverBounds(w, h, layout);
  const iw = coverBitmap?.width ?? 1;
  const ih = coverBitmap?.height ?? 1;
  return fitImageRect(iw, ih, bounds.maxW, bounds.maxH, bounds.centerX, bounds.centerY);
}
