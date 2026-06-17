import type { ReactNode } from "react";
import { WarmGlassBackdrop } from "@/components/WarmGlassBackdrop";
import { CloudBackdrop } from "@/components/CloudBackdrop";
import { BackdropTextureVeil } from "@/components/BackdropTextureVeil";
import { cn } from "@/lib/utils";
import { useCloudAccentStore } from "@/stores/cloudAccentStore";
import { useVisualThemeStore, isCloudTheme, isWarmGlassTheme } from "@/stores/visualThemeStore";

type Props = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/** Enveloppe commune blog / tarifs / SEO / légal — mesh Prism + Warm Glass + backdrop. */
export function MarketingPageShell({ children, className, contentClassName }: Props) {
  const warmGlass = isWarmGlassTheme(useVisualThemeStore((s) => s.theme));
  const cloud = isCloudTheme(useVisualThemeStore((s) => s.theme));
  const cloudAccent = useCloudAccentStore((s) => s.accent);

  return (
    <div
      className={cn(
        "pk-marketing-page pk-apple-app relative min-h-screen text-white pk-prism-stage",
        warmGlass && "pk-warm-glass-stage",
        cloud && "pk-cloud-stage",
        className,
      )}
      data-pk-cloud-accent={cloud ? cloudAccent : undefined}
    >
      {warmGlass ? (
        <div className="pk-warm-backdrop pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
          <WarmGlassBackdrop />
          <BackdropTextureVeil variant="marketing" />
        </div>
      ) : cloud ? (
        <div className="pk-warm-backdrop pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
          <CloudBackdrop />
        </div>
      ) : (
        <BackdropTextureVeil variant="landing" />
      )}
      <div className={cn("relative z-[1]", contentClassName)}>{children}</div>
    </div>
  );
}
