import { useCallback, useEffect, useState } from "react";
import {
  dismissCoachMark,
  loadCoachMarks,
  type CoachMarkId,
} from "@/lib/coachMarks";

export function useCoachMarks() {
  const [dismissed, setDismissed] = useState<Set<CoachMarkId> | null>(null);

  useEffect(() => {
    void loadCoachMarks().then(setDismissed);
  }, []);

  const dismiss = useCallback(async (id: CoachMarkId) => {
    const next = await dismissCoachMark(id);
    setDismissed(next);
  }, []);

  const isVisible = useCallback(
    (id: CoachMarkId) => dismissed != null && !dismissed.has(id),
    [dismissed],
  );

  return { ready: dismissed != null, isVisible, dismiss };
}
