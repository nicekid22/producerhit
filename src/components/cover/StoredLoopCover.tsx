import { useCallback, useEffect, useRef, useState } from "react";

import { preloadCoverImage } from "@/lib/coverArt";

import { COVER_SURFACE_CLASS, cn } from "@/lib/utils";

type Props = {
  coverUrl: string;
  className?: string;
  loading?: "eager" | "lazy";
  imageClassName?: string;
};

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

/** Cover unique lue depuis la DB / Storage — même URL sur toutes les surfaces. */
export function StoredLoopCover({ coverUrl, className, loading = "lazy", imageClassName }: Props) {
  const src = coverUrl.trim();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const retryTimerRef = useRef<number | null>(null);

  const markLoadedIfReady = useCallback(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
      setFailed(false);
    }
  }, []);

  // Retry on failure
  useEffect(() => {
    if (!failed || retryCount >= MAX_RETRIES) return;
    retryTimerRef.current = window.setTimeout(() => {
      setRetryCount((c) => c + 1);
      setFailed(false);
      // Force re-render by clearing and re-setting the src
      const img = imgRef.current;
      if (img) {
        img.style.opacity = "0";
        const currentSrc = img.src;
        img.src = "";
        img.src = currentSrc;
      }
    }, RETRY_DELAY_MS);
    return () => {
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
    };
  }, [failed, retryCount]);

  useEffect(() => {
    if (!src.startsWith("http")) {
      setLoaded(false);
      setFailed(false);
      setRetryCount(0);
      return;
    }
    setFailed(false);
    setRetryCount(0);
    preloadCoverImage(src);

    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
      return;
    }

    const probe = new Image();
    probe.src = src;
    if (probe.complete && probe.naturalWidth > 0) {
      setLoaded(true);
      return;
    }

    setLoaded(false);
    const t = window.setTimeout(markLoadedIfReady, 80);
    return () => window.clearTimeout(t);
  }, [src, markLoadedIfReady]);

  if (!src.startsWith("http")) {
    return (
      <div className={cn("flex items-center justify-center", COVER_SURFACE_CLASS, className)} aria-hidden>
        <div className="h-8 w-8 rounded-full border border-white/10 bg-white/[0.04]" />
      </div>
    );
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
        className={cn(
          "absolute inset-0 z-[1] h-full w-full object-cover transition-opacity duration-300 ease-out",
          loaded ? "opacity-100" : "opacity-0",
          imageClassName,
        )}
        onLoad={() => {
          setLoaded(true);
          setFailed(false);
          setRetryCount(0);
        }}
        onError={() => {
          setLoaded(false);
          setFailed(true);
        }}
      />
    </div>
  );
}
