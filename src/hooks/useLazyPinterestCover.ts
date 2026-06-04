import { useEffect, useRef, useState } from "react";
import { useLazyInView } from "@/hooks/useLazyInView";
import {
  fetchPinterestCoverForStyle,
  fetchWorkspacePinterestCover,
  getCachedWorkspacePinterestCover,
  type PinterestStyleInput,
} from "@/lib/pinterestCoverFetch";

type Item = PinterestStyleInput & { id: string };

type LazyScope = "feed" | "workspace";

/**
 * Charge une cover Pinterest uniquement quand la carte entre (ou approche) du viewport.
 * Scope `workspace` : 1 URL stable par loop.id, cache session (bannière = panneau détails).
 */
export function useLazyPinterestCover(
  item: Item,
  slotIndex: number,
  enabled: boolean,
  rootMargin = "320px",
  scope: LazyScope = "feed",
) {
  const isWorkspace = scope === "workspace";
  const { ref, visible } = useLazyInView(rootMargin);
  const [url, setUrl] = useState<string | null>(() =>
    enabled && isWorkspace ? getCachedWorkspacePinterestCover(item.id) : null,
  );
  const fetchedRef = useRef(false);

  useEffect(() => {
    fetchedRef.current = false;
    if (!enabled) {
      setUrl(null);
      return;
    }
    if (isWorkspace) {
      const cached = getCachedWorkspacePinterestCover(item.id);
      setUrl(cached);
    } else {
      setUrl(null);
    }
  }, [enabled, isWorkspace, item.id]);

  useEffect(() => {
    if (!enabled) return;

    if (isWorkspace) {
      const cached = getCachedWorkspacePinterestCover(item.id);
      if (cached) {
        setUrl(cached);
        return;
      }
    }

    if (!visible || fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;
    const load = isWorkspace
      ? fetchWorkspacePinterestCover(item)
      : fetchPinterestCoverForStyle(item, slotIndex);

    void load.then((next) => {
      if (!cancelled && next?.startsWith("http")) setUrl(next);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, isWorkspace, item.genre, item.id, item.mood, item.name, item.prompt, slotIndex, visible]);

  return { ref, inView: visible, url };
}

/** Panneau détails — lit le cache workspace ou fetch une seule fois par morceau. */
export function useWorkspacePinterestCover(item: Item, enabled: boolean) {
  const [url, setUrl] = useState<string | null>(() =>
    enabled ? getCachedWorkspacePinterestCover(item.id) : null,
  );

  useEffect(() => {
    if (!enabled) {
      setUrl(null);
      return;
    }

    const cached = getCachedWorkspacePinterestCover(item.id);
    if (cached) {
      setUrl(cached);
      return;
    }

    let cancelled = false;
    void fetchWorkspacePinterestCover(item).then((next) => {
      if (!cancelled) setUrl(next?.startsWith("http") ? next : null);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, item.genre, item.id, item.mood, item.name, item.prompt]);

  return url;
}
