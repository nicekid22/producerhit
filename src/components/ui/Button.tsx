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
        "inline-flex items-center justify-center gap-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" ? "px-3 py-2" : "px-4 py-2",
        variant === "primary" &&
          "pk-glass-btn pk-glass-btn--primary rounded-full border-0 text-white shadow-none hover:bg-transparent",
        variant === "secondary" &&
          "pk-glass-btn pk-glass-btn--ghost rounded-full border-0 bg-transparent text-white/84 shadow-none hover:bg-transparent",
        variant === "ghost" && "bg-transparent text-pk-text hover:bg-white/5",
        variant === "danger" && "border border-pk-danger/50 bg-pk-danger/15 text-pk-text hover:bg-pk-danger/25",
        className,
      )}
      {...props}
    />
  );
}

