import { useEffect, useRef, useState } from "react";

/**
 * Tracks continuous viewport intersection. Unlike useLazyInView, this keeps
 * the IntersectionObserver alive and updates `visible` in real-time, so
 * expensive animations (marquees, infinite loops) can pause when off-screen.
 */
export function useInView(rootMargin = "200px") {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry?.isIntersecting ?? false);
      },
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, visible };
}
