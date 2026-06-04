import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { routeHasMobileBottomNav } from "@/lib/playerDock";
import { usePlayerStore } from "@/stores/playerStore";

const PLAYER_DOCK_SELECTOR = ".pk-prism-player--dock";

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

/** Syncs player CSS vars from the fixed dock bar (height + viewport reserve). */
export function PlayerDockBootstrap() {
  const { pathname } = useLocation();
  const dockCollapsed = usePlayerStore((s) => s.dockCollapsed);
  const hasPlayer = usePlayerStore((s) => !!s.current);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--pk-bottom-nav", routeHasMobileBottomNav(pathname) ? "56px" : "0px");
    return () => {
      root.style.removeProperty("--pk-bottom-nav");
    };
  }, [pathname]);

  useLayoutEffect(() => {
    const root = document.documentElement;

    const clear = () => {
      root.style.removeProperty("--pk-player-height");
      root.style.removeProperty("--pk-player-reserve");
      root.removeAttribute("data-pk-player-dock");
    };

    if (!hasPlayer) {
      clear();
      return;
    }

    const measure = () => {
      const el = document.querySelector<HTMLElement>(PLAYER_DOCK_SELECTOR);
      if (!el) {
        clear();
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
      clear();
      return;
    }

    const ro = new ResizeObserver(() => schedulePlayerHeightSync(measure));
    ro.observe(el);
    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      clear();
    };
  }, [dockCollapsed, hasPlayer]);

  return null;
}
