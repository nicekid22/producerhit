import { buildCoverGenerationSeed as buildCoverGenerationSeedShared, withCoverCacheBust } from "@producerhit/shared";
import { coverImageSeed } from "@/lib/utils";
import type { Loop } from "@/types/loop";

export { withCoverCacheBust };

export function buildCoverGenerationSeed(
  prompt: string,
  loop: Pick<Loop, "id" | "seed">,
  attempt: number,
): number {
  return buildCoverGenerationSeedShared(prompt, loop.id, loop.seed, attempt);
}

export function buildCoverGenerationSeedFromLoop(prompt: string, loop: Loop, attempt: number): number {
  return buildCoverGenerationSeed(prompt, loop, attempt);
}

// Re-export for tests comparing with coverImageSeed
export { coverImageSeed };
