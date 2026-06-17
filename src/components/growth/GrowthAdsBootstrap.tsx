import { useEffect } from "react";
import { identifyUserForAds } from "@/lib/adPixels";
import { syncUserAttributionToServer } from "@/lib/emailCapture";
import { useAuthStore } from "@/stores/authStore";

/** Identifie l'utilisateur aux pixels + sync attribution first-touch serveur. */
export function GrowthAdsBootstrap() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (status !== "ready" || !user) return;
    identifyUserForAds({ email: user.email, userId: user.id });
    void syncUserAttributionToServer();
  }, [status, user?.email, user?.id]);

  return null;
}
