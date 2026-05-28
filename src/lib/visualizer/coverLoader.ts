import type { Loop } from "@/types/loop";
import { coverImageUrl } from "@/lib/utils";

const LOAD_TIMEOUT_MS = 45_000;

/** Loads Pollinations cover art for canvas export — external API, may take 10–30s on cold start. */
export async function loadCoverBitmap(loop: Loop, size = 1024): Promise<ImageBitmap | null> {
  const url = coverImageUrl(loop, size);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    let settled = false;

    const finish = (bitmap: ImageBitmap | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(bitmap);
    };

    const timer = window.setTimeout(() => finish(null), LOAD_TIMEOUT_MS);

    img.onload = () => {
      void createImageBitmap(img)
        .then((bitmap) => finish(bitmap))
        .catch(() => finish(null));
    };
    img.onerror = () => finish(null);
    img.src = url;
  });
}
