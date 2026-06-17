import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
  iconOnly?: boolean;
  /** Affichage statique (loader) — pas de lien */
  staticMark?: boolean;
};

/**
 * Wordmark minimal — style Apple Developer : lowercase, SF system, accent par thème (Prism / Cloud / Warm).
 */
export function BrandLogo({ className = "", compact = false, iconOnly = false, staticMark = false }: Props) {
  const rootClass = cn(
    "pk-brand-logo group inline-flex transition-opacity hover:opacity-80",
    iconOnly && "pk-brand-logo--mono",
    compact && "pk-brand-logo--compact",
    staticMark && "pk-brand-logo--static pointer-events-none",
    className,
  );

  const wordmark = iconOnly ? (
    <span className="pk-brand-logo__mono" aria-hidden>
      ph
    </span>
  ) : (
    <span className="pk-brand-logo__word">
      <span className="pk-brand-logo__base">producer</span>
      <span className="pk-brand-logo__accent">hit</span>
    </span>
  );

  if (staticMark) {
    return (
      <span className={rootClass} aria-hidden>
        {wordmark}
      </span>
    );
  }

  if (iconOnly) {
    return (
      <Link to="/" aria-label="ProducerHit home" className={rootClass}>
        {wordmark}
      </Link>
    );
  }

  return (
    <Link to="/" aria-label="ProducerHit home" className={rootClass}>
      {wordmark}
    </Link>
  );
}

/** @deprecated Variantes legacy retirées — lockup unique dev-style */
export type BrandLogoVariant = "dev";

export const BRAND_LOGO_VARIANTS = [
  {
    id: "dev" as const,
    labelFr: "Developer",
    labelEn: "Developer",
    noteFr: "Wordmark lowercase · accent par thème",
  },
];
