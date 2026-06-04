import { useState } from "react";
import { CoverVintagePlaybackFx } from "@/components/cover/CoverVintagePlaybackFx";
import { cn } from "@/lib/utils";

type Props = {
  /** Couche visible par défaut (Pollinations / cover stockée) */
  baseUrl: string;
  /** Couche révélée au survol (Pinterest) */
  revealUrl?: string | null;
  className?: string;
  loading?: "eager" | "lazy";
};

function markCoverLoaded(el: HTMLImageElement) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add("is-loaded");
    });
  });
}

/** Deux covers empilées — base en dessous, reveal au survol (desktop) ou au toucher (mobile). */
export function CoverPeekStack({ baseUrl, revealUrl, className, loading = "lazy" }: Props) {
  const reveal = revealUrl?.trim() ?? "";
  const hasReveal = reveal.startsWith("http");
  const base = baseUrl.trim();

  return (
    <div
      className={cn(
        "pk-cover-peek relative overflow-hidden bg-[#060608]",
        hasReveal && "pk-cover-peek--active group",
        className,
      )}
    >
      <div className="pk-cover-peek__stack absolute inset-0">
        <div className="pk-landing-cover-stack__surface" aria-hidden />
        {base ? (
          <img
            src={base}
            alt=""
            loading={loading}
            decoding="async"
            referrerPolicy="no-referrer"
            className="pk-cover-peek__layer pk-cover-peek__layer--base"
            onLoad={(e) => markCoverLoaded(e.currentTarget)}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        {hasReveal ? (
          <img
            src={reveal}
            alt=""
            loading={loading}
            decoding="async"
            referrerPolicy="no-referrer"
            className="pk-cover-peek__layer pk-cover-peek__layer--reveal"
            onLoad={(e) => markCoverLoaded(e.currentTarget)}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

/** Workspace — cover unique (Pinterest / Storage). */
export function WorkspaceCoverStack({
  coverUrl,
  className,
  loading = "lazy",
  imageClassName,
  isPlaying = false,
}: {
  coverUrl: string;
  className?: string;
  loading?: "eager" | "lazy";
  imageClassName?: string;
  isPlaying?: boolean;
}) {
  const src = coverUrl.trim();
  const hasCover = src.startsWith("http");

  return (
    <div
      className={cn(
        "pk-workspace-cover-stack relative overflow-hidden bg-[#060608]",
        isPlaying && "pk-workspace-cover-stack--playing",
        className,
      )}
    >
      <div className="pk-workspace-cover-stack__inner absolute inset-0">
        <div className="pk-landing-cover-stack__surface absolute inset-0" aria-hidden />
        {hasCover ? (
          <img
            src={src}
            alt=""
            loading={loading}
            decoding="async"
            referrerPolicy="no-referrer"
            className={cn(
              "pk-workspace-cover-stack__layer pk-workspace-cover-stack__pinterest",
              imageClassName,
            )}
            onLoad={(e) => markCoverLoaded(e.currentTarget)}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
      </div>
      <CoverVintagePlaybackFx active={isPlaying} />
    </div>
  );
}

/** Cover unique — URL persistée uniquement. */
export function CoverForegroundFirst({
  coverUrl,
  className,
  loading = "lazy",
}: {
  coverUrl: string;
  className?: string;
  loading?: "eager" | "lazy";
}) {
  const src = coverUrl.trim();
  const [loaded, setLoaded] = useState(false);

  if (!src.startsWith("http")) {
    return <div className={cn("relative overflow-hidden bg-[#060608]", className)} aria-hidden />;
  }

  return (
    <div className={cn("relative overflow-hidden bg-[#060608]", className)}>
      <div className="pk-landing-cover-stack__surface absolute inset-0" aria-hidden />
      <img
        src={src}
        alt=""
        loading={loading}
        decoding="async"
        referrerPolicy="no-referrer"
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out",
          loaded ? "opacity-100" : "opacity-0",
        )}
        onLoad={() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setLoaded(true));
          });
        }}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}
