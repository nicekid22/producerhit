import type { Loop } from "@/types/loop";
import { needsLoopCardCover } from "@/lib/coverArt";
import { LOOP_COVER_BACKFILL_ENABLED } from "@/lib/featureFlags";
import { persistPollinationsCardCoverForLoop } from "@/lib/pollinationsCardCoverPersist";
import { useLoopsStore } from "@/stores/loopsStore";

const MAX_PER_SESSION = 12;
const CONCURRENCY = 2;
const GAP_MS = 1200;

let sessionCount = 0;
const queued = new Set<string>();
let active = 0;
const waiters: Array<() => void> = [];

function pump() {
  while (active < CONCURRENCY && waiters.length) {
    active += 1;
    const next = waiters.shift();
    next?.();
  }
}

function scheduleTask(fn: () => Promise<void>) {
  return new Promise<void>((resolve) => {
    waiters.push(() => {
      void fn().finally(() => {
        active -= 1;
        resolve();
        pump();
      });
    });
    pump();
  });
}

function applyCoverToLoop(loopId: string, coverUrl: string) {
  useLoopsStore.getState().applyLoopCoverUrl(loopId, coverUrl, "image");
}

async function backfillOne(loop: Loop): Promise<void> {
  const result = await persistPollinationsCardCoverForLoop(loop.id, { ...loop, stemsUrl: loop.stemsUrl });
  if (result.coverUrl?.startsWith("http")) {
    applyCoverToLoop(loop.id, result.coverUrl);
  }
}

const REPAIR_MAX_PER_SESSION = 4;

/**
 * Répare les covers manquantes après F5 (DB vide) — limité pour ne pas spam Pollinations.
 */
export function scheduleMissingCoverRepair(loops: Loop[]): void {
  const candidates = loops.filter((l) => {
    if (l.id.startsWith("local-") || l.id.startsWith("preview-")) return false;
    if (queued.has(l.id)) return false;
    return needsLoopCardCover(l);
  });

  let repaired = 0;
  for (const loop of candidates) {
    if (repaired >= REPAIR_MAX_PER_SESSION || sessionCount >= MAX_PER_SESSION) break;
    queued.add(loop.id);
    sessionCount += 1;
    repaired += 1;

    void scheduleTask(async () => {
      await new Promise((r) => setTimeout(r, GAP_MS));
      try {
        await backfillOne(loop);
      } finally {
        queued.delete(loop.id);
      }
    });
  }
}

/** Backfill massif opt-in (VITE_LOOP_COVER_BACKFILL=1). */
export function scheduleLoopCoverBackfill(loops: Loop[]): void {
  if (!LOOP_COVER_BACKFILL_ENABLED) return;
  scheduleMissingCoverRepair(loops);
}
