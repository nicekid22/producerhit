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

/** Délai court — fond plein écran immédiat, contenu après (évite flash + pop). */
const SHOW_DELAY_MS = 80;

export function PageLoader({ variant = "full", className }: Props) {
  const { pathname } = useLocation();
  const locale = useLocaleStore((s) => s.locale);
  const visualTheme = useVisualThemeStore((s) => s.theme);
  const cloudAccent = useCloudAccentStore((s) => s.accent);
  const cloud = isCloudTheme(visualTheme);
  const warmGlass = isWarmGlassTheme(visualTheme);
  const isFr = locale === "fr";
  const [visible, setVisible] = useState(false);

  const icon = loaderIconFromPath(pathname);
  const element = elementFromPath(pathname);
  const { label, sublabel } = loaderCopyFromIcon(icon, isFr);

  useEffect(() => {
    setVisible(false);
    const showTimer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(showTimer);
  }, [pathname]);

  const node = (
    <div
      className={cn(
        "pk-page-loader",
        variant === "inline" && "pk-page-loader--inline",
        cloud && "pk-page-loader--cloud",
        warmGlass && "pk-page-loader--warm",
        !cloud && !warmGlass && "pk-page-loader--prism",
        !visible && "pk-page-loader--pending",
        className,
      )}
      data-pk-cloud-accent={cloud ? cloudAccent : undefined}
    >
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
    </div>
  );

  if (variant === "full" && typeof document !== "undefined") {
    return createPortal(node, document.body);
  }

  return node;
}
