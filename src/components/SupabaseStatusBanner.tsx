import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Server, Flame, Zap } from "lucide-react";
import { isSupabaseDown, startHealthCheck, type HealthStatus } from "@/lib/supabaseHealth";
import { isUsingBackup, isUsingFirebase, isBackupConfigured, switchToBackup, switchToPrimary } from "@/lib/supabaseClient";
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

  // Show banner when: degraded (backup/firebase) OR reconnecting OR reconnect flash
  const inDegradedMode = isUsingBackup() || isUsingFirebase();
  if (status === "up" && !showReconnected && !inDegradedMode) return null;

  const isDown = status === "down";
  const onBackup = isUsingBackup();
  const onFirebase = isUsingFirebase();
  const backupConfigured = isBackupConfigured();

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative z-50 flex flex-wrap items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium",
        onFirebase
          ? "bg-violet-600/90 text-white"
          : onBackup
            ? "bg-blue-600/90 text-white"
            : isDown
              ? "bg-amber-600/90 text-white"
              : "bg-emerald-600/90 text-white",
      )}
    >
      {onFirebase ? (
        <>
          <Flame className="h-4 w-4 shrink-0" aria-hidden />
          <span>Mode Firebase — serveurs indisponibles. Lecture seule.</span>
          {backupConfigured && !onBackup && (
            <button
              onClick={switchToBackup}
              className="ml-1 flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-xs font-semibold hover:bg-white/30 transition-colors"
            >
              <Zap className="h-3 w-3" /> Essayer backup Supabase
            </button>
          )}
        </>
      ) : onBackup ? (
        <>
          <Server className="h-4 w-4 shrink-0" aria-hidden />
          <span>Serveur de secours actif — Auth & données OK. Générations désactivées.</span>
          <button
            onClick={switchToPrimary}
            className="ml-1 flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-xs font-semibold hover:bg-white/30 transition-colors"
          >
            <CheckCircle2 className="h-3 w-3" /> Retour au principal
          </button>
        </>
      ) : isDown ? (
        <>
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          <span>Serveur en panne. Connexion en cours…</span>
          {backupConfigured && (
            <button
              onClick={switchToBackup}
              className="ml-1 flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-xs font-semibold hover:bg-white/30 transition-colors"
            >
              <Zap className="h-3 w-3" /> Forcer mode backup
            </button>
          )}
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          <span>Reconnecté au serveur principal</span>
        </>
      )}
    </div>
  );
}
