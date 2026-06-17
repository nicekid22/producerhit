import {
  CLOUD_APPLE_TOUCH_ICONS,
  CLOUD_FAVICON_PNG,
  CLOUD_FAVICONS,
  CLOUD_THEME_COLORS,
} from "@/lib/cloudThemeAssets";
import type { CloudAccent } from "@/stores/cloudAccentStore";

const WARM_GLASS_THEME_COLOR = "#963848";
const WARM_GLASS_THEME_COLOR_MARKETING = "#c89838";
const PRISM_THEME_COLOR = "#0c0820";

function setMetaContent(name: string, content: string) {
  const meta = document.querySelector(`meta[name="${name}"]`);
  if (meta) meta.setAttribute("content", content);
}

function setLinkHref(selector: string, href: string) {
  const link = document.querySelector(selector);
  if (link) link.setAttribute("href", href);
}

export type BrandChromeOptions = {
  cloud: boolean;
  warmGlass: boolean;
  cloudAccent: CloudAccent;
  marketing: boolean;
};

/** Favicon, theme-color, apple-touch, color-scheme — alignés sur le thème actif. */
export function applyBrandChrome({ cloud, warmGlass, cloudAccent, marketing }: BrandChromeOptions) {
  const root = document.documentElement;

  if (cloud) {
    const themeColor = CLOUD_THEME_COLORS[cloudAccent];
    setMetaContent("theme-color", themeColor);
    setMetaContent("msapplication-TileColor", themeColor);
    setMetaContent("color-scheme", "light");
    setMetaContent("apple-mobile-web-app-status-bar-style", "default");
    root.style.colorScheme = "light";

    setLinkHref('link[rel="icon"][type="image/svg+xml"]', CLOUD_FAVICONS[cloudAccent]);
    setLinkHref('link[rel="icon"][type="image/png"]', CLOUD_FAVICON_PNG[cloudAccent]);
    setLinkHref('link[rel="apple-touch-icon"]', CLOUD_APPLE_TOUCH_ICONS[cloudAccent]);
    return;
  }

  if (warmGlass) {
    const themeColor = marketing ? WARM_GLASS_THEME_COLOR_MARKETING : WARM_GLASS_THEME_COLOR;
    setMetaContent("theme-color", themeColor);
    setMetaContent("msapplication-TileColor", themeColor);
    setMetaContent("color-scheme", "dark light");
    setMetaContent("apple-mobile-web-app-status-bar-style", "black-translucent");
    root.style.colorScheme = "dark";

    setLinkHref('link[rel="icon"][type="image/svg+xml"]', "/favicon-warm.svg");
    setLinkHref('link[rel="icon"][type="image/png"]', "/favicon-warm-32.png");
    setLinkHref('link[rel="apple-touch-icon"]', "/apple-touch-icon-warm.png");
    return;
  }

  setMetaContent("theme-color", PRISM_THEME_COLOR);
  setMetaContent("msapplication-TileColor", PRISM_THEME_COLOR);
  setMetaContent("color-scheme", "dark light");
  setMetaContent("apple-mobile-web-app-status-bar-style", "black-translucent");
  root.style.colorScheme = "dark";

  setLinkHref('link[rel="icon"][type="image/svg+xml"]', "/favicon.svg");
  setLinkHref('link[rel="icon"][type="image/png"]', "/favicon-32.png");
  setLinkHref('link[rel="apple-touch-icon"]', "/apple-touch-icon.png");
}

export function resetBrandChrome() {
  applyBrandChrome({
    cloud: false,
    warmGlass: false,
    cloudAccent: "transparent",
    marketing: false,
  });
}
