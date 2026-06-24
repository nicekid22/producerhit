import { buildCoverGenerationSeed, buildLoopCardCoverPrompt } from "@producerhit/shared";
import { supabase } from "@/lib/supabaseClient";
import { isPersistedStorageCoverUrl, preloadCoverImage } from "@/lib/coverArt";
import { persistLoopCover } from "@/lib/loopCoverUrl";
import type { Loop } from "@/types/loop";
import { coverImageSeed } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import type { CoverKind } from "@/lib/coverMedia";

export type PollinationsCardCoverResult = {
  coverUrl: string | null;
  coverKind?: CoverKind;
  skipped?: boolean;
  source?: "pollinations" | "storage";
};

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
 * Cover carte Pollinations → Storage (gratuit à la création, pas de crédit).
 */
export async function persistPollinationsCardCoverForLoop(
  loopId: string,
  loop: Pick<Loop, "id" | "genre" | "mood" | "name" | "prompt" | "seed" | "influence" | "details"> & {
    stemsUrl?: unknown;
  },
): Promise<PollinationsCardCoverResult> {
  const user = useAuthStore.getState().user;
  if (!user?.id) return { coverUrl: null };

  const stored = loop.details?.coverUrl?.trim() ?? "";
  if (stored && isPersistedStorageCoverUrl(stored)) {
    return { coverUrl: stored, coverKind: "image", skipped: true, source: "storage" };
  }

  const prompt = buildLoopCardCoverPrompt(loop);
  const seed = buildCoverGenerationSeed(prompt, loopId, coverImageSeed(loop as Loop), 0);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data, error } = await supabase.functions.invoke("persist-pollinations-cover", {
    body: {
      loopId,
      prompt,
      seed,
      purpose: "card",
    },
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
  });

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[ProducerHit] persist-pollinations-cover (card):", await extractInvokeErrorAsync(error));
    }
    return { coverUrl: null };
  }

  if (data?.skipped === true) {
    const url = typeof data?.coverUrl === "string" ? data.coverUrl.trim() : stored;
    if (url.startsWith("http")) {
      return { coverUrl: url, coverKind: "image", skipped: true, source: "storage" };
    }
  }

  const coverUrl = typeof data?.coverUrl === "string" ? data.coverUrl.trim() : "";
  if (!coverUrl.startsWith("http")) return { coverUrl: null };

  preloadCoverImage(coverUrl);
  await persistLoopCover(loopId, user.id, coverUrl, loop.stemsUrl ?? null, "image");
  return { coverUrl, coverKind: "image", source: "pollinations" };
}
