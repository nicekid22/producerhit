import { useMemo } from "react";
import { normalizePlan } from "@/lib/billing";
import { readProfileCache } from "@/lib/profileBootstrap";
import { useAuthStore } from "@/stores/authStore";

/** Plan billing résolu — `ready` pour quota/UI ; `bannersReady` attend le profil serveur (évite flash upsell). */
export function useResolvedPlan(): { plan: string; ready: boolean; bannersReady: boolean } {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const profileReady = useAuthStore((s) => s.profileReady);

  const cachedPlan = useMemo(() => {
    if (!user?.id) return null;
    return readProfileCache(user.id)?.plan ?? null;
  }, [user?.id, profile?.plan]);

  const ready = !user || profileReady || !!cachedPlan;
  const bannersReady = !user || profileReady;
  const plan = normalizePlan(profile?.plan ?? cachedPlan ?? "free");

  return { plan, ready, bannersReady };
}
