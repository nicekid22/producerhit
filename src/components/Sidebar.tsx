import { Link, useLocation, useNavigate } from "react-router-dom";
import { Grid3X3, Settings, LogIn, LogOut, AudioWaveform, Users } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";

type Item = { to: string; label: string; icon: React.ReactNode };

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const items: Item[] = [
    { to: "/dashboard", label: locale === "fr" ? "Générateur" : "Generator", icon: <AudioWaveform className="h-5 w-5" /> },
    { to: "/library", label: locale === "fr" ? "Bibliothèque" : "Library", icon: <Grid3X3 className="h-5 w-5" /> },
    { to: "/community", label: locale === "fr" ? "Communauté" : "Community", icon: <Users className="h-5 w-5" /> },
    { to: "/settings", label: locale === "fr" ? "Paramètres" : "Settings", icon: <Settings className="h-5 w-5" /> },
  ];

  async function onLogout() {
    try {
      await signOut();
      toast.success(locale === "fr" ? "Déconnecté" : "Signed out");
      navigate("/auth", { replace: true });
    } catch {
      toast.error(locale === "fr" ? "Impossible de se déconnecter" : "Could not sign out");
    }
  }

  return (
    <div className="flex h-full items-center justify-between bg-transparent px-3 py-2 md:flex-col md:justify-between md:border-r md:border-pk-border md:px-0 md:py-3">
      <div className="flex items-center gap-2 md:flex-col">
        <div className="flex items-center gap-1 md:mt-3 md:flex-col">
          {items.map((it) => {
            const active = location.pathname === it.to || (it.to !== "/" && location.pathname.startsWith(it.to + "/"));
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-pk-accent/15 text-pk-accent" : "text-pk-muted hover:bg-white/5 hover:text-pk-text",
                )}
                aria-label={it.label}
                title={it.label}
              >
                {active ? <span className="absolute -left-1.5 h-5 w-1 rounded-full bg-pk-accent" aria-hidden /> : null}
                {it.icon}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex md:flex-col md:gap-2 md:pt-3">
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-pk text-xs font-semibold transition-colors",
              locale === "en" ? "bg-pk-accent/15 text-pk-accent" : "text-pk-muted hover:bg-white/5 hover:text-pk-text",
            )}
            aria-label="English"
            title="English"
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLocale("fr")}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-pk text-xs font-semibold transition-colors",
              locale === "fr" ? "bg-pk-accent/15 text-pk-accent" : "text-pk-muted hover:bg-white/5 hover:text-pk-text",
            )}
            aria-label="Français"
            title="Français"
          >
            FR
          </button>
          {user ? (
            <button
              type="button"
              onClick={onLogout}
              className="flex h-10 w-10 items-center justify-center rounded-pk text-pk-muted transition-colors hover:bg-white/5 hover:text-pk-text"
              aria-label={locale === "fr" ? "Déconnexion" : "Logout"}
              title={locale === "fr" ? "Déconnexion" : "Logout"}
            >
              <LogOut className="h-5 w-5" />
            </button>
          ) : (
            <Link
              to="/auth?next=/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-pk text-pk-muted transition-colors hover:bg-white/5 hover:text-pk-text"
              aria-label={locale === "fr" ? "Connexion" : "Login"}
              title={locale === "fr" ? "Connexion" : "Login"}
            >
              <LogIn className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 md:hidden">
        <div className="hidden md:flex md:flex-col md:gap-2">
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-pk text-xs font-semibold transition-colors",
              locale === "en" ? "bg-pk-accent/15 text-pk-accent" : "text-pk-muted hover:bg-white/5 hover:text-pk-text",
            )}
            aria-label="English"
            title="English"
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLocale("fr")}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-pk text-xs font-semibold transition-colors",
              locale === "fr" ? "bg-pk-accent/15 text-pk-accent" : "text-pk-muted hover:bg-white/5 hover:text-pk-text",
            )}
            aria-label="Français"
            title="Français"
          >
            FR
          </button>
        </div>
        {user ? (
          <button
            type="button"
            onClick={onLogout}
            className="flex h-10 w-10 items-center justify-center rounded-pk text-pk-muted transition-colors hover:bg-white/5 hover:text-pk-text"
            aria-label={locale === "fr" ? "Déconnexion" : "Logout"}
            title={locale === "fr" ? "Déconnexion" : "Logout"}
          >
            <LogOut className="h-5 w-5" />
          </button>
        ) : (
          <Link
            to="/auth?next=/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-pk text-pk-muted transition-colors hover:bg-white/5 hover:text-pk-text"
            aria-label={locale === "fr" ? "Connexion" : "Login"}
            title={locale === "fr" ? "Connexion" : "Login"}
          >
            <LogIn className="h-5 w-5" />
          </Link>
        )}
      </div>
    </div>
  );
}
