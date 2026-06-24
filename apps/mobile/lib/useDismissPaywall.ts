import { useRouter } from "expo-router";

import { useCallback } from "react";

import { SubscriptionService } from "@/lib/subscriptionService";



/** Ferme le paywall modal (iOS) ou revient en arrière. */

export function useDismissPaywall() {

  const router = useRouter();



  return useCallback(() => {

    SubscriptionService.cancelPendingPurchase();

    try {

      if (typeof router.canDismiss === "function" && router.canDismiss()) {

        router.dismiss();

        return;

      }

    } catch {

      /* ignore */

    }

    if (router.canGoBack()) {

      router.back();

      return;

    }

    router.replace("/(tabs)/create");

  }, [router]);

}


