export type BootVisualTheme = "prism" | "warm-glass" | "cloud";

export type BootCloudAccent = "transparent" | "green" | "red" | "blue";

const THEME_KEY = "producerhit_visual_theme_v1";
const ACCENT_KEY = "producerhit_cloud_accent_v1";

export const BOOT_SURFACE: {
  prism: string;
  "warm-glass": string;
  cloud: Record<BootCloudAccent, string>;
} = {
  prism: "#121214",
  "warm-glass": "#1a1210",
  cloud: {
    transparent: "#e8d8f0",
    green: "#dcecc8",
    red: "#f0d8cc",
    blue: "#d0e8f8",
  },
};

export function readStoredBootTheme(): BootVisualTheme {
  if (typeof window === "undefined") return "prism";
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "cloud" || stored === "warm-glass" || stored === "prism") return stored;
  } catch {
    /* ignore */
  }
  return "prism";
}

export function readStoredBootCloudAccent(): BootCloudAccent {
  if (typeof window === "undefined") return "transparent";
  try {
    const stored = window.localStorage.getItem(ACCENT_KEY);
    if (stored === "green" || stored === "red" || stored === "blue" || stored === "transparent") {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return "transparent";
}

export function resolveBootSurface(theme: BootVisualTheme, accent: BootCloudAccent): string {
  if (theme === "cloud") return BOOT_SURFACE.cloud[accent] ?? BOOT_SURFACE.cloud.transparent;
  return BOOT_SURFACE[theme];
}

export function bootLoaderClassName(theme: BootVisualTheme): string {
  if (theme === "cloud") return "pk-page-loader pk-page-loader--boot pk-page-loader--cloud";
  if (theme === "warm-glass") return "pk-page-loader pk-page-loader--boot pk-page-loader--warm";
  return "pk-page-loader pk-page-loader--boot pk-page-loader--neutral";
}
