import { useEffect, useState } from "react";
import { fetchIsGrowthAdmin } from "@/lib/growthAnalytics";
import { useAuthStore } from "@/stores/authStore";

export function useGrowthAdmin(): boolean {
  const user = useAuthStore((s) => s.user);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    void fetchIsGrowthAdmin(user.id).then((ok) => {
      if (!cancelled) setIsAdmin(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return isAdmin;
}
