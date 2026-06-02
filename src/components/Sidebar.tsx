import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Grid3X3, Settings, LogIn, LogOut, AudioWaveform, Users, BarChart3, Loader2, Home } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useGrowthAdmin } from "@/hooks/useGrowthAdmin";
import { useAuthStore } from "@/stores/authStore";
import { COMMUNITY_HUB_NAV } from "@/lib/communityHub";
import { useLocaleStore } from "@/stores/localeStore";

type Item = { to: string; label: string; icon: React.ReactNode };

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const isGrowthAdmin = useGrowthAdmin();
  const [loggingOut, setLoggingOut] = useState(false);

  const items: Item[] = [
    { to: "/?home=1", label: locale === "fr" ? "Accueil" : "Home", icon: <Home className="h-5 w-5" /> },
    { to: "/dashboard", label: locale === "fr" ? "Générateur" : "Generator", icon: <AudioWaveform className="h-5 w-5" /> },
    { to: "/library", label: locale === "fr" ? "Bibliothèque" : "Library", icon: <Grid3X3 className="h-5 w-5" /> },
    { to: "/community", label: locale === "fr" ? COMMUNITY_HUB_NAV.fr : COMMUNITY_HUB_NAV.en, icon: <Users className="h-5 w-5" /> },
    { to: "/settings", label: locale === "fr" ? "Paramètres" : "Settings", icon: <Settings className="h-5 w-5" /> },
    ...(isGrowthAdmin
      ? [{ to: "/admin/growth", label: "Growth", icon: <BarChart3 className="h-5 w-5" /> } satisfies Item]
      : []),
  ];

  async function onLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
      toast.success(locale === "fr" ? "Déconnecté" : "Signed out");
      navigate("/auth", { replace: true });
    } catch {
      toast.error(locale === "fr" ? "Impossible de se déconnecter" : "Could not sign out");
    } finally {
      setLoggingOut(false);
    }
  }

  const logoutIcon = loggingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />;

  return (
    <div className="flex h-full items-center justify-between bg-transparent px-3 py-2 md:flex-col md:justify-between md:border-r-0 md:px-0 md:py-4">
      <div className="flex items-center gap-2 md:flex-col">
        <div className="flex items-center gap-1 md:mt-3 md:flex-col">
          {items.map((it) => {
            const active =
              it.to === "/?home=1"
                ? location.pathname === "/" || location.pathname === "/home"
                : location.pathname === it.to || (it.to !== "/" && location.pathname.startsWith(it.to + "/"));
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "pk-studio-nav-link relative flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl md:h-10 md:w-10 md:min-h-0 md:min-w-0",
                  active ? "pk-studio-nav-link--active text-pk-accent" : "text-pk-muted hover:text-pk-text",
                )}
                aria-label={it.label}
                title={it.label}
              >
                <span className="pk-studio-nav-indicator hidden md:block" aria-hidden />
                {active ? (
                  <span className="absolute -left-1.5 h-5 w-1 rounded-full bg-pk-accent md:hidden" aria-hidden />
                ) : null}
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
              disabled={loggingOut}
              className="flex h-10 w-10 items-center justify-center rounded-pk text-pk-muted transition-colors hover:bg-white/5 hover:text-pk-text disabled:opacity-60"
              aria-label={locale === "fr" ? "Déconnexion" : "Logout"}
              title={locale === "fr" ? "Déconnexion" : "Logout"}
            >
              {logoutIcon}
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

      <div className="flex items-center gap-2 md:hidden">
        <button
          type="button"
          onClick={() => setLocale("en")}
            className={cn(
              "flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[10px] font-semibold transition-colors",
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
              "flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[10px] font-semibold transition-colors",
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
            disabled={loggingOut}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-pk text-pk-muted transition-colors hover:bg-white/5 hover:text-pk-text disabled:opacity-60"
            aria-label={locale === "fr" ? "Déconnexion" : "Logout"}
            title={locale === "fr" ? "Déconnexion" : "Logout"}
          >
            {logoutIcon}
          </button>
        ) : (
          <Link
            to="/auth?next=/dashboard"
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-pk text-pk-muted transition-colors hover:bg-white/5 hover:text-pk-text"
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
