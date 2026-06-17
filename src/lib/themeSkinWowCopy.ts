import type { VisualTheme } from "@/stores/visualThemeStore";

export type ThemeSkinWowCopy = {
  label: string;
  tag: string;
  moment: string;
};

export function getThemeSkinWowCopy(theme: "prism" | "warm-glass", isFr: boolean): ThemeSkinWowCopy {
  if (isFr) {
    if (theme === "prism") {
      return {
        label: "Prism",
        tag: "Skin activé",
        moment: "Reflets diamant — violet, rose, bleu.",
      };
    }
    return {
      label: "Warm Glass",
      tag: "Skin activé",
      moment: "Été doré — chaleur et lumière.",
    };
  }

  if (theme === "prism") {
    return {
      label: "Prism",
      tag: "Skin set",
      moment: "Diamond shimmer — violet, rose, blue.",
    };
  }
  return {
    label: "Warm Glass",
    tag: "Skin set",
    moment: "Golden summer — warmth and glow.",
  };
}

export function isThemeSkinWowTarget(theme: VisualTheme): theme is "prism" | "warm-glass" {
  return theme === "prism" || theme === "warm-glass";
}
