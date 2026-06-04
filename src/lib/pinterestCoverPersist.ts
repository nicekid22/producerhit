import { supabase } from "@/lib/supabaseClient";
import { isPersistedStorageCoverUrl, preloadCoverImage } from "@/lib/coverArt";
import { persistLoopCover } from "@/lib/loopCoverUrl";
import { PINTEREST_PERSIST_COVERS, PINTEREST_PINIMG_FALLBACK } from "@/lib/featureFlags";
import { discoverPinterestCoverTerms } from "@/lib/pinterestDiscovery";
import {
  buildPinterestStyleTail,
  pinterestGenerationTitle,
} from "@/lib/pinterestCoverFetch";
import {
  isPinterestCoverUsedInSession,
  rememberPinterestCoverUrl,
} from "@/lib/pinterestCoverDedup";
import type { Loop } from "@/types/loop";
import { coverImageSeed, hashString } from "@/lib/utils";
import type { CoverKind } from "@/lib/coverMedia";
import { useAuthStore } from "@/stores/authStore";

export type PinterestCoverPersistResult = {
  coverUrl: string | null;
  coverKind?: CoverKind;
  skipped?: boolean;
  source?: "storage" | "pinimg" | "persist-edge";
};

/** Requête Pinterest — titre de génération, terme classé discovery, puis tags style. */
export function buildPersistPinterestQuery(
  loop: Pick<Loop, "id" | "genre" | "mood" | "name" | "prompt" | "seed" | "influence">,
): string {
  const title = pinterestGenerationTitle(loop);
  const { picked } = discoverPinterestCoverTerms(loop);
  const tail = buildPinterestStyleTail(loop, 0);
  return [title, picked, tail].filter((p) => p.length > 0).join(" ").replace(/\s+/g, " ").trim().slice(0, 100);
}

function isPersistEdgeMissing(error: unknown, data: unknown): boolean {
  const msg = String((error as { message?: string })?.message ?? "").toLowerCase();
  if (msg.includes("not found") || msg.includes("404")) return true;
  if (data && typeof data === "object" && "code" in data) {
    const code = String((data as { code?: string }).code ?? "").toUpperCase();
    if (code === "NOT_FOUND") return true;
  }
  return false;
}

/** fetch-pinterest-cover (déjà déployée) + enregistrement stems_url côté client. */
async function persistPinimgViaFetchEdge(
  loopId: string,
  query: string,
  seed: number,
  stemsUrl: unknown,
): Promise<PinterestCoverPersistResult> {
  const user = useAuthStore.getState().user;
  if (!user?.id) return { coverUrl: null };

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data, error } = await supabase.functions.invoke("fetch-pinterest-cover", {
    body: { query, seed, count: 1, loopId },
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
  });

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[ProducerHit] fetch-pinterest-cover (fallback):", error);
    }
    return { coverUrl: null };
  }

  const pinUrl =
    (typeof data?.imageUrl === "string" && data.imageUrl.startsWith("http") ? data.imageUrl : null) ??
    (Array.isArray(data?.imageUrls) ? (data.imageUrls[0] as string) : null);

  if (!pinUrl?.startsWith("http")) return { coverUrl: null };
  if (isPinterestCoverUsedInSession(pinUrl)) return { coverUrl: null };

  const saved = await persistLoopCover(loopId, user.id, pinUrl, stemsUrl, "image");
  if (!saved) return { coverUrl: null };

  rememberPinterestCoverUrl(pinUrl);
  preloadCoverImage(pinUrl);
  return { coverUrl: pinUrl, coverKind: "image", source: "pinimg" };
}

/**
 * Pinterest → Storage (Edge persist-pinterest-cover) si déployée,
 * sinon fallback fetch-pinterest-cover + URL pinimg en DB (affichage immédiat).
 */
export async function persistPinterestCoverForLoop(
  loopId: string,
  loop: Pick<Loop, "id" | "genre" | "mood" | "name" | "prompt" | "seed" | "influence"> & {
    stemsUrl?: unknown;
  },
): Promise<PinterestCoverPersistResult> {
  if (!PINTEREST_PERSIST_COVERS) return { coverUrl: null };

  const existing = loop as Loop;
  const stored = existing.details?.coverUrl?.trim();
  if (stored && isPersistedStorageCoverUrl(stored)) {
    return { coverUrl: stored, coverKind: "image", skipped: true, source: "storage" };
  }

  const query = buildPersistPinterestQuery(loop);
  const seed = (hashString(`${loopId}:${query}`) + coverImageSeed(loop as Loop)) >>> 0;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data, error } = await supabase.functions.invoke("persist-pinterest-cover", {
    body: { loopId, query, seed },
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
  });

  if (!error) {
    const coverUrl = typeof data?.coverUrl === "string" ? data.coverUrl.trim() : "";
    if (coverUrl.startsWith("http")) {
      rememberPinterestCoverUrl(coverUrl);
      preloadCoverImage(coverUrl);
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        void persistLoopCover(loopId, userId, coverUrl, loop.stemsUrl ?? existing.stemsUrl, "image");
      }
      return {
        coverUrl,
        coverKind: "image",
        skipped: data?.skipped === true,
        source: "persist-edge",
      };
    }
  }

  const edgeMissing = isPersistEdgeMissing(error, data);
  if (import.meta.env.DEV) {
    console.warn(
      "[ProducerHit] persist-pinterest-cover:",
      error?.message ?? error,
      edgeMissing ? "→ fallback fetch-pinterest-cover" : "",
    );
    if (edgeMissing) {
      console.warn("[ProducerHit] Déployer pour Storage: supabase functions deploy persist-pinterest-cover");
    }
  }

  if (!PINTEREST_PINIMG_FALLBACK) {
    return { coverUrl: null };
  }

  return persistPinimgViaFetchEdge(loopId, query, seed, loop.stemsUrl ?? existing.stemsUrl);
}
