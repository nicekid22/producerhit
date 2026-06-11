import { Link } from "react-router-dom";
import { ThemeBrandMark } from "@/components/ThemeBrandMark";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
  iconOnly?: boolean;
};

export function BrandLogo({ className = "", compact = false, iconOnly = false }: Props) {
  return (
    <Link
      to="/"
      aria-label="ProducerHit home"
      className={cn("group inline-flex items-center gap-2 transition-opacity hover:opacity-90", className)}
    >
      <ThemeBrandMark className={compact ? "h-[1.125rem] w-[1.125rem]" : "h-5 w-5"} />
      {!iconOnly ? (
        <span
          className={cn(
            "font-semibold tracking-tight text-white",
            compact ? "text-sm" : "text-base",
          )}
        >
          <span className="lowercase text-white/90">producer</span>
          <span className="pk-prism-holo-text lowercase">hit</span>
        </span>
      ) : null}
    </Link>
  );
}
