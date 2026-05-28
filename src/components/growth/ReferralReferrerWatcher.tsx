import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

const POLL_MS = 60_000;

/** Refreshes profile when tab becomes visible and periodically — catches referrer bonus while app is open. */
export function ReferralReferrerWatcher() {
  const user = useAuthStore((s) => s.user);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  useEffect(() => {
    if (!user?.id) return;

    const refreshIfVisible = () => {
      if (document.visibilityState !== "visible") return;
      void refreshProfile();
    };

    document.addEventListener("visibilitychange", refreshIfVisible);
    const interval = window.setInterval(refreshIfVisible, POLL_MS);

    return () => {
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.clearInterval(interval);
    };
  }, [refreshProfile, user?.id]);

  return null;
}
