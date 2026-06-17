import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { hydrateGamificationFromServer } from "@/lib/gamificationSync";
import { deferUntilIdle } from "@/lib/perf/defer";

/** Hydrate growth state après login (XP cross-device + notifications). */
export function GrowthPlatformBootstrap() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const refreshNotifications = useNotificationStore((s) => s.refresh);

  useEffect(() => {
    if (status !== "ready" || !user?.id) return;
    deferUntilIdle(() => {
      void hydrateGamificationFromServer();
      void refreshNotifications();
    }, 2200);
  }, [refreshNotifications, status, user?.id]);

  return null;
}
