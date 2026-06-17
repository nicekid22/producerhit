import { getThemeRoastCopy, THEME_ROAST_SEEN_KEY } from "@/lib/themeRoastCopy";
import { cn } from "@/lib/utils";
import { useCloudAccentStore } from "@/stores/cloudAccentStore";
import { useLocaleStore } from "@/stores/localeStore";
import { isCloudTheme, useVisualThemeStore, type VisualTheme } from "@/stores/visualThemeStore";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const ROAST_MS = 5200;

type RoastBurst = {
  key: number;
  to: VisualTheme;
};

/** Popup taquin — une seule fois, au premier changement de thème visuel. */
export function ThemeRoastPopup() {
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const theme = useVisualThemeStore((s) => s.theme);
  const cloudAccent = useCloudAccentStore((s) => s.accent);
  const prevTheme = useRef(theme);
  const skipNext = useRef(true);
  const [burst, setBurst] = useState<RoastBurst | null>(null);

  const dismiss = useCallback((key?: number) => {
    setBurst((current) => {
      if (key != null && current?.key !== key) return current;
      return null;
    });
  }, []);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      prevTheme.current = theme;
      return;
    }

    if (prevTheme.current === theme) return;
    prevTheme.current = theme;

    if (typeof window !== "undefined" && window.localStorage.getItem(THEME_ROAST_SEEN_KEY)) return;
    if (typeof window !== "undefined") window.localStorage.setItem(THEME_ROAST_SEEN_KEY, "1");

    const key = Date.now();
    setBurst({ key, to: theme });

    const timer = window.setTimeout(() => dismiss(key), ROAST_MS);
    return () => window.clearTimeout(timer);
  }, [theme, dismiss]);

  if (!burst || typeof document === "undefined") return null;

  const copy = getThemeRoastCopy(burst.to, isFr);
  const cloud = isCloudTheme(burst.to);

  return createPortal(
    <div
      key={burst.key}
      className={cn("pk-theme-roast", cloud && "pk-theme-roast--cloud")}
      data-pk-cloud-accent={cloud ? cloudAccent : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`pk-theme-roast-title-${burst.key}`}
      aria-describedby={`pk-theme-roast-body-${burst.key}`}
    >
      <button
        type="button"
        className="pk-theme-roast__backdrop"
        aria-label={isFr ? "Fermer" : "Close"}
        onClick={() => dismiss(burst.key)}
      />
      <div className="pk-theme-roast__panel">
        <span className="pk-theme-roast__emoji" aria-hidden>
          {copy.emoji}
        </span>
        <p id={`pk-theme-roast-title-${burst.key}`} className="pk-theme-roast__title">
          {copy.title}
        </p>
        <p id={`pk-theme-roast-body-${burst.key}`} className="pk-theme-roast__body">
          {copy.body}
        </p>
        <p className="pk-theme-roast__punchline">{copy.punchline}</p>
        <button type="button" className="pk-theme-roast__cta" onClick={() => dismiss(burst.key)}>
          {copy.cta}
        </button>
      </div>
    </div>,
    document.body,
  );
}
