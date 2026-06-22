import { useEffect, useState } from "react";
import { SubscriptionService } from "@/lib/subscriptionService";

export function useSubscription() {
  const [packages, setPackages] = useState(SubscriptionService.state.packages);
  const [iapReady, setIapReady] = useState(SubscriptionService.state.iapReady);
  const [loading, setLoading] = useState(!SubscriptionService.state._initialized);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      await SubscriptionService.init();
      if (!mounted) return;
      setPackages([...SubscriptionService.state.packages]);
      setIapReady(SubscriptionService.state.iapReady);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const refresh = async () => {
    await SubscriptionService.refreshProducts();
    setPackages([...SubscriptionService.state.packages]);
    setIapReady(SubscriptionService.state.iapReady);
  };

  return {
    packages,
    iapReady,
    loading,
    refresh,
    price: packages[0]?.price ?? "—",
  };
}
