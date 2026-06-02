import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PLAYER_HEIGHT_COLLAPSED, routeHasMobileBottomNav } from "@/lib/playerDock";
import { usePlayerStore } from "@/stores/playerStore";

/** Syncs dock CSS vars on :root for fixed player + shell padding. */
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

  useEffect(() => {
    const root = document.documentElement;
    if (!hasPlayer || !dockCollapsed) {
      root.style.removeProperty("--pk-player-height");
      return;
    }
    root.style.setProperty("--pk-player-height", PLAYER_HEIGHT_COLLAPSED);
    return () => {
      root.style.removeProperty("--pk-player-height");
    };
  }, [dockCollapsed, hasPlayer]);

  return null;
}
