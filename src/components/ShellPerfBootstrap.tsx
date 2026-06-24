import { useEffect } from "react";
import {
  deferUntilIdle,
  loadAppShellCss,
  loadShellDeferredCss,
  preloadVisualThemesIfNeeded,
} from "@/lib/perf/defer";

/** CSS shell + thèmes après first paint (LCP). */
export function ShellPerfBootstrap() {
  useEffect(() => {
    deferUntilIdle(() => {
      void loadShellDeferredCss();
      void loadAppShellCss();
      preloadVisualThemesIfNeeded();
    });
  }, []);

  return null;
}
