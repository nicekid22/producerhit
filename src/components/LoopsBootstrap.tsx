import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useLoopsStore } from "@/stores/loopsStore";

export function LoopsBootstrap({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const loadMyLoops = useLoopsStore((s) => s.loadMyLoops);
  const clear = useLoopsStore((s) => s.clear);

  useEffect(() => {
    if (status !== "ready") return;
    if (!user?.id) {
      clear();
      return;
    }
    void loadMyLoops();
  }, [clear, loadMyLoops, status, user?.id]);

  return <>{children}</>;
}

