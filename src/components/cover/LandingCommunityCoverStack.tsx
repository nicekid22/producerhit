import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Pollinations / cover persistée — couche du dessus */
  pollinationsUrl: string;
  /** Pinterest — entre le dégradé et Pollinations */
  pinterestUrl?: string | null;
  className?: string;
  loading?: "eager" | "lazy";
};

/**
 * Landing communauté uniquement — empilement (bas → haut) :
 * dégradé (parent) → Pinterest → Pollinations.
 * Au survol : Pollinations s’efface pour laisser voir Pinterest.
 */
export function LandingCommunityCoverStack({ pollinationsUrl, pinterestUrl, className, loading = "lazy" }: Props) {
  const pol = pollinationsUrl.trim();
  const pin = (pinterestUrl ?? "").trim();
  const hasPin = pin.startsWith("http");
  const hasPol = pol.startsWith("http");
  const [polLoaded, setPolLoaded] = useState(false);
  const [pinLoaded, setPinLoaded] = useState(false);

  return (
    <div className={cn("pk-landing-cover-stack", hasPin && "pk-landing-cover-stack--has-pin", className)}>
      {hasPin ? (
        <img
          src={pin}
          alt=""
          loading={loading}
          decoding="async"
          referrerPolicy="no-referrer"
          className={cn("pk-landing-cover-stack__layer pk-landing-cover-stack__pinterest", pinLoaded && "is-loaded")}
          onLoad={() => setPinLoaded(true)}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      {hasPol ? (
        <img
          src={pol}
          alt=""
          loading={loading}
          decoding="async"
          referrerPolicy="no-referrer"
          className={cn("pk-landing-cover-stack__layer pk-landing-cover-stack__pollinations", polLoaded && "is-loaded")}
          onLoad={() => setPolLoaded(true)}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </div>
  );
}
