import { useCallback, useEffect, useRef, useState } from "react";

import { preloadCoverImage } from "@/lib/coverArt";

import { COVER_SURFACE_CLASS, cn } from "@/lib/utils";

type Props = {
  coverUrl: string;
  className?: string;
  loading?: "eager" | "lazy";
  imageClassName?: string;
};

/** Cover unique lue depuis la DB / Storage — même URL sur toutes les surfaces. */
export function StoredLoopCover({ coverUrl, className, loading = "lazy", imageClassName }: Props) {
  const src = coverUrl.trim();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const markLoadedIfReady = useCallback(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
      setFailed(false);
    }
  }, []);

  useEffect(() => {
    if (!src.startsWith("http")) {
      setLoaded(false);
      setFailed(false);
      return;
    }
    setFailed(false);
    preloadCoverImage(src);
    markLoadedIfReady();
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) return;
    setLoaded(false);
    const t = window.setTimeout(markLoadedIfReady, 80);
    return () => window.clearTimeout(t);
  }, [src, markLoadedIfReady]);

  if (!src.startsWith("http")) {
    return <div className={cn(COVER_SURFACE_CLASS, className)} aria-hidden />;
  }

  return (
    <div className={cn("relative overflow-hidden", COVER_SURFACE_CLASS, className)}>
      <img
        ref={imgRef}
        src={src}
        alt=""
        loading={loading}
        decoding="async"
        referrerPolicy="no-referrer"
        fetchPriority={loading === "eager" ? "high" : "auto"}
        className={cn(
          "absolute inset-0 z-[1] h-full w-full object-cover transition-opacity duration-300 ease-out",
          loaded && !failed ? "opacity-100" : failed ? "opacity-0" : "opacity-0",
          imageClassName,
        )}
        onLoad={() => {
          setLoaded(true);
          setFailed(false);
        }}
        onError={() => {
          setFailed(true);
          setLoaded(false);
        }}
      />
    </div>
  );
}
