import type { CloudAccent } from "@/stores/cloudAccentStore";

const MOODBOARD_BASE = "/img/new cloud theme v.2 moodboard";

function moodboardFile(name: string): string {
  return `${MOODBOARD_BASE}/${encodeURIComponent(name)}`;
}

/** Photos floutées du moodboard — une par accent Cloud. */
export const CLOUD_BG_PHOTOS: Record<CloudAccent, string> = {
  transparent: moodboardFile("Capture d'écran 2026-06-16 195426.png"),
  green: moodboardFile("Capture d'écran 2026-06-16 195539.png"),
  red: moodboardFile("Capture d'écran 2026-06-16 195210.png"),
  blue: moodboardFile("Capture d'écran 2026-06-16 195501.png"),
};

export function cloudBgPhotoCssUrl(accent: CloudAccent): string {
  return `url("${CLOUD_BG_PHOTOS[accent]}")`;
}

export const CLOUD_FAVICONS: Record<CloudAccent, string> = {
  transparent: "/favicon-cloud-transparent.svg",
  green: "/favicon-cloud-green.svg",
  red: "/favicon-cloud-red.svg",
  blue: "/favicon-cloud-blue.svg",
};

/** PNG 32×32 — onglets / fallback navigateurs */
export const CLOUD_FAVICON_PNG: Record<CloudAccent, string> = {
  transparent: "/favicon-cloud-transparent-32.png",
  green: "/favicon-cloud-green-32.png",
  red: "/favicon-cloud-red-32.png",
  blue: "/favicon-cloud-blue-32.png",
};

/** iOS écran d’accueil */
export const CLOUD_APPLE_TOUCH_ICONS: Record<CloudAccent, string> = {
  transparent: "/apple-touch-icon-cloud-transparent.png",
  green: "/apple-touch-icon-cloud-green.png",
  red: "/apple-touch-icon-cloud-red.png",
  blue: "/apple-touch-icon-cloud-blue.png",
};

/** meta theme-color · barre mobile — teintes mesh Cloud (pas le fond sombre legacy) */
export const CLOUD_THEME_COLORS: Record<CloudAccent, string> = {
  transparent: "#e8d8f0",
  green: "#dcecc8",
  red: "#f0d8cc",
  blue: "#d0e8f8",
};
