import { CLOUD_THEME_ENABLED, WARM_GLASS_THEME_DEFAULT } from "@/lib/featureFlags";

const loaded = new Map<string, Promise<void>>();

function loadOnce(key: string, loader: () => Promise<unknown>): Promise<void> {
  const existing = loaded.get(key);
  if (existing) return existing;
  const promise = loader().then(() => undefined);
  loaded.set(key, promise);
  return promise;
}

/** Charge warm-glass-theme.css une seule fois (Vite injecte le <link>). */
export function ensureWarmGlassThemeStyles(): Promise<void> {
  return loadOnce("warm-glass", () => import("@/styles/warm-glass-theme.css"));
}

/** Charge cloud-theme.css une seule fois (Vite injecte le <link>). */
export function ensureCloudThemeStyles(): Promise<void> {
  return loadOnce("cloud", () => import("@/styles/cloud-theme.css"));
}

/** Styles mobile landing — uniquement sur la page d'accueil. */
export function ensureLandingMobileStyles(): Promise<void> {
  return loadOnce("landing-mobile", () => import("@/styles/landing-mobile-v2.css"));
}

/** Précharge le thème warm glass avant le premier paint si l'utilisateur l'a déjà choisi. */
export function preloadWarmGlassThemeIfNeeded(): void {
  if (typeof window === "undefined") return;
  const stored = window.localStorage.getItem("producerhit_visual_theme_v1");
  const wantWarm = stored === "warm-glass" || (stored !== "prism" && stored !== "cloud" && WARM_GLASS_THEME_DEFAULT);
  if (wantWarm) void ensureWarmGlassThemeStyles();
}

/** Précharge le thème Cloud si déjà choisi ou preview active. */
export function preloadCloudThemeIfNeeded(): void {
  if (typeof window === "undefined") return;
  const stored = window.localStorage.getItem("producerhit_visual_theme_v1");
  if (stored === "cloud" || CLOUD_THEME_ENABLED) void ensureCloudThemeStyles();
}
