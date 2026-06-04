import type { Loop } from "@/types/loop";
import { resolveLoopDisplayCoverUrl } from "@/lib/coverArt";

const LOAD_TIMEOUT_MS = 45_000;
const MAX_RETRIES = 4;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function bitmapFromBlob(blob: Blob): Promise<ImageBitmap | null> {
  if (!blob.type.startsWith("image/")) return null;
  try {
    return await createImageBitmap(blob);
  } catch {
    return null;
  }
}

async function loadViaFetch(url: string, timeoutMs: number): Promise<ImageBitmap | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      mode: "cors",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return bitmapFromBlob(blob);
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

function loadViaImageElement(url: string, timeoutMs: number): Promise<ImageBitmap | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    let settled = false;

    const finish = (bitmap: ImageBitmap | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(bitmap);
    };

    const timer = window.setTimeout(() => finish(null), timeoutMs);

    img.onload = () => {
      void createImageBitmap(img)
        .then((bitmap) => finish(bitmap))
        .catch(() => finish(null));
    };
    img.onerror = () => finish(null);
    img.src = url;
  });
}

async function loadOnce(url: string, timeoutMs: number): Promise<ImageBitmap | null> {
  const viaFetch = await loadViaFetch(url, timeoutMs);
  if (viaFetch) return viaFetch;
  return loadViaImageElement(url, timeoutMs);
}

/** Loads Pollinations (or persisted) cover for canvas — retries + no-referrer like LoopCardItem. */
export async function loadCoverBitmap(loop: Loop, size = 1024): Promise<ImageBitmap | null> {
  const url = resolveLoopDisplayCoverUrl(loop, size);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) await wait(800 * attempt);
    const bitmap = await loadOnce(url, LOAD_TIMEOUT_MS);
    if (bitmap) return bitmap;
  }

  return null;
}
