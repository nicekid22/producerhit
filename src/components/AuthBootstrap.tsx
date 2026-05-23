import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { flushClientEvents } from "@/lib/supabaseClient";

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (status !== "ready") return;
    if (!user) return;
    void flushClientEvents(user.id);
  }, [status, user]);

  return <>{children}</>;
}
