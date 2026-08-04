import { buildCoverGenerationSeed, buildLoopCardCoverPrompt } from "@producerhit/shared";
import { isPersistedStorageCoverUrl, preloadCoverImage } from "@/lib/coverArt";
import { persistLoopCover } from "@/lib/loopCoverUrl";
import { uploadLoopCoverImage, isFirebaseStorageCoverUrl } from "@/lib/storageImages";
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

/** Negative prompt pour réduire les visages anime mal finis. */
const FACE_QUALITY_NEGATIVE_PROMPT =
  "unfinished face, missing eye, asymmetrical eyes, blank eyes, cropped face, deformed face, extra eyes, mutated face, bad anatomy, lowres, blurry, watermark, text, signature, jpeg artifacts";

function buildPollinationsUrl(prompt: string, seed: number, width = 768, height = 768): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${encodeURIComponent(
    String(seed),
  )}&nologo=true&model=flux&enhance=true&negative_prompt=${encodeURIComponent(FACE_QUALITY_NEGATIVE_PROMPT)}`;
}

/**
 * Cover carte Pollinations → Firebase Storage (gratuit à la création, pas de crédit).
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
  if (stored && (isPersistedStorageCoverUrl(stored) || isFirebaseStorageCoverUrl(stored))) {
    return { coverUrl: stored, coverKind: "image", skipped: true, source: "storage" };
  }

  const prompt = buildLoopCardCoverPrompt(loop);
  const seed = buildCoverGenerationSeed(prompt, loopId, coverImageSeed(loop as Loop), 0);

  const pollinationsUrl = buildPollinationsUrl(prompt, seed, 768, 768);
  if (!pollinationsUrl.startsWith("http")) return { coverUrl: null };

  // Upload vers Firebase Storage pour persistance permanente
  let coverUrl = await uploadLoopCoverImage(user.id, loopId, pollinationsUrl);

  // Fallback: si l'upload échoue, utiliser l'URL Pollinations (ephemeral)
  if (!coverUrl) coverUrl = pollinationsUrl;

  preloadCoverImage(coverUrl);
  await persistLoopCover(loopId, user.id, coverUrl, loop.stemsUrl ?? null, "image");
  return { coverUrl, coverKind: "image", source: "pollinations" };
}
