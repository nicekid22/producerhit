import { useCallback, useState } from "react";

function persistOpen(storageKey: string, open: boolean) {
  try {
    window.localStorage.setItem(storageKey, open ? "0" : "1");
  } catch {
    /* ignore */
  }
}

export function useCollapsiblePanel(storageKey: string, defaultOpen = true) {
  const [open, setOpenState] = useState(() => {
    if (typeof window === "undefined") return defaultOpen;
    try {
      const value = window.localStorage.getItem(storageKey);
      if (value === "1") return false;
      if (value === "0") return true;
    } catch {
      /* ignore */
    }
    return defaultOpen;
  });

  const setOpen = useCallback(
    (next: boolean) => {
      persistOpen(storageKey, next);
      setOpenState(next);
    },
    [storageKey],
  );

  const toggle = useCallback(() => {
    setOpenState((prev) => {
      const next = !prev;
      persistOpen(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const expand = useCallback(() => setOpen(true), [setOpen]);

  return { open, toggle, setOpen, expand };
}
