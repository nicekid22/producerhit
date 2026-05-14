import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export function ProtectedRoute() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status !== "ready") {
    return (
      <div className="min-h-[60vh] bg-pk-bg text-pk-text">
        <div className="mx-auto max-w-lg px-6 py-16">
          <div className="rounded-pk border border-pk-border bg-pk-panel p-6">
            <div className="text-sm font-semibold">Loading…</div>
            <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
