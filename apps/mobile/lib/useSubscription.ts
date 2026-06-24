import { useCallback, useEffect, useState } from "react";
import type { IapPaidPlan } from "@/lib/iapCatalog";
import { SubscriptionService, type IapPackageInfo } from "@/lib/subscriptionService";

function readSubscriptionSnapshot() {
  return {
    packages: [...SubscriptionService.state.packages],
    iapReady: SubscriptionService.state.iapReady,
    loading: !SubscriptionService.state._initialized,
  };
}

export function useSubscription() {
  const [packages, setPackages] = useState<IapPackageInfo[]>(SubscriptionService.state.packages);
  const [iapReady, setIapReady] = useState(SubscriptionService.state.iapReady);
  const [loading, setLoading] = useState(!SubscriptionService.state._initialized);

  const syncFromService = useCallback(() => {
    const snap = readSubscriptionSnapshot();
    setPackages(snap.packages);
    setIapReady(snap.iapReady);
    setLoading(snap.loading);
  }, []);

  useEffect(() => {
    syncFromService();
    const unsub = SubscriptionService.subscribePackages(syncFromService);
    void (async () => {
      await SubscriptionService.init();
      syncFromService();
    })();
    return unsub;
  }, [syncFromService]);

  const refresh = useCallback(async () => {
    await SubscriptionService.refreshProducts();
    syncFromService();
  }, [syncFromService]);

  const packageForPlan = (plan: IapPaidPlan) => SubscriptionService.packageForPlan(plan);

  return {
    packages,
    iapReady,
    loading,
    refresh,
    packageForPlan,
  };
}
