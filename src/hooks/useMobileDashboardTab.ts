import { useCallback, useState } from "react";

export type MobileDashboardTab = "create" | "results";

export function useMobileDashboardTab(initial: MobileDashboardTab = "create") {
  const [tab, setTab] = useState<MobileDashboardTab>(initial);
  const goCreate = useCallback(() => setTab("create"), []);
  const goResults = useCallback(() => setTab("results"), []);
  return { tab, setTab, goCreate, goResults };
}
