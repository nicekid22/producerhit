import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { routeHasMobileBottomNav } from "@/lib/playerDock";
import {
  clearMobileDockVars,
  measureMobileNav,
  measurePlayerDock,
  observeDockTargets,
  scheduleDockMeasure,
} from "@/lib/playerDockMeasure";
import { usePlayerStore } from "@/stores/playerStore";

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
    scheduleDockMeasure(run);

    const nav = document.querySelector<HTMLElement>(".pk-app-shell-mobile-nav");
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
      if (!measurePlayerDock(root)) {
        scheduleDockMeasure(measure);
      }
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
  }, [dockCollapsed, hasPlayer, showMobileNav]);

  return null;
}
