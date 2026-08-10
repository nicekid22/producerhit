import { preloadCoverImage } from "@/lib/coverArt";
import type { Loop } from "@/types/loop";
import { useAuthStore } from "@/stores/authStore";
import { supabase, getSupabaseTokenForFirebaseUser } from "@/lib/supabaseClient";

export const LOOP_COVER_AI_CREDIT_COST = 1;

/**
 * Idempotency key unique pour chaque appel de génération distribution.
 * Format: `{loopId}:{uuid}` — réplique l'ancien `newCoverAiIdempotencyKey` côté Supabase.
 */
function newCoverAiIdempotencyKey(loopId: string): string {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${loopId}:${suffix}`;
}

/** Détecte un code d'erreur Firebase HttpsError dans la réponse ou l'erreur. */
function isNoCreditsError(err: unknown, data: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  if (code === "no_credits") return true;
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (msg.includes("no_credits")) return true;
  if (data && typeof data === "object" && (data as { code?: string }).code === "no_credits") return true;
  return false;
}

/**
 * Génère une cover distribution via la Cloud Function `persistPollinationsCover`.
 * Coût: 1 crédit (idempotent via idempotencyKey) — jeté `new Error("no_credits")` si quota dépassé.
 * La CF s'occupe côté serveur de: check auth + check crédits + download Pollinations + upload
 * Firebase Storage (loop-covers) + persist stems_url.ace + cover_url sur Firestore + bump usage.
 * Le client ne fait que preload l'image puis retourne le coverUrl persistant.
 */
export async function generatePollinationsCoverForLoop(params: {
  loop: Pick<Loop, "id" | "userId" | "stemsUrl">;
  prompt: string;
  seed?: number;
}): Promise<{ coverUrl: string | null }> {
  const user = useAuthStore.getState().user;
  if (!user?.id || params.loop.userId !== user.id) return { coverUrl: null };

  const idempotencyKey = newCoverAiIdempotencyKey(params.loop.id);

  // Exchange Firebase ID token → Supabase JWT (Edge Functions expect Supabase auth)
  const supabaseToken = await getSupabaseTokenForFirebaseUser();
  const authHeaders = supabaseToken ? { Authorization: `Bearer ${supabaseToken}` } : undefined;

  const MAX_COVER_ATTEMPTS = 3;
  const COVER_RETRY_DELAY_MS = 1500;

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= MAX_COVER_ATTEMPTS; attempt++) {
    const { data, error } = await supabase.functions.invoke("persist-pollinations-cover", {
      body: {
        loopId: params.loop.id,
        prompt: params.prompt,
        seed: params.seed ?? 0,
        idempotencyKey,
        purpose: "distribution",
      },
      ...(authHeaders ? { headers: authHeaders } : {}),
    });

    // no_credits → throw immédiatement (pas de retry sur quota)
    if (isNoCreditsError(error, data)) throw new Error("no_credits");

    if (!error) {
      const coverUrl =
        typeof (data as { coverUrl?: unknown })?.coverUrl === "string"
          ? ((data as { coverUrl: string }).coverUrl).trim()
          : "";
      if (coverUrl.startsWith("http")) {
        preloadCoverImage(coverUrl);
        return { coverUrl };
      }
    } else {
      lastError = error;
      console.warn(`[pollinationsCoverPersist] attempt ${attempt}/${MAX_COVER_ATTEMPTS} error:`, error);
    }

    // Pollinations down / transient → backoff et retry
    if (attempt < MAX_COVER_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, COVER_RETRY_DELAY_MS * attempt));
    }
  }

  console.warn("[pollinationsCoverPersist] all attempts failed", lastError);
  return { coverUrl: null };
}
