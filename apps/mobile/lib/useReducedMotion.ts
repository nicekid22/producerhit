import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** Respects iOS Reduce Motion — skip decorative transforms > 150ms */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => sub.remove();
  }, []);

  return reduced;
}
