import { cn } from "@/lib/utils";

type Props = {
  /** Couche visible par défaut (Pollinations / cover stockée) */
  baseUrl: string;
  /** Couche révélée au survol (Pinterest) */
  revealUrl?: string | null;
  className?: string;
  loading?: "eager" | "lazy";
};

/** Deux covers empilées — base en dessous, reveal au survol (desktop) ou au toucher (mobile). */
export function CoverPeekStack({ baseUrl, revealUrl, className, loading = "lazy" }: Props) {
  const reveal = revealUrl?.trim() ?? "";
  const hasReveal = reveal.startsWith("http");
  const base = baseUrl.trim();

  return (
    <div
      className={cn(
        "pk-cover-peek relative overflow-hidden",
        hasReveal && "pk-cover-peek--active group",
        className,
      )}
    >
      <div className="pk-cover-peek__stack absolute inset-0">
        {base ? (
          <img
            src={base}
            alt=""
            loading={loading}
            decoding="async"
            referrerPolicy="no-referrer"
            className="pk-cover-peek__layer pk-cover-peek__layer--base"
            onLoad={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
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
            onLoad={(e) => {
              e.currentTarget.dataset.loaded = "1";
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

/** Cover unique — Pinterest en premier, fallback Pollinations si erreur. */
export function CoverForegroundFirst({
  primaryUrl,
  fallbackUrl,
  className,
  loading = "lazy",
}: {
  primaryUrl: string;
  fallbackUrl: string;
  className?: string;
  loading?: "eager" | "lazy";
}) {
  const primary = primaryUrl.trim();
  const fallback = fallbackUrl.trim();
  const src = primary.startsWith("http") ? primary : fallback;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img
        src={src}
        alt=""
        loading={loading}
        decoding="async"
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300"
        onLoad={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        onError={(e) => {
          const img = e.currentTarget;
          if (fallback && img.src !== fallback) {
            img.src = fallback;
            return;
          }
          img.style.display = "none";
        }}
      />
    </div>
  );
}
