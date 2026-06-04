import type { Loop } from "@/types/loop";
import { needsPinimgStorageUpgrade, needsPinterestCover } from "@/lib/coverArt";
import { PINTEREST_BACKFILL_ENABLED, PINTEREST_PERSIST_COVERS } from "@/lib/featureFlags";
import { persistPinterestCoverForLoop } from "@/lib/pinterestCoverPersist";
import { seedPinterestDedupFromLoops } from "@/lib/pinterestCoverDedup";
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
  const pin = await persistPinterestCoverForLoop(loop.id, { ...loop, stemsUrl: loop.stemsUrl });
  if (pin.coverUrl?.startsWith("http")) {
    applyCoverToLoop(loop.id, pin.coverUrl);
  }
}

const REPAIR_MAX_PER_SESSION = 4;

/**
 * Répare les covers manquantes après F5 (DB vide) — limité pour ne pas spam Pinterest.
 * Actif sans VITE_PINTEREST_BACKFILL (contrairement au backfill massif).
 */
export function scheduleMissingCoverRepair(loops: Loop[]): void {
  if (!PINTEREST_PERSIST_COVERS) return;

  seedPinterestDedupFromLoops(loops);

  const candidates = loops.filter((l) => {
    if (l.id.startsWith("local-") || l.id.startsWith("preview-")) return false;
    if (queued.has(l.id)) return false;
    return needsPinterestCover(l);
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

/**
 * Remplace les covers manquantes / Pollinations par une image Pinterest → Storage.
 * Appelé après chargement du workspace (anciens + nouveaux morceaux).
 */
export function schedulePinterestCoverBackfill(loops: Loop[]): void {
  if (!PINTEREST_PERSIST_COVERS || !PINTEREST_BACKFILL_ENABLED) return;

  seedPinterestDedupFromLoops(loops);

  const candidates = loops.filter((l) => {
    if (l.id.startsWith("local-") || l.id.startsWith("preview-")) return false;
    if (queued.has(l.id)) return false;
    return needsPinterestCover(l) || needsPinimgStorageUpgrade(l);
  });

  for (const loop of candidates) {
    if (sessionCount >= MAX_PER_SESSION) break;
    queued.add(loop.id);
    sessionCount += 1;

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

