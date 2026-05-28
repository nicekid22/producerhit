import { useCallback, useState } from "react";

export type MobileDashboardTab = "create" | "results" | "master";

export function useMobileDashboardTab(initial: MobileDashboardTab = "create") {
  const [tab, setTab] = useState<MobileDashboardTab>(initial);
  const goCreate = useCallback(() => setTab("create"), []);
  const goResults = useCallback(() => setTab("results"), []);
  const goMaster = useCallback(() => setTab("master"), []);
  return { tab, setTab, goCreate, goResults, goMaster };
}
