import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  MOBILE_BOTTOM_NAV_SELECTOR,
  MOBILE_NAV_HEIGHT_FALLBACK,
  PLAYER_DOCK_SELECTOR,
  PLAYER_NAV_GAP_PX,
  routeHasMobileBottomNav,
} from "@/lib/playerDock";
import { usePlayerStore } from "@/stores/playerStore";

function schedulePlayerHeightSync(run: () => void) {
  run();
  requestAnimationFrame(() => {
    run();
    requestAnimationFrame(run);
  });
  window.setTimeout(run, 0);
  window.setTimeout(run, 80);
  window.setTimeout(run, 200);
}

function clearMobileDockVars(root: HTMLElement) {
  root.style.removeProperty("--pk-bottom-nav");
  root.style.removeProperty("--pk-mobile-nav-stack");
  root.style.removeProperty("--pk-player-dock-bottom");
}

function measureMobileNav(root: HTMLElement) {
  const nav = document.querySelector<HTMLElement>(MOBILE_BOTTOM_NAV_SELECTOR);
  if (!nav) {
    const fallback = parseInt(MOBILE_NAV_HEIGHT_FALLBACK, 10);
    root.style.setProperty("--pk-bottom-nav", MOBILE_NAV_HEIGHT_FALLBACK);
    root.style.setProperty("--pk-mobile-nav-stack", MOBILE_NAV_HEIGHT_FALLBACK);
    root.style.setProperty("--pk-player-dock-bottom", `${fallback + PLAYER_NAV_GAP_PX}px`);
    return null;
  }

  const rect = nav.getBoundingClientRect();
  if (rect.height < 1) {
    const fallback = parseInt(MOBILE_NAV_HEIGHT_FALLBACK, 10);
    root.style.setProperty("--pk-bottom-nav", MOBILE_NAV_HEIGHT_FALLBACK);
    root.style.setProperty("--pk-mobile-nav-stack", MOBILE_NAV_HEIGHT_FALLBACK);
    root.style.setProperty("--pk-player-dock-bottom", `${fallback + PLAYER_NAV_GAP_PX}px`);
    return null;
  }

  const height = Math.max(1, Math.ceil(rect.height));
  const stack = Math.max(0, Math.ceil(window.innerHeight - rect.top));
  root.style.setProperty("--pk-bottom-nav", `${height}px`);
  root.style.setProperty("--pk-mobile-nav-stack", `${stack}px`);
  root.style.setProperty("--pk-player-dock-bottom", `${stack + PLAYER_NAV_GAP_PX}px`);
  return nav;
}

/** Syncs player + mobile nav CSS vars from measured layout (no hardcoded overlap). */
export function PlayerDockBootstrap() {
  const { pathname } = useLocation();
  const dockCollapsed = usePlayerStore((s) => s.dockCollapsed);
  const hasPlayer = usePlayerStore((s) => !!s.current);
  const showMobileNav = routeHasMobileBottomNav(pathname);

  useEffect(() => {
    const root = document.documentElement;
    if (!showMobileNav) {
      clearMobileDockVars(root);
      root.style.setProperty("--pk-bottom-nav", "0px");
      root.style.setProperty("--pk-mobile-nav-stack", "0px");
      root.style.setProperty("--pk-player-dock-bottom", "0px");
      return () => {
        clearMobileDockVars(root);
      };
    }

    const run = () => measureMobileNav(root);

    schedulePlayerHeightSync(run);

    const nav = document.querySelector<HTMLElement>(MOBILE_BOTTOM_NAV_SELECTOR);
    const ro = nav ? new ResizeObserver(() => schedulePlayerHeightSync(run)) : null;
    if (nav && ro) ro.observe(nav);

    window.addEventListener("resize", run);
    window.visualViewport?.addEventListener("resize", run);
    window.visualViewport?.addEventListener("scroll", run);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", run);
      window.visualViewport?.removeEventListener("resize", run);
      window.visualViewport?.removeEventListener("scroll", run);
      clearMobileDockVars(root);
    };
  }, [showMobileNav, pathname]);

  useLayoutEffect(() => {
    const root = document.documentElement;

    const clearPlayer = () => {
      root.style.removeProperty("--pk-player-height");
      root.style.removeProperty("--pk-player-reserve");
      root.removeAttribute("data-pk-player-dock");
    };

    if (!hasPlayer) {
      clearPlayer();
      return;
    }

    const measure = () => {
      const el = document.querySelector<HTMLElement>(PLAYER_DOCK_SELECTOR);
      if (!el) {
        clearPlayer();
        return;
      }
      const rect = el.getBoundingClientRect();
      const h = Math.max(1, Math.ceil(rect.height));
      const reserve = Math.max(1, Math.ceil(window.innerHeight - rect.top));
      root.style.setProperty("--pk-player-height", `${h}px`);
      root.style.setProperty("--pk-player-reserve", `${reserve}px`);
      root.setAttribute(
        "data-pk-player-dock",
        el.classList.contains("pk-prism-player--collapsed") ? "collapsed" : "expanded",
      );
    };

    schedulePlayerHeightSync(measure);

    const el = document.querySelector<HTMLElement>(PLAYER_DOCK_SELECTOR);
    if (!el) {
      clearPlayer();
      return;
    }

    const ro = new ResizeObserver(() => schedulePlayerHeightSync(measure));
    ro.observe(el);
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("scroll", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("scroll", measure);
      clearPlayer();
    };
  }, [dockCollapsed, hasPlayer, showMobileNav]);

  return null;
}
