import { Link, useLocation, useNavigate } from "react-router-dom";
import { Grid3X3, Settings, LogIn, LogOut, AudioWaveform } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

type Item = { to: string; label: string; icon: React.ReactNode };

const items: Item[] = [
  { to: "/dashboard", label: "Générateur", icon: <AudioWaveform className="h-5 w-5" /> },
  { to: "/library", label: "Bibliothèque", icon: <Grid3X3 className="h-5 w-5" /> },
  { to: "/settings", label: "Paramètres", icon: <Settings className="h-5 w-5" /> },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  async function onLogout() {
    try {
      await signOut();
      toast.success("Déconnecté");
      navigate("/auth", { replace: true });
    } catch {
      toast.error("Impossible de se déconnecter");
    }
  }

  return (
    <div className="flex h-full items-center justify-between bg-pk-panel px-3 py-2 md:flex-col md:justify-between md:border-r md:border-pk-border md:px-0 md:py-3">
      <div className="flex items-center gap-2 md:flex-col">
        <div className="flex items-center gap-1 md:mt-3 md:flex-col">
          {items.map((it) => {
            const active = location.pathname === it.to;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-pk transition-colors",
                  active ? "bg-pk-accent/15 text-pk-accent" : "text-pk-muted hover:bg-white/5 hover:text-pk-text",
                )}
                aria-label={it.label}
                title={it.label}
              >
                {it.icon}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 md:flex-col md:gap-2 md:pb-2">
        {user ? (
          <button
            type="button"
            onClick={onLogout}
            className="flex h-10 w-10 items-center justify-center rounded-pk text-pk-muted transition-colors hover:bg-white/5 hover:text-pk-text"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        ) : (
          <Link
            to="/auth?next=/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-pk text-pk-muted transition-colors hover:bg-white/5 hover:text-pk-text"
            aria-label="Login"
            title="Login"
          >
            <LogIn className="h-5 w-5" />
          </Link>
        )}
      </div>
    </div>
  );
}
