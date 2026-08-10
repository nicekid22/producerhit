import { buildCoverGenerationSeed, buildLoopCardCoverPrompt } from "@producerhit/shared";
import { isPersistedStorageCoverUrl, preloadCoverImage } from "@/lib/coverArt";
import { isFirebaseStorageCoverUrl } from "@/lib/storageImages";
import type { Loop } from "@/types/loop";
import { coverImageSeed } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { supabase, getSupabaseTokenForFirebaseUser } from "@/lib/supabaseClient";
import type { CoverKind } from "@/lib/coverMedia";

export type PollinationsCardCoverResult = {
  coverUrl: string | null;
  coverKind?: CoverKind;
  skipped?: boolean;
  source?: "pollinations" | "storage";
};

/**
 * Cover carte Pollinations → Firebase Storage via Cloud Function `persistPollinationsCover`.
 * Purpose "card" = gratuit à la création (pas de crédit) — la CF ne check/bump pas l'usage.
 * Si le loop a déjà une cover persistée en Storage, on court-circuite côté client
 * (la CF aurait fait de même côté serveur, mais on économise le RTT).
 */
export async function persistPollinationsCardCoverForLoop(
  loopId: string,
  loop: Pick<Loop, "id" | "genre" | "mood" | "name" | "prompt" | "seed" | "influence" | "details"> & {
    stemsUrl?: unknown;
  },
): Promise<PollinationsCardCoverResult> {
  const user = useAuthStore.getState().user;
  if (!user?.id) return { coverUrl: null };

  // Court-circuit si cover déjà persistée (évite un RTT inutile)
  const stored = loop.details?.coverUrl?.trim() ?? "";
  if (stored && (isPersistedStorageCoverUrl(stored) || isFirebaseStorageCoverUrl(stored))) {
    return { coverUrl: stored, coverKind: "image", skipped: true, source: "storage" };
  }

  const prompt = buildLoopCardCoverPrompt(loop);
  const seed = buildCoverGenerationSeed(prompt, loopId, coverImageSeed(loop as Loop), 0);

  // Exchange Firebase ID token → Supabase JWT (Edge Functions expect Supabase auth)
  const supabaseToken = await getSupabaseTokenForFirebaseUser();
  const authHeaders = supabaseToken ? { Authorization: `Bearer ${supabaseToken}` } : undefined;

  const MAX_CARD_COVER_ATTEMPTS = 3;
  const CARD_COVER_RETRY_DELAY_MS = 1200;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_CARD_COVER_ATTEMPTS; attempt++) {
    const { data, error } = await supabase.functions.invoke("persist-pollinations-cover", {
      body: {
        loopId,
        prompt,
        seed,
        purpose: "card",
      },
      ...(authHeaders ? { headers: authHeaders } : {}),
    });

    if (!error) {
      const skipped = Boolean((data as { skipped?: unknown } | null)?.skipped);
      const coverUrl =
        typeof (data as { coverUrl?: unknown } | null)?.coverUrl === "string"
          ? ((data as { coverUrl: string }).coverUrl).trim()
          : "";
      if (coverUrl.startsWith("http")) {
        preloadCoverImage(coverUrl);
        return {
          coverUrl,
          coverKind: "image",
          skipped,
          source: skipped ? "storage" : "pollinations",
        };
      }
    } else {
      lastError = error;
      console.warn(`[pollinationsCardCoverPersist] attempt ${attempt}/${MAX_CARD_COVER_ATTEMPTS} error:`, error);
    }

    if (attempt < MAX_CARD_COVER_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, CARD_COVER_RETRY_DELAY_MS * attempt));
    }
  }

  console.warn("[pollinationsCardCoverPersist] all attempts failed", lastError);
  return { coverUrl: null };
}
