import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { isSupabaseDown, startHealthCheck, type HealthStatus } from "@/lib/supabaseHealth";
import { cn } from "@/lib/utils";

/**
 * Bannière de statut Supabase — affichée en haut de page.
 * - Jaune/orange quand Supabase est down
 * - Verte (« Reconnecté ») pendant 5 s quand Supabase revient
 */
export function SupabaseStatusBanner() {
  const [status, setStatus] = useState<HealthStatus>(() => {
    startHealthCheck(); // idempotent
    return isSupabaseDown() ? "down" : "up";
  });
  const [showReconnected, setShowReconnected] = useState(false);
  const prevStatusRef = useRef<HealthStatus>(status);

  useEffect(() => {
    // Ensure the health check timer is running.
    startHealthCheck();

    function handleUp() {
      // Transition: down → up
      setShowReconnected(true);
      setStatus("up");
      // Auto-hide after 5 s.
      const t = setTimeout(() => setShowReconnected(false), 5_000);
      return () => clearTimeout(t);
    }
    function handleDown() {
      setShowReconnected(false);
      setStatus("down");
    }

    window.addEventListener("supabase:up", handleUp);
    window.addEventListener("supabase:down", handleDown);

    return () => {
      window.removeEventListener("supabase:up", handleUp);
      window.removeEventListener("supabase:down", handleDown);
    };
  }, []);

  // Don't show the banner if Supabase is up and we're not in the "reconnected" state.
  if (status === "up" && !showReconnected) return null;

  const isDown = status === "down";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative z-50 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium",
        isDown
          ? "bg-amber-600/90 text-white"
          : "bg-emerald-600/90 text-white",
      )}
    >
      {isDown ? (
        <>
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          <span>Mode hors-ligne — certaines fonctionnalités sont temporairement indisponibles</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          <span>Reconnecté</span>
        </>
      )}
    </div>
  );
}
