import {
  MOBILE_BOTTOM_NAV_SELECTOR,
  MOBILE_NAV_HEIGHT_FALLBACK,
  MOBILE_PLAYER_DOCK_BOTTOM_FALLBACK,
  PLAYER_DOCK_SELECTOR,
  PLAYER_NAV_GAP_PX,
} from "@/lib/playerDock";

export function scheduleDockMeasure(run: () => void) {
  run();
  requestAnimationFrame(() => {
    run();
    requestAnimationFrame(run);
  });
  window.setTimeout(run, 0);
  window.setTimeout(run, 80);
  window.setTimeout(run, 200);
  window.setTimeout(run, 480);
}

export function clearMobileDockVars(root: HTMLElement) {
  root.style.removeProperty("--pk-bottom-nav");
  root.style.removeProperty("--pk-mobile-nav-stack");
  root.style.removeProperty("--pk-player-dock-bottom");
}

export function applyMobileNavFallback(root: HTMLElement) {
  const fallback = parseInt(MOBILE_NAV_HEIGHT_FALLBACK, 10);
  const dockBottom = parseInt(MOBILE_PLAYER_DOCK_BOTTOM_FALLBACK, 10);
  root.style.setProperty("--pk-bottom-nav", MOBILE_NAV_HEIGHT_FALLBACK);
  root.style.setProperty("--pk-mobile-nav-stack", MOBILE_NAV_HEIGHT_FALLBACK);
  root.style.setProperty("--pk-player-dock-bottom", `${dockBottom}px`);
  return fallback;
}

export function measureMobileNav(root: HTMLElement) {
  const nav = document.querySelector<HTMLElement>(MOBILE_BOTTOM_NAV_SELECTOR);
  if (!nav) {
    applyMobileNavFallback(root);
    return null;
  }

  const rect = nav.getBoundingClientRect();
  if (rect.height < 1) {
    applyMobileNavFallback(root);
    return null;
  }

  const height = Math.max(1, Math.ceil(rect.height));
  const stack = Math.max(0, Math.ceil(window.innerHeight - rect.top));
  const dockBottom = Math.max(stack + PLAYER_NAV_GAP_PX, parseInt(MOBILE_PLAYER_DOCK_BOTTOM_FALLBACK, 10));
  root.style.setProperty("--pk-bottom-nav", `${height}px`);
  root.style.setProperty("--pk-mobile-nav-stack", `${stack}px`);
  root.style.setProperty("--pk-player-dock-bottom", `${dockBottom}px`);
  return nav;
}

export function measurePlayerDock(root: HTMLElement) {
  const el = document.querySelector<HTMLElement>(PLAYER_DOCK_SELECTOR);
  if (!el) {
    root.style.removeProperty("--pk-player-height");
    root.style.removeProperty("--pk-player-reserve");
    root.removeAttribute("data-pk-player-dock");
    return false;
  }

  const rect = el.getBoundingClientRect();
  const h = Math.max(1, Math.ceil(rect.height));
  const reserve = Math.max(1, Math.ceil(window.innerHeight - rect.top));
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  root.style.setProperty("--pk-player-height", `${h}px`);
  root.style.setProperty("--pk-player-reserve", `${reserve}px`);
  root.setAttribute(
    "data-pk-player-dock",
    isMobile || el.classList.contains("pk-prism-player--collapsed") ? "collapsed" : "expanded",
  );
  return true;
}

export function observeDockTargets(onChange: () => void) {
  const root = document.getElementById("root");
  if (!root) return { disconnect: () => undefined };

  const observer = new MutationObserver(() => scheduleDockMeasure(onChange));
  observer.observe(root, { childList: true, subtree: true });
  return observer;
}
