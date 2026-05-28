import { useEffect, useState } from "react";

const QUERY = "(pointer: coarse)";

/** Touch-first devices (typical phones/tablets) — used to trim heavy visual FX. */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(() => {
    try {
      return window.matchMedia(QUERY).matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setCoarse(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return coarse;
}
