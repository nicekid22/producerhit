import { buildCoverGenerationSeed, buildLoopCardCoverPrompt } from "@producerhit/shared";
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

function buildPollinationsUrl(prompt: string, seed: number, width = 768, height = 768): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${encodeURIComponent(
    String(seed),
  )}&nologo=true&model=flux&enhance=true`;
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

  const coverUrl = buildPollinationsUrl(prompt, seed, 768, 768);
  if (!coverUrl.startsWith("http")) return { coverUrl: null };

  preloadCoverImage(coverUrl);
  await persistLoopCover(loopId, user.id, coverUrl, loop.stemsUrl ?? null, "image");
  return { coverUrl, coverKind: "image", source: "pollinations" };
}
