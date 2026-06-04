import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Cover Pinterest / Storage */
  coverUrl: string;
  className?: string;
  loading?: "eager" | "lazy";
  darkSurface?: boolean;
};

/** Landing communauté — surface noire + cover unique. */
export function LandingCommunityCoverStack({
  coverUrl,
  className,
  loading = "lazy",
  darkSurface = true,
}: Props) {
  const src = coverUrl.trim();
  const hasCover = src.startsWith("http");
  const [loaded, setLoaded] = useState(false);

  const markLoaded = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setLoaded(true));
    });
  };

  return (
    <div className={cn("pk-landing-cover-stack", hasCover && "pk-landing-cover-stack--has-pin", className)}>
      {darkSurface ? <div className="pk-landing-cover-stack__surface" aria-hidden /> : null}
      {hasCover ? (
        <img
          src={src}
          alt=""
          loading={loading}
          decoding="async"
          referrerPolicy="no-referrer"
          className={cn("pk-landing-cover-stack__layer pk-landing-cover-stack__pinterest", loaded && "is-loaded")}
          onLoad={markLoaded}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </div>
  );
}
