/**
 * Utilitaires performance — différer travail non critique (INP / LCP).
 */

import { preloadCloudThemeIfNeeded, preloadWarmGlassThemeIfNeeded } from "@/lib/themeStyles";

export function deferUntilIdle(fn: () => void, timeoutMs = 3500): void {
  if (typeof window === "undefined") return;
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };
  if (typeof w.requestIdleCallback === "function") {
    w.requestIdleCallback(fn, { timeout: timeoutMs });
    return;
  }
  window.setTimeout(fn, Math.min(timeoutMs, 1200));
}

export function deferUntilFirstInteraction(fn: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  let ran = false;
  const run = () => {
    if (ran) return;
    ran = true;
    cleanup();
    fn();
  };

  const opts: AddEventListenerOptions = { passive: true, once: true };
  window.addEventListener("pointerdown", run, opts);
  window.addEventListener("keydown", run, opts);
  window.addEventListener("scroll", run, opts);
  window.addEventListener("touchstart", run, opts);

  const fallback = window.setTimeout(run, 5000);

  const cleanup = () => {
    window.clearTimeout(fallback);
    window.removeEventListener("pointerdown", run);
    window.removeEventListener("keydown", run);
    window.removeEventListener("scroll", run);
    window.removeEventListener("touchstart", run);
  };

  return cleanup;
}

/** Charge CSS route-specific sans bloquer le first paint. */
const cssLoaded = new Map<string, Promise<void>>();

export function loadRouteCss(key: string, loader: () => Promise<unknown>): Promise<void> {
  const existing = cssLoaded.get(key);
  if (existing) return existing;
  const promise = loader().then(() => undefined);
  cssLoaded.set(key, promise);
  return promise;
}

export function loadMarketingCss(): Promise<void> {
  return loadRouteCss("marketing", () =>
    Promise.all([
      import("@/styles/launch-offer.css"),
      import("@/styles/landing-pricing-teaser.css"),
      import("@/styles/landing-cloud-moods.css"),
      import("@/styles/landing-hero-dream.css"),
      import("@/styles/landing-mood-wow.css"),
      import("@/styles/landing-footer-v2.css"),
      import("@/styles/cro-trust.css"),
      import("@/styles/landing-free-shimmer.css"),
      import("@/styles/landing-mobile-v2.css"),
      import("@/styles/landing-apple-theme-tokens.css"),
      import("@/styles/landing-mobile-audio-cards.css"),
      import("@/styles/landing-mobile-apple-restore.css"),
      import("@/styles/landing-header-cta.css"),
      import("@/styles/landing-apple-below-fold.css"),
    ]).then(() => undefined),
  );
}

export function loadDashboardCss(): Promise<void> {
  return loadRouteCss("dashboard", () =>
    Promise.all([
      import("@/styles/dashboard-idea-prompt.css"),
      import("@/styles/random-prompt-dice.css"),
      import("@/styles/gen-loading-theme.css"),
      import("@/styles/prism-dashboard-pills.css"),
    ]).then(() => undefined),
  );
}

export function loadLibraryCss(): Promise<void> {
  return loadRouteCss("library", () =>
    Promise.all([
      import("@/styles/library-cozy.css"),
      import("@/styles/library-collection-art.css"),
      import("@/styles/library-theme-harmony.css"),
      import("@/styles/loop-details-sheet.css"),
    ]).then(() => undefined),
  );
}

export function loadCommunityCss(): Promise<void> {
  return loadRouteCss("community", () => import("@/styles/community-flux.css").then(() => undefined));
}

export function loadDistributionCss(): Promise<void> {
  return loadRouteCss("distribution", () =>
    Promise.all([
      import("@/styles/distribution-studio.css"),
      import("@/styles/distribution-studio-theme-harmony.css"),
      import("@/styles/distribution-academy.css"),
      import("@/styles/distribution-academy-theme-harmony.css"),
    ]).then(() => undefined),
  );
}

export function loadAppShellCss(): Promise<void> {
  return loadRouteCss("app-shell", () =>
    Promise.all([
      import("@/styles/brand-logo.css"),
      import("@/styles/page-loader-theme.css"),
      import("@/styles/theme-skin-wow.css"),
      import("@/styles/apple-theme-tokens.css"),
      import("@/styles/apple-app-shell.css"),
      import("@/styles/header-chrome.css"),
      import("@/styles/sidebar-rail.css"),
      import("@/styles/mobile-dock-harmony.css"),
      import("@/styles/workspace-header-layout.css"),
      import("@/styles/theme-roast-popup.css"),
      import("@/styles/perf-mobile-gpu.css"),
    ]).then(() => undefined),
  );
}

export function loadSharedUiCss(): Promise<void> {
  return loadRouteCss("shared-ui", () =>
    Promise.all([
      import("@/styles/dropdown-theme.css"),
      import("@/styles/theme-overlays-harmony.css"),
    ]).then(() => undefined),
  );
}

/** CSS shell non bloquant pour le first paint (LCP). */
export function loadShellDeferredCss(): Promise<void> {
  return loadRouteCss("shell-deferred", () =>
    Promise.all([
      import("@/styles/cover-surface.css"),
      import("@/styles/site-texture-veil.css"),
      import("@/styles/paywall-modal.css"),
      import("@/styles/toast-theme.css"),
    ]).then(() => undefined),
  );
}

/** Précharge les thèmes visuels après le first paint (évite ~140–206 KB CSS en chemin critique). */
export function preloadVisualThemesIfNeeded(): void {
  preloadWarmGlassThemeIfNeeded();
  preloadCloudThemeIfNeeded();
}
