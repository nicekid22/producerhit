import type { Loop } from "@/types/loop";
import { isPersistedStorageCoverUrl, needsPinterestCover } from "@/lib/coverArt";
import { PINTEREST_PERSIST_COVERS } from "@/lib/featureFlags";
import { rememberPinterestCoverUrl } from "@/lib/pinterestCoverDedup";
import {
  persistPinterestCoverForLoop,
  type PinterestCoverPersistResult,
} from "@/lib/pinterestCoverPersist";

const DEFAULT_ASSIGN_TIMEOUT_MS = 28_000;

const inFlight = new Map<string, Promise<PinterestCoverPersistResult | null>>();

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
  stemsUrl: unknown,
): Promise<PinterestCoverPersistResult | null> {
  if (!PINTEREST_PERSIST_COVERS) return null;

  if (hasFinalLoopCover(loop)) {
    const url = loop.details!.coverUrl!.trim();
    rememberPinterestCoverUrl(url);
    return { coverUrl: url, coverKind: "image", skipped: true, source: "storage" };
  }

  if (!needsPinterestCover(loop as Loop) && !loop.details?.coverUrl?.includes("pinimg.com")) {
    const existing = loop.details?.coverUrl?.trim();
    if (existing?.startsWith("http")) {
      return { coverUrl: existing, coverKind: "image", skipped: true };
    }
    return null;
  }

  const pin = await persistPinterestCoverForLoop(loopId, { ...loop, stemsUrl });
  if (pin.coverUrl?.startsWith("http")) {
    rememberPinterestCoverUrl(pin.coverUrl);
    return pin;
  }

  return null;
}

export type AssignLoopCoverOptions = {
  stemsUrl?: unknown;
  timeoutMs?: number;
  onLateCover?: (result: PinterestCoverPersistResult) => void;
};

/**
 * Une seule assignation Pinterest/Storage par loop (dédup in-flight + DB).
 */
export async function assignLoopCoverOnce(
  loopId: string,
  loop: Pick<
    Loop,
    "id" | "genre" | "mood" | "name" | "prompt" | "seed" | "influence" | "details"
  > & { stemsUrl?: unknown },
  options?: AssignLoopCoverOptions,
): Promise<PinterestCoverPersistResult | null> {
  const stemsUrl = options?.stemsUrl ?? loop.stemsUrl;
  let work = inFlight.get(loopId);
  if (!work) {
    work = runAssign(loopId, loop, stemsUrl).finally(() => {
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
