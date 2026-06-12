import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Grid3X3, Settings, LogIn, LogOut, AudioWaveform, Users, BarChart3, Loader2, Home, Layers } from "lucide-react";
import { isSampleLabEnabled } from "@/lib/sampleLab";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useGrowthAdmin } from "@/hooks/useGrowthAdmin";
import { useAuthStore } from "@/stores/authStore";
import { COMMUNITY_HUB_NAV } from "@/lib/communityHub";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import { useLocaleStore } from "@/stores/localeStore";
import { buildAuthUrl } from "@/lib/authRoutes";

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
    { to: "/dashboard", label: locale === "fr" ? "Générateur" : "Generator", icon: <AudioWaveform className="h-5 w-5" /> },
    { to: "/library", label: locale === "fr" ? "Bibliothèque" : "Library", icon: <Grid3X3 className="h-5 w-5" /> },
    ...(isSampleLabEnabled()
      ? [
          {
            to: "/sample-lab",
            label: locale === "fr" ? "Sample Lab" : "Sample Lab",
            icon: <Layers className="h-5 w-5" />,
          } satisfies Item,
        ]
      : []),
    { to: "/community", label: locale === "fr" ? COMMUNITY_HUB_NAV.fr : COMMUNITY_HUB_NAV.en, icon: <Users className="h-5 w-5" /> },
    { to: "/settings", label: locale === "fr" ? "Paramètres" : "Settings", icon: <Settings className="h-5 w-5" /> },
    { to: "/?home=1", label: locale === "fr" ? "Site" : "Website", icon: <Home className="h-5 w-5" /> },
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

  const mobileNavIconClass =
    "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl md:h-10 md:w-10";

  return (
    <div className="pk-sidebar-root flex h-full w-full min-w-0 items-center bg-transparent md:h-auto md:w-auto md:flex-col md:justify-between md:px-2 md:py-3">
      <div className="flex min-w-0 flex-1 items-center md:flex-col md:gap-0">
        <div className="pk-mobile-bottom-nav__routes flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overscroll-x-contain px-1.5 py-1 [-webkit-overflow-scrolling:touch] md:mt-1 md:flex-col md:gap-0.5 md:overflow-visible md:px-0 md:py-0">
          {items.map((it) => {
            const active =
              it.to === "/?home=1"
                ? location.pathname === "/" || location.pathname === "/home"
                : location.pathname === it.to || (it.to !== "/" && location.pathname.startsWith(it.to + "/"));
            return (
              <div
                key={it.to}
                data-coach={it.to === "/library" ? "nav-library" : undefined}
                className={cn(
                  "pk-studio-nav-link",
                  mobileNavIconClass,
                  active ? "pk-studio-nav-link--active text-pk-accent" : "text-pk-muted hover:text-pk-text",
                )}
              >
                <Link
                  to={it.to}
                  className="flex h-full w-full items-center justify-center"
                  aria-label={it.label}
                  title={it.label}
                >
                <span className="pk-studio-nav-indicator hidden md:block" aria-hidden />
                {active ? (
                  <span
                    className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-pk-accent md:hidden"
                    aria-hidden
                  />
                ) : null}
                {it.icon}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="hidden md:flex md:flex-col md:gap-1.5 md:pt-2">
          <ThemeToggleButton variant="icon" />
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
              to={buildAuthUrl({ mode: "login", next: "/dashboard" })}
              className="flex h-10 w-10 items-center justify-center rounded-pk text-pk-muted transition-colors hover:bg-white/5 hover:text-pk-text"
              aria-label={locale === "fr" ? "Connexion" : "Login"}
              title={locale === "fr" ? "Connexion" : "Login"}
            >
              <LogIn className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>

      <div className="pk-mobile-bottom-nav__actions flex shrink-0 items-center gap-0.5 border-l border-white/10 py-1 pl-1 pr-2 md:hidden">
        <ThemeToggleButton variant="icon" className="!h-10 !w-10 shrink-0 rounded-lg" />
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold transition-colors",
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
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold transition-colors",
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-pk-muted transition-colors hover:bg-white/5 hover:text-pk-text disabled:opacity-60"
            aria-label={locale === "fr" ? "Déconnexion" : "Logout"}
            title={locale === "fr" ? "Déconnexion" : "Logout"}
          >
            {logoutIcon}
          </button>
        ) : (
          <Link
            to={buildAuthUrl({ mode: "login", next: "/dashboard" })}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-pk-muted transition-colors hover:bg-white/5 hover:text-pk-text"
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
