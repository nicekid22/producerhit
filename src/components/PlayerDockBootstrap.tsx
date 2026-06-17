import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  MOBILE_BOTTOM_NAV_SELECTOR,
  routeHasMobileBottomNav,
} from "@/lib/playerDock";
import {
  applyMobileNavFallback,
  clearMobileDockVars,
  measureMobileNav,
  measurePlayerDock,
  observeDockTargets,
  scheduleDockMeasure,
} from "@/lib/playerDockMeasure";
import { usePlayerStore } from "@/stores/playerStore";

function syncMobileNavVars(root: HTMLElement) {
  const nav = document.querySelector<HTMLElement>(MOBILE_BOTTOM_NAV_SELECTOR);
  if (nav) {
    measureMobileNav(root);
    return true;
  }
  return false;
}

function clearNavVars(root: HTMLElement) {
  clearMobileDockVars(root);
  root.style.setProperty("--pk-bottom-nav", "0px");
  root.style.setProperty("--pk-mobile-nav-stack", "0px");
  root.style.setProperty("--pk-player-dock-bottom", "0px");
}

/** Syncs player + mobile nav CSS vars from measured layout (no hardcoded overlap). */
export function PlayerDockBootstrap() {
  const { pathname } = useLocation();
  const dockCollapsed = usePlayerStore((s) => s.dockCollapsed);
  const hasPlayer = usePlayerStore((s) => !!s.current);
  const expectsMobileNav = routeHasMobileBottomNav(pathname);

  useEffect(() => {
    const root = document.documentElement;

    const run = () => {
      if (syncMobileNavVars(root)) return;
      if (expectsMobileNav) {
        applyMobileNavFallback(root);
        return;
      }
      clearNavVars(root);
    };

    scheduleDockMeasure(run);

    const nav = document.querySelector<HTMLElement>(MOBILE_BOTTOM_NAV_SELECTOR);
    const ro = nav ? new ResizeObserver(() => scheduleDockMeasure(run)) : null;
    if (nav && ro) ro.observe(nav);

    const mo = observeDockTargets(run);

    window.addEventListener("resize", run);
    window.visualViewport?.addEventListener("resize", run);
    window.visualViewport?.addEventListener("scroll", run);

    return () => {
      ro?.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", run);
      window.visualViewport?.removeEventListener("resize", run);
      window.visualViewport?.removeEventListener("scroll", run);
      clearNavVars(root);
    };
  }, [expectsMobileNav, pathname]);

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
      if (!measurePlayerDock(root)) {
        scheduleDockMeasure(measure);
      }
      syncMobileNavVars(root);
    };

    scheduleDockMeasure(measure);

    const el = document.querySelector<HTMLElement>(".pk-prism-player--dock");
    const ro = el ? new ResizeObserver(() => scheduleDockMeasure(measure)) : null;
    if (el && ro) ro.observe(el);

    const mo = observeDockTargets(measure);

    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("scroll", measure);

    return () => {
      ro?.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("scroll", measure);
      clearPlayer();
    };
  }, [dockCollapsed, hasPlayer, expectsMobileNav, pathname]);

  return null;
}
