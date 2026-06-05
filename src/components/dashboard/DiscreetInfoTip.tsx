import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  className?: string;
};

/** Petit ? discret — info au survol / focus (title natif). */
export function DiscreetInfoTip({ text, className }: Props) {
  return (
    <button
      type="button"
      className={cn(
        "pk-gen-hint inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
        "text-pk-muted/50 transition-colors hover:text-pk-muted focus-visible:text-pk-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pk-accent/40",
        className,
      )}
      aria-label={text}
      title={text}
      onClick={(e) => e.stopPropagation()}
    >
      <HelpCircle className="h-3 w-3" strokeWidth={2.25} aria-hidden />
    </button>
  );
}
