import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 768px)");
}

/** Téléphone paysage / viewport très bas — chrome et footer compacts. */
export function useIsCompactMobileViewport(): boolean {
  return useMediaQuery("(max-width: 767px) and (max-height: 520px)");
}

/** iPad / tablette — layout desktop mais colonnes plus étroites. */
export function useIsTabletViewport(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}
