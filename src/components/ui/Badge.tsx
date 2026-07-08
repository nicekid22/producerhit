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
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide backdrop-blur-sm transition-all duration-200",
        variant === "default" && "border-white/10 bg-white/[0.06] text-white/80 hover:bg-white/[0.1] hover:border-white/[0.14] hover:text-white/95",
        variant === "accent" && "border-purple-400/25 bg-purple-500/[0.12] text-purple-200/90 hover:bg-purple-500/20 hover:border-purple-400/35",
        variant === "muted" && "border-white/[0.06] bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:border-white/[0.1] hover:text-white/70",
        className,
      )}
      {...props}
    />
  );
}
