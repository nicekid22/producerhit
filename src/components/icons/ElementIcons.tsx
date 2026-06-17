import { Cloud, Droplets, Flame, Sprout, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ElementKind = "fire" | "air" | "water" | "earth";

type IconProps = {
  className?: string;
  strokeWidth?: number;
};

/** Style Lucide unifié — grille 24px, traits arrondis (réf. lucide.dev) */
function ElementLucide({
  icon: Icon,
  variant,
  className,
  strokeWidth = 1.75,
}: IconProps & { icon: LucideIcon; variant: ElementKind }) {
  return (
    <Icon
      className={cn("pk-element-icon", `pk-element-icon--${variant}`, className)}
      strokeWidth={strokeWidth}
      aria-hidden
    />
  );
}

/** Feu — Flame (Lucide) */
export function ElementFireIcon(props: IconProps) {
  return <ElementLucide icon={Flame} variant="fire" {...props} />;
}

/** Air — Cloud (Lucide) */
export function ElementAirIcon(props: IconProps) {
  return <ElementLucide icon={Cloud} variant="air" {...props} />;
}

/** Eau — Droplets (Lucide) */
export function ElementWaterIcon(props: IconProps) {
  return <ElementLucide icon={Droplets} variant="water" {...props} />;
}

/** Terre — Sprout / plante (Lucide) */
export function ElementEarthIcon(props: IconProps) {
  return <ElementLucide icon={Sprout} variant="earth" {...props} />;
}

const ELEMENT_MAP = {
  fire: ElementFireIcon,
  air: ElementAirIcon,
  water: ElementWaterIcon,
  earth: ElementEarthIcon,
} as const;

export function ElementIcon({ kind, className, strokeWidth }: { kind: ElementKind } & IconProps) {
  const Cmp = ELEMENT_MAP[kind];
  return <Cmp className={className} strokeWidth={strokeWidth} />;
}
