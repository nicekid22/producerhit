/** Routes that show the fixed mobile bottom tab bar (AppShell). */
const MOBILE_BOTTOM_NAV_RE =
  /^\/(dashboard|library|settings|explore|community|voice-studio|sample-lab|admin\/growth)(\/|$)/;

export function routeHasMobileBottomNav(pathname: string): boolean {
  return MOBILE_BOTTOM_NAV_RE.test(pathname);
}

export const MOBILE_BOTTOM_NAV_SELECTOR = ".pk-app-shell-mobile-nav";
export const PLAYER_DOCK_SELECTOR = ".pk-prism-player--dock";

/** Espace visuel entre lecteur flottant et barre nav (mobile). */
export const PLAYER_NAV_GAP_PX = 8;

/** Fallback CSS avant mesure ResizeObserver (PlayerDockBootstrap). */
export const PLAYER_HEIGHT_FALLBACK = "72px";

export const MOBILE_NAV_HEIGHT_FALLBACK = "62px";

/** Nav flottante + safe-area + gap — avant mesure DOM (Cloud / Warm / Prism). */
export const MOBILE_PLAYER_DOCK_BOTTOM_FALLBACK = "80px";
