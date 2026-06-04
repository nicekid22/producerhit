import { CoverMedia } from "@/components/CoverMedia";
import { StoredLoopCover } from "@/components/cover/StoredLoopCover";
import { useLoopBannerCoverUrl } from "@/hooks/useLoopBannerCoverUrl";
import { coverImageKeyFromLoop } from "@/lib/coverArt";
import { isCoverVideo } from "@/lib/coverMedia";
import type { Loop } from "@/types/loop";
import { COVER_SURFACE_CLASS, cn } from "@/lib/utils";

type Props = {
  loop: Loop;
  className?: string;
};

/** Cover du lecteur dock — même résolution que les cartes workspace. */
export function PlayerCoverThumb({ loop, className }: Props) {
  const { live, coverUrl, bannerCoverUrl } = useLoopBannerCoverUrl(loop);
  const displayUrl = bannerCoverUrl || coverUrl;
  const coverKey = coverImageKeyFromLoop(live);
  const isVideo = isCoverVideo(live, displayUrl);

  if (!displayUrl.startsWith("http")) {
    return <div className={cn(COVER_SURFACE_CLASS, "h-full w-full rounded-[10px]", className)} aria-hidden />;
  }

  if (isVideo) {
    return (
      <CoverMedia
        loop={live}
        coverUrl={displayUrl}
        coverKey={`${coverKey}:${displayUrl}`}
        className={cn("h-full w-full rounded-[10px]", className)}
        imageClassName="rounded-[10px]"
      />
    );
  }

  return (
    <StoredLoopCover
      key={`${coverKey}:${displayUrl}`}
      coverUrl={displayUrl}
      loading="eager"
      className={cn("relative z-[2] h-full w-full rounded-[10px]", className)}
      imageClassName="rounded-[10px]"
    />
  );
}
