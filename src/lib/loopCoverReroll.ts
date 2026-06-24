import { buildCoverGenerationSeed, buildLoopCardCoverPrompt } from "@producerhit/shared";
import type { PollinationsCardCoverResult } from "@/lib/pollinationsCardCoverPersist";
import { generatePollinationsCoverForLoop } from "@/lib/pollinationsCoverPersist";
import type { Loop } from "@/types/loop";
import { coverImageSeed } from "@/lib/utils";

/** Coût aligné sur fetch-mood-image — 1 crédit génération / nouvelle cover. */
export const LOOP_COVER_REROLL_CREDIT_COST = 1;

export function newCoverRerollIdempotencyKey(loopId: string): string {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${loopId}:${suffix}`;
}

/** Nouvelle cover Pollinations — 1 crédit. */
export async function rerollLoopCover(
  loop: Pick<Loop, "id" | "genre" | "mood" | "name" | "prompt" | "seed" | "influence" | "stemsUrl" | "userId">,
): Promise<PollinationsCardCoverResult> {
  const attemptSeed = Date.now() ^ coverImageSeed(loop as Loop);
  const prompt = buildLoopCardCoverPrompt(loop, { seed: attemptSeed });
  const seed = buildCoverGenerationSeed(prompt, loop.id, coverImageSeed(loop as Loop), attemptSeed);

  const result = await generatePollinationsCoverForLoop({
    loop,
    prompt,
    seed,
  });

  if (!result.coverUrl) return { coverUrl: null };
  return { coverUrl: result.coverUrl, coverKind: "image", source: "pollinations" };
}
