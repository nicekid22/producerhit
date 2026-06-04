import { useMemo } from "react";
import { useWorkspacePinterestCover } from "@/hooks/useLazyPinterestCover";
import {
  displayCoverUrl,
  needsPinterestCover,
  resolveLoopDisplayCoverUrl,
} from "@/lib/coverArt";
import { useLoopsStore } from "@/stores/loopsStore";
import type { Loop } from "@/types/loop";

/**
 * URL d’affichage cover (Storage + fallback Pinterest workspace).
 * Même logique que les bannières LoopCard — fetch Pinterest immédiat (pas de lazy inView).
 */
export function useLoopBannerCoverUrl(loop: Loop) {
  const loops = useLoopsStore((s) => s.loops);
  const live = useMemo(() => loops.find((l) => l.id === loop.id) ?? loop, [loop, loops]);

  const coverUrlRaw = useMemo(
    () => resolveLoopDisplayCoverUrl(live),
    [
      live.details?.coverPrompt,
      live.details?.coverUrl,
      live.details?.coverKind,
      live.details?.coverRevision,
      live.genre,
      live.id,
      live.influence,
      live.mood,
      live.seed,
    ],
  );

  const coverUrl = useMemo(
    () => displayCoverUrl(coverUrlRaw, live.details?.coverRevision),
    [coverUrlRaw, live.details?.coverRevision],
  );

  const needsLazyCover = needsPinterestCover(live) || !coverUrl.startsWith("http");
  const lazyCoverUrl = useWorkspacePinterestCover(
    {
      id: live.id,
      genre: live.genre,
      mood: live.mood,
      name: live.name,
      prompt: live.details?.coverPrompt,
    },
    needsLazyCover,
  );

  const bannerCoverUrl =
    coverUrl.startsWith("http") ? coverUrl : lazyCoverUrl?.startsWith("http") ? lazyCoverUrl : "";

  return { live, coverUrl, bannerCoverUrl };
}
