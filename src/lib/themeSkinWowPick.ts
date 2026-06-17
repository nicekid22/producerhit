import { showThemeSkinWow } from "@/components/theme/ThemeSkinWow";
import { playThemeSkinSfx } from "@/lib/delight/themeSkinSfx";
import type { VisualTheme } from "@/stores/visualThemeStore";

const FLASH_CLASS = "pk-theme-skin-flash";
const FLASH_MS = 950;

export function flashThemeSkin(theme: "prism" | "warm-glass") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-pk-theme-skin-flash", theme);
  root.classList.add(FLASH_CLASS);
  window.setTimeout(() => {
    root.classList.remove(FLASH_CLASS);
    root.removeAttribute("data-pk-theme-skin-flash");
  }, FLASH_MS);
}

export function pickThemeSkinWow(opts: {
  theme: VisualTheme;
  isFr?: boolean;
  showWow?: boolean;
  playSfx?: boolean;
  flash?: boolean;
}) {
  const { theme, isFr = true, showWow = true, playSfx = true, flash = true } = opts;
  if (theme !== "prism" && theme !== "warm-glass") return;

  if (flash) flashThemeSkin(theme);
  if (playSfx) playThemeSkinSfx(theme);
  if (showWow) showThemeSkinWow(theme, isFr);
}
