import { cn } from "@/lib/utils";

type Variant = "default" | "accent" | "muted";

export function Badge({
  variant = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
        variant === "default" && "border-pk-border bg-pk-bg text-pk-text",
        variant === "accent" && "border-pk-accent/40 bg-pk-accent/15 text-pk-accent",
        variant === "muted" && "border-pk-border bg-pk-panel text-pk-muted",
        className,
      )}
      {...props}
    />
  );
}

