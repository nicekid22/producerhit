import { useEffect } from "react";
import {
  loadAppShellCss,
  loadShellDeferredCss,
  preloadVisualThemesIfNeeded,
} from "@/lib/perf/defer";

/** CSS shell + thèmes — chargés immédiatement (le splash screen masque le temps de chargement). */
export function ShellPerfBootstrap() {
  useEffect(() => {
    void loadShellDeferredCss();
    void loadAppShellCss();
    preloadVisualThemesIfNeeded();
  }, []);

  return null;
}
