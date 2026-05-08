import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useLoopsStore } from "@/stores/loopsStore";

export function LoopsBootstrap({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loadMyLoops = useLoopsStore((s) => s.loadMyLoops);
  const clear = useLoopsStore((s) => s.clear);

  useEffect(() => {
    if (!user) {
      clear();
      return;
    }
    void loadMyLoops();
  }, [clear, loadMyLoops, user]);

  return <>{children}</>;
}

