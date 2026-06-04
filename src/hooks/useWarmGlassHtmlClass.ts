import { useEffect } from "react";

/** Active les styles portaled (dropdowns) et scrollbars globaux Warm Glass. */
export function useWarmGlassHtmlClass(active: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    if (active) root.classList.add("pk-warm-glass-active");
    else root.classList.remove("pk-warm-glass-active");
    return () => root.classList.remove("pk-warm-glass-active");
  }, [active]);
}
