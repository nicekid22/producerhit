import { preloadCoverImage } from "@/lib/coverArt";
import { persistLoopCover } from "@/lib/loopCoverUrl";
import { uploadLoopCoverImage } from "@/lib/storageImages";
import type { Loop } from "@/types/loop";
import { useAuthStore } from "@/stores/authStore";

export const LOOP_COVER_AI_CREDIT_COST = 1;

/** Negative prompt pour réduire les visages anime mal finis sur les covers. */
const FACE_QUALITY_NEGATIVE_PROMPT =
  "unfinished face, missing eye, asymmetrical eyes, blank eyes, cropped face, deformed face, extra eyes, mutated face, bad anatomy, lowres, blurry, watermark, text, signature, jpeg artifacts";

function buildPollinationsUrl(prompt: string, seed: number, width = 1400, height = 1400): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${encodeURIComponent(
    String(seed),
  )}&nologo=true&model=flux&enhance=true&negative_prompt=${encodeURIComponent(FACE_QUALITY_NEGATIVE_PROMPT)}`;
}

/**
 * Génère une cover via Pollinations, la télécharge, et l'upload vers Firebase Storage.
 * Retourne l'URL Firebase Storage permanente (ou l'URL Pollinations en fallback).
 */
export async function generatePollinationsCoverForLoop(params: {
  loop: Pick<Loop, "id" | "userId" | "stemsUrl">;
  prompt: string;
  seed?: number;
}): Promise<{ coverUrl: string | null }> {
  const user = useAuthStore.getState().user;
  if (!user?.id || params.loop.userId !== user.id) return { coverUrl: null };

  const pollinationsUrl = buildPollinationsUrl(params.prompt, params.seed ?? 0, 1400, 1400);
  if (!pollinationsUrl.startsWith("http")) return { coverUrl: null };

  // Upload vers Firebase Storage pour persistance permanente
  let coverUrl = await uploadLoopCoverImage(user.id, params.loop.id, pollinationsUrl);

  // Fallback: si l'upload échoue, utiliser l'URL Pollinations (ephemeral)
  if (!coverUrl) coverUrl = pollinationsUrl;

  preloadCoverImage(coverUrl);
  await persistLoopCover(params.loop.id, user.id, coverUrl, params.loop.stemsUrl ?? null, "image");
  return { coverUrl };
}

