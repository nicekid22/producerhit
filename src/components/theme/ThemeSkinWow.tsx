import { getThemeSkinWowCopy } from "@/lib/themeSkinWowCopy";
import { cn } from "@/lib/utils";
import { Gem, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Burst = {
  key: number;
  theme: "prism" | "warm-glass";
  isFr: boolean;
};

const WOW_MS = 2400;

let pushBurst: ((theme: "prism" | "warm-glass", isFr: boolean) => void) | null = null;

/** Carte gaming discrète — activation skin Prism ou Warm. */
export function showThemeSkinWow(theme: "prism" | "warm-glass", isFr: boolean) {
  pushBurst?.(theme, isFr);
}

export function ThemeSkinWowHost() {
  const [burst, setBurst] = useState<Burst | null>(null);

  useEffect(() => {
    pushBurst = (theme, isFr) => {
      const key = Date.now();
      setBurst({ key, theme, isFr });
      window.setTimeout(() => {
        setBurst((current) => (current?.key === key ? null : current));
      }, WOW_MS);
    };
    return () => {
      pushBurst = null;
    };
  }, []);

  if (!burst || typeof document === "undefined") return null;

  const copy = getThemeSkinWowCopy(burst.theme, burst.isFr);
  const isPrism = burst.theme === "prism";

  return createPortal(
    <div
      key={burst.key}
      className={cn("pk-theme-skin-wow", isPrism ? "pk-theme-skin-wow--prism" : "pk-theme-skin-wow--warm")}
      data-pk-theme-skin={burst.theme}
      role="status"
      aria-live="polite"
    >
      <div className="pk-theme-skin-wow__backdrop" aria-hidden />
      <div className="pk-theme-skin-wow__panel">
        <span className="pk-theme-skin-wow__shine" aria-hidden />
        <span className="pk-theme-skin-wow__ring" aria-hidden />
        {isPrism ? <span className="pk-theme-skin-wow__facets" aria-hidden /> : <span className="pk-theme-skin-wow__heat" aria-hidden />}
        <span className="pk-theme-skin-wow__icon-wrap">
          {isPrism ? (
            <Gem className="pk-theme-skin-wow__icon" strokeWidth={2} aria-hidden />
          ) : (
            <Sun className="pk-theme-skin-wow__icon" strokeWidth={2} aria-hidden />
          )}
        </span>
        <p className="pk-theme-skin-wow__label">{copy.label}</p>
        <p className="pk-theme-skin-wow__tag">{copy.tag}</p>
        <p className="pk-theme-skin-wow__moment">{copy.moment}</p>
      </div>
    </div>,
    document.body,
  );
}
