import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useLoopsStore } from "@/stores/loopsStore";

function needsMyLoops(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/library") ||
    pathname.startsWith("/settings")
  );
}

export function LoopsBootstrap({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const loadMyLoops = useLoopsStore((s) => s.loadMyLoops);
  const clear = useLoopsStore((s) => s.clear);
  const scoped = needsMyLoops(pathname);

  useEffect(() => {
    if (status !== "ready") return;
    if (!user?.id) {
      clear();
      return;
    }
    if (!scoped) return;
    void loadMyLoops();
  }, [clear, loadMyLoops, scoped, status, user?.id]);

  return <>{children}</>;
}
