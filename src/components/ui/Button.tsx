import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-pk text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" ? "px-3 py-2" : "px-4 py-2",
        variant === "primary" && "bg-pk-accent text-white shadow-glow hover:bg-pk-accentHover",
        variant === "secondary" && "border border-pk-border bg-pk-panel text-pk-text hover:bg-white/5",
        variant === "ghost" && "bg-transparent text-pk-text hover:bg-white/5",
        variant === "danger" && "border border-pk-danger/50 bg-pk-danger/15 text-pk-text hover:bg-pk-danger/25",
        className,
      )}
      {...props}
    />
  );
}

