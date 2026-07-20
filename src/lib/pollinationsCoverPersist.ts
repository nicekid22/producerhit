import { preloadCoverImage } from "@/lib/coverArt";
import { persistLoopCover } from "@/lib/loopCoverUrl";
import type { Loop } from "@/types/loop";
import { useAuthStore } from "@/stores/authStore";

export const LOOP_COVER_AI_CREDIT_COST = 1;

function buildPollinationsUrl(prompt: string, seed: number, width = 1400, height = 1400): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${encodeURIComponent(
    String(seed),
  )}&nologo=true&model=flux&enhance=true`;
}

export async function generatePollinationsCoverForLoop(params: {
  loop: Pick<Loop, "id" | "userId" | "stemsUrl">;
  prompt: string;
  seed?: number;
}): Promise<{ coverUrl: string | null }> {
  const user = useAuthStore.getState().user;
  if (!user?.id || params.loop.userId !== user.id) return { coverUrl: null };

  const coverUrl = buildPollinationsUrl(params.prompt, params.seed ?? 0, 1400, 1400);
  if (!coverUrl.startsWith("http")) return { coverUrl: null };

  preloadCoverImage(coverUrl);
  await persistLoopCover(params.loop.id, user.id, coverUrl, params.loop.stemsUrl ?? null, "image");
  return { coverUrl };
}

