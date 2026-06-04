import { supabase } from "@/lib/supabaseClient";
import { preloadCoverImage } from "@/lib/coverArt";
import { PINTEREST_PERSIST_COVERS } from "@/lib/featureFlags";
import {
  buildPersistPinterestQuery,
  type PinterestCoverPersistResult,
} from "@/lib/pinterestCoverPersist";
import { rememberPinterestCoverUrl } from "@/lib/pinterestCoverDedup";
import { persistLoopCover } from "@/lib/loopCoverUrl";
import type { Loop } from "@/types/loop";
import { coverImageSeed, hashString } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

/** Coût aligné sur fetch-mood-image — 1 crédit génération / nouvelle cover. */
export const LOOP_COVER_REROLL_CREDIT_COST = 1;

export function newCoverRerollIdempotencyKey(loopId: string): string {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${loopId}:${suffix}`;
}

async function extractInvokeErrorAsync(error: unknown): Promise<string> {
  const anyError = error as { message?: string; context?: unknown };
  const errContext = anyError.context;
  if (errContext && typeof errContext === "object" && typeof (errContext as Response).json === "function") {
    try {
      const parsed = (await (errContext as Response).json()) as { error?: string };
      if (typeof parsed.error === "string") return parsed.error;
    } catch {
      // ignore
    }
  }
  return anyError.message ?? "invoke_failed";
}

/**
 * Nouvelle image Pinterest → Storage pour une loop déjà possédée (1 crédit).
 * Réservé au propriétaire — vérifié côté Edge.
 */
export async function rerollLoopCover(
  loop: Pick<Loop, "id" | "genre" | "mood" | "name" | "prompt" | "seed" | "influence" | "stemsUrl" | "userId">,
): Promise<PinterestCoverPersistResult> {
  if (!PINTEREST_PERSIST_COVERS) return { coverUrl: null };

  const user = useAuthStore.getState().user;
  if (!user?.id || loop.userId !== user.id) return { coverUrl: null };

  const idempotencyKey = newCoverRerollIdempotencyKey(loop.id);
  const query = buildPersistPinterestQuery(loop);
  const rerollSeed =
    (hashString(`${loop.id}:reroll:${idempotencyKey}`) + coverImageSeed(loop as Loop)) >>> 0;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data, error } = await supabase.functions.invoke("persist-pinterest-cover", {
    body: {
      loopId: loop.id,
      query,
      seed: rerollSeed,
      forceRefresh: true,
      idempotencyKey,
    },
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
  });

  if (error) {
    const code = await extractInvokeErrorAsync(error);
    if (code === "no_credits" || code.includes("no_credits")) {
      throw new Error("no_credits");
    }
    if (import.meta.env.DEV) console.warn("[ProducerHit] reroll cover:", code);
    return { coverUrl: null };
  }

  if (data?.error === "no_credits") throw new Error("no_credits");

  if (data?.skipped === true) {
    return { coverUrl: null, skipped: true };
  }

  const coverUrl = typeof data?.coverUrl === "string" ? data.coverUrl.trim() : "";
  if (!coverUrl.startsWith("http")) {
    const err = typeof data?.error === "string" ? data.error : "cover_reroll_failed";
    if (err === "pinterest_all_used") throw new Error("pinterest_all_used");
    return { coverUrl: null };
  }

  rememberPinterestCoverUrl(coverUrl);
  preloadCoverImage(coverUrl);
  await persistLoopCover(loop.id, user.id, coverUrl, loop.stemsUrl ?? null, "image");

  return {
    coverUrl,
    coverKind: "image",
    source: "persist-edge",
  };
}
