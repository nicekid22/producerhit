import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export type HeroCtaVariant = "drift" | "orbit" | "wave" | "beam" | "spark";

type Props = {
  to: string;
  variant?: HeroCtaVariant;
  size?: "md" | "lg" | "nav";
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

const sizeClass: Record<NonNullable<Props["size"]>, string> = {
  md: "pk-hero-cta--md",
  lg: "pk-hero-cta--lg",
  nav: "pk-hero-cta--nav",
};

export function HeroCtaButton({
  to,
  variant = "drift",
  size = "md",
  className,
  children,
  onClick,
}: Props) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn("pk-hero-cta", `pk-hero-cta--${variant}`, sizeClass[size], className)}
    >
      <span className="pk-hero-cta__glass" aria-hidden>
        <span className="pk-hero-cta__fx" aria-hidden />
      </span>
      <span className="pk-hero-cta__label">{children}</span>
    </Link>
  );
}
