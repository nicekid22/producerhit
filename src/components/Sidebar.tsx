import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, type ComponentType } from "react";
import {
  AudioWaveform,
  BarChart3,
  Grid3X3,
  Home,
  Layers,
  Loader2,
  LogIn,
  LogOut,
  Mic,
  Settings,
  Users,
  type LucideProps,
} from "lucide-react";
import { ThemeAndAccentPicker } from "@/components/ThemeAndAccentPicker";
import { LanguagePicker } from "@/components/LanguagePicker";
import { isSampleLabEnabled } from "@/lib/sampleLab";
import { CLOUD_THEME_ENABLED } from "@/lib/featureFlags";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useGrowthAdmin } from "@/hooks/useGrowthAdmin";
import { useAuthStore } from "@/stores/authStore";
import { COMMUNITY_HUB_NAV } from "@/lib/communityHub";
import { useLocaleStore } from "@/stores/localeStore";
import { buildAuthUrl } from "@/lib/authRoutes";
import { SIDEBAR_ICON_CLASS, SIDEBAR_ICON_PROPS } from "@/lib/sidebarIcons";

type Item = { to: string; label: string; icon: React.ReactNode; mobileHidden?: boolean };

function SidebarIcon({ icon: Icon }: { icon: ComponentType<LucideProps> }) {
  return <Icon className={SIDEBAR_ICON_CLASS} {...SIDEBAR_ICON_PROPS} />;
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const locale = useLocaleStore((s) => s.locale);
  const isGrowthAdmin = useGrowthAdmin();
  const [loggingOut, setLoggingOut] = useState(false);

  const items: Item[] = [
    {
      to: "/dashboard",
      label: locale === "fr" ? "Générateur" : "Generator",
      icon: <SidebarIcon icon={AudioWaveform} />,
    },
    {
      to: "/library",
      label: locale === "fr" ? "Bibliothèque" : "Library",
      icon: <SidebarIcon icon={Grid3X3} />,
    },
    {
      to: "/voice-studio",
      label: locale === "fr" ? "Voice Studio" : "Voice Studio",
      icon: <SidebarIcon icon={Mic} />,
    },
    ...(isSampleLabEnabled()
      ? [
          {
            to: "/sample-lab",
            label: locale === "fr" ? "Sample Lab" : "Sample Lab",
            icon: <SidebarIcon icon={Layers} />,
          } satisfies Item,
        ]
      : []),
    {
      to: "/community",
      label: locale === "fr" ? COMMUNITY_HUB_NAV.fr : COMMUNITY_HUB_NAV.en,
      icon: <SidebarIcon icon={Users} />,
    },
    {
      to: "/settings",
      label: locale === "fr" ? "Paramètres" : "Settings",
      icon: <SidebarIcon icon={Settings} />,
    },
    {
      to: "/?home=1",
      label: locale === "fr" ? "Site" : "Website",
      icon: <SidebarIcon icon={Home} />,
      mobileHidden: true,
    },
    ...(isGrowthAdmin
      ? [{ to: "/admin/growth", label: "Growth", icon: <SidebarIcon icon={BarChart3} /> } satisfies Item]
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

  const logoutIcon = loggingOut ? (
    <Loader2 className={cn(SIDEBAR_ICON_CLASS, "animate-spin")} {...SIDEBAR_ICON_PROPS} />
  ) : (
    <SidebarIcon icon={LogOut} />
  );

  const mobileNavIconClass =
    "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl md:h-10 md:w-10";

  const localePicker = <LanguagePicker variant="icon" className="md:hidden" />;

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
                  it.mobileHidden && "hidden md:flex",
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

        <div className="pk-sidebar-footer hidden md:flex md:flex-col md:items-center md:gap-1.5 md:border-t md:border-white/[0.06] md:pt-2">
          <ThemeAndAccentPicker variant={CLOUD_THEME_ENABLED ? "sidebar-stack" : "nav-icon"} />
          {!CLOUD_THEME_ENABLED ? <LanguagePicker variant="sidebar" /> : null}
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
              <LogIn className={SIDEBAR_ICON_CLASS} {...SIDEBAR_ICON_PROPS} />
            </Link>
          )}
        </div>
      </div>

      <div className="pk-mobile-bottom-nav__actions flex shrink-0 items-center gap-1 border-l border-white/10 py-1 pl-1.5 pr-2 md:hidden">
        <ThemeAndAccentPicker variant={CLOUD_THEME_ENABLED ? "mobile" : "nav-icon"} className="!h-11 !w-11 shrink-0 rounded-xl" />
        {localePicker}
        {user ? (
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-pk-muted transition-colors hover:bg-white/5 hover:text-pk-text disabled:opacity-60"
            aria-label={locale === "fr" ? "Déconnexion" : "Logout"}
            title={locale === "fr" ? "Déconnexion" : "Logout"}
          >
            {logoutIcon}
          </button>
        ) : (
          <Link
            to={buildAuthUrl({ mode: "login", next: "/dashboard" })}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-pk-muted transition-colors hover:bg-white/5 hover:text-pk-text"
            aria-label={locale === "fr" ? "Connexion" : "Login"}
            title={locale === "fr" ? "Connexion" : "Login"}
          >
            <LogIn className={SIDEBAR_ICON_CLASS} {...SIDEBAR_ICON_PROPS} />
          </Link>
        )}
      </div>
    </div>
  );
}
