import { cn } from "@/lib/utils";

export function PrismFilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
        active
          ? "pk-prism-pill-active"
          : "border border-white/10 bg-white/[0.04] text-white/55 hover:border-white/20 hover:bg-white/[0.07] hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
