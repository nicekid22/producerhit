import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { flushEventQueue } from "@/lib/supabaseClient";
import { claimReferralIfPending } from "@/lib/referral";
import { useLocaleStore } from "@/stores/localeStore";

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const locale = useLocaleStore((s) => s.locale);

  // Init auth immediately — no deferral delay
  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (status !== "ready") return;
    if (!user) return;
    void flushEventQueue();
    void claimReferralIfPending(locale);
  }, [locale, status, user?.id]);

  return <>{children}</>;
}
