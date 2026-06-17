import { useEffect, useRef, useState } from "react";

type Options = {
  /** Déclenche plus tôt pour anticiper l’entrée dans le viewport */
  rootMargin?: string;
  threshold?: number;
};

/**
 * Révélation mobile liée au scroll (view timeline CSS si dispo, sinon IntersectionObserver).
 */
export function useMobileScrollReveal({
  rootMargin = "0px 0px -4% 0px",
  threshold = 0.05,
}: Options = {}) {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [scrollLinked, setScrollLinked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setRevealed(true);
      return;
    }

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const supportsViewTimeline =
      isMobile &&
      typeof CSS !== "undefined" &&
      CSS.supports("animation-timeline: view()") &&
      CSS.supports("animation-range: entry 0% cover 40%");

    if (supportsViewTimeline) {
      setScrollLinked(true);
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return { ref, revealed, scrollLinked };
}
