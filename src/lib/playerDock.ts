/** Routes that show the fixed mobile bottom tab bar (AppShell). */
const MOBILE_BOTTOM_NAV_RE = /^\/(dashboard|library|settings|explore|community|admin\/growth)(\/|$)/;

export function routeHasMobileBottomNav(pathname: string): boolean {
  return MOBILE_BOTTOM_NAV_RE.test(pathname);
}

/** Fallback CSS avant mesure ResizeObserver (PlayerDockBootstrap). */
export const PLAYER_HEIGHT_FALLBACK = "72px";
