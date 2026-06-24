import type { Loop } from "@producerhit/shared";
import {
  buildCoverGenerationSeed,
  buildLoopCardCoverPrompt,
} from "@producerhit/shared";
import { invokeSupabaseFunction } from "./edgeInvoke";
import { supabase } from "./supabase";

const inFlight = new Map<string, Promise<string | null>>();

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hasCover(loop: Pick<Loop, "coverUrl" | "stemsUrl">): boolean {
  const col = loop.coverUrl?.trim() ?? "";
  if (col.startsWith("http")) return true;
  const stems = loop.stemsUrl;
  if (stems && typeof stems === "object") {
    const ace = (stems as Record<string, unknown>).ace;
    if (ace && typeof ace === "object") {
      const url = (ace as Record<string, unknown>).coverUrl;
      if (typeof url === "string" && url.startsWith("http")) return true;
    }
  }
  return false;
}

async function persistPollinationsViaEdge(loop: Loop): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const prompt = buildLoopCardCoverPrompt(loop);
  const seed = buildCoverGenerationSeed(prompt, loop.id, hashString(loop.id), 0);

  const { data, errorText } = await invokeSupabaseFunction<{
    coverUrl?: string;
    error?: string;
    skipped?: boolean;
  }>({
    name: "persist-pollinations-cover",
    body: { loopId: loop.id, prompt, seed, purpose: "card" },
    accessToken: session.access_token,
  });

  if (errorText) return null;
  const coverUrl = typeof data?.coverUrl === "string" ? data.coverUrl.trim() : "";
  return coverUrl.startsWith("http") ? coverUrl : null;
}

/** Cover carte → Storage Pollinations. */
export async function assignLoopCoverOnce(loop: Loop): Promise<string | null> {
  if (hasCover(loop)) {
    return loop.coverUrl?.trim() || null;
  }

  let work = inFlight.get(loop.id);
  if (!work) {
    work = persistPollinationsViaEdge(loop).finally(() => {
      if (inFlight.get(loop.id) === work) inFlight.delete(loop.id);
    });
    inFlight.set(loop.id, work);
  }

  return work;
}

export type AssignCoverOptions = {
  timeoutMs?: number;
  onLateCover?: (coverUrl: string) => void;
};

export async function assignLoopCoverWithTimeout(
  loop: Loop,
  options?: AssignCoverOptions,
): Promise<Loop> {
  const timeoutMs = options?.timeoutMs ?? 28_000;
  let timedOut = false;

  const work = assignLoopCoverOnce(loop);
  const raced = await Promise.race([
    work,
    new Promise<null>((resolve) => {
      setTimeout(() => {
        timedOut = true;
        resolve(null);
      }, timeoutMs);
    }),
  ]);

  if (raced?.startsWith("http")) {
    return { ...loop, coverUrl: raced };
  }

  if (timedOut && options?.onLateCover) {
    void work.then((late) => {
      if (late?.startsWith("http")) options.onLateCover!(late);
    });
  }

  return loop;
}

const backfillQueued = new Set<string>();
const MAX_BACKFILL = 8;
let backfillPaused = false;

export function setLoopCoverBackfillPaused(value: boolean): void {
  backfillPaused = value;
}

/** Remplit les covers manquantes (bibliothèque) — Pollinations uniquement, non bloquant. */
export function backfillMissingLoopCovers(loops: Loop[]): void {
  if (backfillPaused) return;
  const candidates = loops
    .filter((l) => !hasCover(l) && !backfillQueued.has(l.id))
    .slice(0, MAX_BACKFILL);

  for (const loop of candidates) {
    backfillQueued.add(loop.id);
    void assignLoopCoverOnce(loop)
      .catch(() => null)
      .finally(() => {
        backfillQueued.delete(loop.id);
      });
  }
}
