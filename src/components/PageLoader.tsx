import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { elementFromPath } from "@/lib/elementTheme";
import { loaderCopyFromIcon, loaderIconFromPath } from "@/lib/loaderIcons";
import { cn } from "@/lib/utils";
import { useLocaleStore } from "@/stores/localeStore";
import { useCloudAccentStore } from "@/stores/cloudAccentStore";
import { isCloudTheme, isWarmGlassTheme, useVisualThemeStore } from "@/stores/visualThemeStore";

type Props = {
  /** full = Suspense entre pages · inline = auth / routes protégées */
  variant?: "full" | "inline";
  className?: string;
};

/** Évite le flash « Studio… » quand le chunk lazy est déjà en cache (< ~220ms). */
const SHOW_CONTENT_MS = 220;

export function PageLoader({ variant = "full", className }: Props) {
  const { pathname } = useLocation();
  const locale = useLocaleStore((s) => s.locale);
  const visualTheme = useVisualThemeStore((s) => s.theme);
  const cloudAccent = useCloudAccentStore((s) => s.accent);
  const cloud = isCloudTheme(visualTheme);
  const warmGlass = isWarmGlassTheme(visualTheme);
  const [showContent, setShowContent] = useState(variant !== "full");

  useEffect(() => {
    if (variant !== "full") {
      setShowContent(true);
      return;
    }
    setShowContent(false);
    const timer = window.setTimeout(() => setShowContent(true), SHOW_CONTENT_MS);
    return () => window.clearTimeout(timer);
  }, [pathname, variant]);

  const icon = loaderIconFromPath(pathname);
  const element = elementFromPath(pathname);
  const { label, sublabel } = loaderCopyFromIcon(icon, locale);

  const node = (
    <div
      className={cn(
        "pk-page-loader",
        variant === "full" && !showContent && "pk-page-loader--boot",
        variant === "inline" && "pk-page-loader--inline",
        cloud && "pk-page-loader--cloud",
        warmGlass && "pk-page-loader--warm",
        !cloud && !warmGlass && "pk-page-loader--prism",
        !cloud && !warmGlass && variant === "full" && !showContent && "pk-page-loader--neutral",
        className,
      )}
      data-pk-cloud-accent={cloud ? cloudAccent : undefined}
    >
      {showContent ? (
        <div className="pk-page-loader__card" role="status" aria-live="polite" aria-label={label}>
          <PkIconLoader
            icon={icon}
            element={element}
            size="md"
            label={label}
            sublabel={variant === "full" ? sublabel : undefined}
            className="pk-page-loader__icon"
          />
          <div className="pk-page-loader__bar" aria-hidden>
            <span className="pk-page-loader__bar-fill" />
          </div>
        </div>
      ) : (
        <span className="sr-only" aria-live="polite">
          {label}
        </span>
      )}
    </div>
  );

  if (variant === "full" && typeof document !== "undefined") {
    return createPortal(node, document.body);
  }

  return node;
}
