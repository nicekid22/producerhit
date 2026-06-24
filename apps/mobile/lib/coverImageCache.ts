import { Image } from "react-native";
import type { Loop } from "@producerhit/shared";
import { resolveLoopCoverUrl } from "@/lib/loopDisplay";

const prefetched = new Set<string>();
const loaded = new Set<string>();

export function isCoverLoaded(uri: string | null | undefined): boolean {
  const trimmed = uri?.trim();
  return trimmed ? loaded.has(trimmed) : false;
}

export function markCoverLoaded(uri: string | null | undefined): void {
  const trimmed = uri?.trim();
  if (trimmed) loaded.add(trimmed);
}

export function prefetchCoverUri(uri: string | null | undefined): void {
  const trimmed = uri?.trim();
  if (!trimmed || prefetched.has(trimmed)) return;
  prefetched.add(trimmed);
  void Image.prefetch(trimmed);
}

export function prefetchLoopCovers(loops: readonly Pick<Loop, "coverUrl" | "stemsUrl">[], limit = 8): void {
  for (const loop of loops.slice(0, limit)) {
    prefetchCoverUri(resolveLoopCoverUrl(loop));
  }
}
