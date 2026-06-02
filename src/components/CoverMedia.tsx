import { cn } from "@/lib/utils";
import { isCoverVideo } from "@/lib/coverMedia";

type CoverMediaProps = {
  loop: Parameters<typeof isCoverVideo>[0];
  coverUrl: string;
  coverKey: string;
  className?: string;
  imageClassName?: string;
  onImageLoad?: () => void;
  onImageError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
};

export function CoverMedia({
  loop,
  coverUrl,
  coverKey,
  className,
  imageClassName,
  onImageLoad,
  onImageError,
}: CoverMediaProps) {
  const video = isCoverVideo(loop, coverUrl);

  if (video) {
    return (
      <div className={cn("relative h-full w-full", className)}>
        <video
          key={coverKey}
          src={coverUrl}
          className={cn("absolute inset-0 h-full w-full object-cover", imageClassName)}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full", className)}>
      <img
        key={coverKey}
        src={coverUrl}
        alt=""
        className={cn("absolute inset-0 h-full w-full object-cover", imageClassName)}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        style={{ display: "block", opacity: 0 }}
        onLoad={(e) => {
          e.currentTarget.style.opacity = "1";
          onImageLoad?.();
        }}
        onError={onImageError}
      />
    </div>
  );
}
