import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    void init();
  }, [init]);

  if (status !== "ready") {
    return (
      <div className="min-h-screen bg-pk-bg text-pk-text">
        <div className="mx-auto max-w-md px-6 py-20">
          <div className="rounded-pk border border-pk-border bg-pk-panel p-6">
            <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

