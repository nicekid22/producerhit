import type { Loop } from "@producerhit/shared";
import { invokeSupabaseFunction } from "./edgeInvoke";
import { supabase } from "./supabase";

const DEFAULT_TAGS = "streetwear music aesthetic people portrait ambiance";
const inFlight = new Map<string, Promise<string | null>>();

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pinterestGenerationTitle(loop: Pick<Loop, "genre" | "name" | "prompt">): string {
  const name = (loop.name ?? "").trim();
  const cleaned = name
    .replace(/[^a-zA-Z0-9À-ÿ\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length >= 2 && !/^untitled$/i.test(cleaned)) return cleaned.slice(0, 48);
  const genre = (loop.genre ?? "").trim();
  if (genre.length >= 2) return genre.slice(0, 48);
  const prompt = (loop.prompt ?? "").trim();
  const snippet = prompt.split(/[,.]/)[0]?.trim() ?? "";
  if (snippet.length >= 3 && snippet.length <= 48) return snippet;
  return "";
}

export function buildPersistPinterestQuery(
  loop: Pick<Loop, "id" | "genre" | "mood" | "name" | "prompt">,
): string {
  const title = pinterestGenerationTitle(loop);
  const musicStyle = [loop.genre, loop.mood]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => s.length > 1);
  return [title, ...musicStyle, DEFAULT_TAGS]
    .filter((p) => p.length > 0)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
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

async function persistViaEdge(loop: Loop): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const query = buildPersistPinterestQuery(loop);
  const seed = hashString(`${loop.id}:${query}`) >>> 0;

  const { data, errorText } = await invokeSupabaseFunction<{
    coverUrl?: string;
    error?: string;
  }>({
    name: "persist-pinterest-cover",
    body: { loopId: loop.id, query, seed },
    accessToken: session.access_token,
  });

  if (errorText) return null;
  const coverUrl = typeof data?.coverUrl === "string" ? data.coverUrl.trim() : "";
  return coverUrl.startsWith("http") ? coverUrl : null;
}

async function fetchPinimgFallback(loop: Loop): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const query = buildPersistPinterestQuery(loop);
  const seed = hashString(`${loop.id}:${query}:fb`) >>> 0;

  const { data, errorText } = await invokeSupabaseFunction<{
    imageUrl?: string;
    imageUrls?: string[];
  }>({
    name: "fetch-pinterest-cover",
    body: { query, seed, count: 8, loopId: loop.id },
    accessToken: session.access_token,
  });

  if (errorText) return null;
  const single = typeof data?.imageUrl === "string" && data.imageUrl.startsWith("http") ? data.imageUrl : null;
  const list = Array.isArray(data?.imageUrls)
    ? data.imageUrls.filter((u): u is string => typeof u === "string" && u.startsWith("http"))
    : [];
  const url = single ?? list[0] ?? null;
  if (!url) return null;

  await supabase
    .from("loops")
    .update({ cover_url: url })
    .eq("id", loop.id);

  return url;
}

/** Pinterest → Storage (même flux que desktop persist-pinterest-cover). */
export async function assignLoopCoverOnce(loop: Loop): Promise<string | null> {
  if (hasCover(loop)) {
    return loop.coverUrl?.trim() || null;
  }

  let work = inFlight.get(loop.id);
  if (!work) {
    work = (async () => {
      const persisted = await persistViaEdge(loop);
      if (persisted) return persisted;
      return fetchPinimgFallback(loop);
    })().finally(() => {
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

/** Cover Pinterest à l'affichage (communauté — sans écriture DB). */
export async function fetchDisplayPinterestCover(
  loop: Pick<Loop, "id" | "genre" | "mood" | "name" | "prompt" | "coverUrl" | "stemsUrl">,
): Promise<string | null> {
  if (hasCover(loop)) {
    const col = loop.coverUrl?.trim() ?? "";
    if (col.startsWith("http")) return col;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const query = buildPersistPinterestQuery(loop);
  const seed = hashString(`${loop.id}:${query}:display`) >>> 0;

  const { data, errorText } = await invokeSupabaseFunction<{
    imageUrl?: string;
    imageUrls?: string[];
  }>({
    name: "fetch-pinterest-cover",
    body: { query, seed, count: 6 },
    accessToken: session.access_token,
  });

  if (errorText) return null;
  const single = typeof data?.imageUrl === "string" && data.imageUrl.startsWith("http") ? data.imageUrl : null;
  const list = Array.isArray(data?.imageUrls)
    ? data.imageUrls.filter((u): u is string => typeof u === "string" && u.startsWith("http"))
    : [];
  return single ?? list[0] ?? null;
}

const backfillQueued = new Set<string>();
let backfillActive = 0;
const MAX_BACKFILL = 8;

/** Remplit les covers manquantes (bibliothèque) — non bloquant. */
export function backfillMissingLoopCovers(loops: Loop[]): void {
  const candidates = loops
    .filter((l) => !hasCover(l) && !backfillQueued.has(l.id))
    .slice(0, MAX_BACKFILL);

  for (const loop of candidates) {
    backfillQueued.add(loop.id);
    backfillActive += 1;
    void assignLoopCoverOnce(loop)
      .catch(() => null)
      .finally(() => {
        backfillActive -= 1;
        backfillQueued.delete(loop.id);
      });
  }
}
