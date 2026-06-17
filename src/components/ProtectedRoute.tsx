import { Navigate, Outlet, useLocation } from "react-router-dom";
import { PageLoader } from "@/components/PageLoader";
import { buildAuthUrl } from "@/lib/authRoutes";
import { useAuthStore } from "@/stores/authStore";

export function ProtectedRoute() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status !== "ready") {
    return <PageLoader variant="inline" />;
  }

  if (!user) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={buildAuthUrl({ next: returnTo })} replace />;
  }

  return <Outlet />;
}
