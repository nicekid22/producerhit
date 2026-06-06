import type { ReactNode } from "react";
import { WarmGlassBackdrop } from "@/components/WarmGlassBackdrop";
import { BackdropTextureVeil } from "@/components/BackdropTextureVeil";
import { cn } from "@/lib/utils";
import { useVisualThemeStore, isWarmGlassTheme } from "@/stores/visualThemeStore";

type Props = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/** Enveloppe commune blog / tarifs / SEO / légal — mesh Prism + Warm Glass + backdrop. */
export function MarketingPageShell({ children, className, contentClassName }: Props) {
  const warmGlass = isWarmGlassTheme(useVisualThemeStore((s) => s.theme));

  return (
    <div
      className={cn(
        "pk-marketing-page relative min-h-screen text-white pk-prism-stage",
        warmGlass && "pk-warm-glass-stage",
        className,
      )}
    >
      {warmGlass ? (
        <div className="pk-warm-backdrop pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
          <WarmGlassBackdrop />
          <BackdropTextureVeil variant="marketing" />
        </div>
      ) : (
        <BackdropTextureVeil variant="landing" />
      )}
      <div className={cn("relative z-[1]", contentClassName)}>{children}</div>
    </div>
  );
}
