import { pickThemeSkinWow } from "@/lib/themeSkinWowPick";
import { useLocaleStore } from "@/stores/localeStore";
import { useVisualThemeStore } from "@/stores/visualThemeStore";
import { useEffect, useRef } from "react";

/** Déclenche la carte gaming + SFX quand l’utilisateur passe à Prism ou Warm. */
export function ThemeSkinWowBridge() {
  const locale = useLocaleStore((s) => s.locale);
  const theme = useVisualThemeStore((s) => s.theme);
  const prevTheme = useRef(theme);
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      prevTheme.current = theme;
      return;
    }
    if (prevTheme.current === theme) return;
    prevTheme.current = theme;

    pickThemeSkinWow({
      theme,
      isFr: locale === "fr",
      showWow: true,
      playSfx: true,
      flash: true,
    });
  }, [theme, locale]);

  return null;
}
