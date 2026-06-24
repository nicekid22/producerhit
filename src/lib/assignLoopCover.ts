import type { Loop } from "@/types/loop";
import { isPersistedStorageCoverUrl, needsLoopCardCover } from "@/lib/coverArt";
import {
  persistPollinationsCardCoverForLoop,
  type PollinationsCardCoverResult,
} from "@/lib/pollinationsCardCoverPersist";

const DEFAULT_ASSIGN_TIMEOUT_MS = 28_000;

const inFlight = new Map<string, Promise<PollinationsCardCoverResult | null>>();

export type LoopCoverPersistResult = PollinationsCardCoverResult;

export function hasFinalLoopCover(loop: Pick<Loop, "details">): boolean {
  const url = loop.details?.coverUrl?.trim() ?? "";
  return isPersistedStorageCoverUrl(url);
}

async function runAssign(
  loopId: string,
  loop: Pick<
    Loop,
    "id" | "genre" | "mood" | "name" | "prompt" | "seed" | "influence" | "details"
  > & { stemsUrl?: unknown },
): Promise<PollinationsCardCoverResult | null> {
  if (hasFinalLoopCover(loop)) {
    const url = loop.details!.coverUrl!.trim();
    return { coverUrl: url, coverKind: "image", skipped: true, source: "storage" };
  }

  if (!needsLoopCardCover(loop as Loop)) {
    const existing = loop.details?.coverUrl?.trim();
    if (existing?.startsWith("http")) {
      return { coverUrl: existing, coverKind: "image", skipped: true };
    }
    return null;
  }

  return persistPollinationsCardCoverForLoop(loopId, { ...loop, stemsUrl: loop.stemsUrl });
}

export type AssignLoopCoverOptions = {
  stemsUrl?: unknown;
  timeoutMs?: number;
  onLateCover?: (result: LoopCoverPersistResult) => void;
};

/** Une seule assignation cover Pollinations par loop. */
export async function assignLoopCoverOnce(
  loopId: string,
  loop: Pick<
    Loop,
    "id" | "genre" | "mood" | "name" | "prompt" | "seed" | "influence" | "details"
  > & { stemsUrl?: unknown },
  options?: AssignLoopCoverOptions,
): Promise<LoopCoverPersistResult | null> {
  let work = inFlight.get(loopId);
  if (!work) {
    work = runAssign(loopId, loop).finally(() => {
      if (inFlight.get(loopId) === work) inFlight.delete(loopId);
    });
    inFlight.set(loopId, work);
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_ASSIGN_TIMEOUT_MS;
  let timedOut = false;
  const raced = await Promise.race([
    work,
    new Promise<null>((resolve) => {
      setTimeout(() => {
        timedOut = true;
        resolve(null);
      }, timeoutMs);
    }),
  ]);

  if (timedOut && options?.onLateCover) {
    void work.then((late) => {
      if (late?.coverUrl?.startsWith("http")) options.onLateCover!(late);
    });
  }

  return raced;
}
