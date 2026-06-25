import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useLocaleStore } from "@/stores/localeStore";
import { hydrateGamificationFromServer } from "@/lib/gamificationSync";
import { ensureWelcomeNotification } from "@/lib/notifications";
import { deferUntilIdle } from "@/lib/perf/defer";

/** Hydrate growth state après login (XP cross-device + notifications). */
export function GrowthPlatformBootstrap() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const locale = useLocaleStore((s) => s.locale);
  const refreshNotifications = useNotificationStore((s) => s.refresh);

  useEffect(() => {
    if (status !== "ready" || !user?.id) return;
    deferUntilIdle(() => {
      void hydrateGamificationFromServer();
      void (async () => {
        await ensureWelcomeNotification(locale);
        await refreshNotifications();
      })();
    }, 2200);
  }, [locale, refreshNotifications, status, user?.id]);

  return null;
}
