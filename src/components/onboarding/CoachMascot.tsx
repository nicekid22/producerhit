import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Image URL quand la mascotte finale sera prête */
  imageSrc?: string | null;
  size?: "sm" | "md" | "lg";
};

/** Placeholder mascotte — remplacer `imageSrc` par l'asset final. */
export function CoachMascot({ className, imageSrc, size = "md" }: Props) {
  const dim = size === "sm" ? "h-10 w-10" : size === "lg" ? "h-16 w-16" : "h-12 w-12";

  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt=""
        className={cn(dim, "rounded-2xl object-cover", className)}
        draggable={false}
      />
    );
  }

  return (
    <div
      className={cn(
        dim,
        "pk-coach-mascot relative flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/90 to-cyan-400/80 shadow-[0_8px_24px_rgba(56,189,248,0.35)]",
        className,
      )}
      aria-hidden
    >
      <span className="absolute left-[28%] top-[32%] h-1.5 w-1.5 rounded-full bg-white/95" />
      <span className="absolute right-[28%] top-[32%] h-1.5 w-1.5 rounded-full bg-white/95" />
      <span className="mt-3 h-1 w-3 rounded-full bg-white/80" />
      <span className="absolute -right-0.5 -top-0.5 text-[10px]">🎧</span>
    </div>
  );
}
