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
import { useLocaleStore } from "@/stores/localeStore";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useT } from "@/i18n";
import { buildAuthUrl } from "@/lib/authRoutes";
import { SIDEBAR_ICON_CLASS, SIDEBAR_ICON_PROPS } from "@/lib/sidebarIcons";

type Item = { to: string; label: string; icon: React.ReactNode; mobileHidden?: boolean; locked?: boolean };

function SidebarIcon({ icon: Icon }: { icon: ComponentType<LucideProps> }) {
  return <Icon className={SIDEBAR_ICON_CLASS} {...SIDEBAR_ICON_PROPS} />;
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const { m } = useT();
  const locale = useLocaleStore((s) => s.locale);
  const isGrowthAdmin = useGrowthAdmin();
  const [loggingOut, setLoggingOut] = useState(false);

  const items: Item[] = [
    {
      to: "/dashboard",
      label: m.app.generator,
      icon: <SidebarIcon icon={AudioWaveform} />,
    },
    {
      to: "/library",
      label: m.app.library,
      icon: <SidebarIcon icon={Grid3X3} />,
    },
    {
      to: "/voice-studio",
      label: m.app.voiceStudio,
      icon: <SidebarIcon icon={Mic} />,
    },
    ...(isSampleLabEnabled()
      ? [
          {
            to: "/sample-lab",
            label: m.app.sampleLab,
            icon: <SidebarIcon icon={Layers} />,
          } satisfies Item,
        ]
      : []),
    {
      to: "/community",
      label: m.nav.community,
      icon: <SidebarIcon icon={Users} />,
    },
    {
      to: "/settings",
      label: m.app.settings,
      icon: <SidebarIcon icon={Settings} />,
    },
    {
      to: "/?home=1",
      label: m.app.website,
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
      toast.success(m.app.signedOut);
      navigate("/auth", { replace: true });
    } catch {
      toast.error(m.app.signOutFailed);
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
    "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl md:h-10 md:w-10";

  const localePicker = <LanguagePicker variant="icon" className="md:hidden" />;
  const homeActive = location.pathname === "/" || location.pathname === "/home";
  const homeLabel = m.app.home;

  return (
    <div className="pk-sidebar-root flex h-full w-full min-w-0 items-center bg-transparent md:h-auto md:w-auto md:flex-col md:justify-between md:px-2">
      <div className="flex min-w-0 flex-1 items-center md:w-full md:flex-col">
        <div className="pk-mobile-bottom-nav__routes pk-sidebar-rail-nav flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overscroll-x-contain px-1.5 py-1 [-webkit-overflow-scrolling:touch] md:flex-col md:overflow-visible md:px-0 md:py-0">
          <Link
            to="/?home=1"
            className={cn(
              "pk-studio-nav-link pk-mobile-home-mark shrink-0 md:hidden",
              mobileNavIconClass,
              homeActive ? "pk-studio-nav-link--active text-pk-accent" : "text-pk-muted hover:text-pk-text",
            )}
            aria-label={homeLabel}
            title={homeLabel}
          >
            {homeActive ? (
              <span
                className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-pk-accent"
                aria-hidden
              />
            ) : null}
            <SidebarIcon icon={Home} />
          </Link>
          {items.map((it) => {
            const active =
              it.to === "/?home=1"
                ? location.pathname === "/" || location.pathname === "/home"
                : location.pathname === it.to || (it.to !== "/" && location.pathname.startsWith(it.to + "/"));
            const locked = Boolean(it.locked);
            const navClass = cn(
              "pk-studio-nav-link",
              mobileNavIconClass,
              it.mobileHidden && "hidden md:flex",
              active ? "pk-studio-nav-link--active text-pk-accent" : "text-pk-muted hover:text-pk-text",
              locked && !active && "opacity-45",
            );
            const inner = (
              <>
                <span className="pk-studio-nav-indicator hidden md:block" aria-hidden />
                {active ? (
                  <span
                    className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-pk-accent md:hidden"
                    aria-hidden
                  />
                ) : null}
                {it.icon}
              </>
            );
            return (
              <div
                key={it.to}
                data-coach={it.to === "/library" ? "nav-library" : undefined}
                className={navClass}
                title={locked ? (locale === "fr" ? "Inclus Studio/Plus" : "Included Studio/Plus") : it.label}
              >
                {locked ? (
                  <button
                    type="button"
                    onClick={() => navigate("/learn/distribute-ai-music")}
                    className="flex h-full w-full items-center justify-center"
                    aria-label={it.label}
                  >
                    {inner}
                  </button>
                ) : (
                  <Link
                    to={it.to}
                    className="flex h-full w-full items-center justify-center"
                    aria-label={it.label}
                    title={it.label}
                  >
                    {inner}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div className="pk-sidebar-footer hidden md:flex md:flex-col md:items-center md:border-t md:border-white/[0.06]">
          {user ? <NotificationBell locale={locale} className="pk-sidebar-rail-slot" /> : null}
          <ThemeAndAccentPicker variant={CLOUD_THEME_ENABLED ? "sidebar-stack" : "nav-icon"} />
          {!CLOUD_THEME_ENABLED ? <LanguagePicker variant="sidebar" /> : null}
          {user ? (
            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              className="pk-sidebar-ctrl-btn"
              aria-label={m.app.logout}
              title={m.app.logout}
            >
              {logoutIcon}
            </button>
          ) : (
            <Link
              to={buildAuthUrl({ mode: "login", next: "/dashboard" })}
              className="pk-sidebar-ctrl-btn"
              aria-label={m.nav.login}
              title={m.nav.login}
            >
              <LogIn className={SIDEBAR_ICON_CLASS} {...SIDEBAR_ICON_PROPS} />
            </Link>
          )}
        </div>
      </div>

      <div className="pk-mobile-bottom-nav__actions flex shrink-0 items-center gap-0.5 border-l border-white/10 py-1 pl-1.5 pr-2 md:hidden">
        {user ? <NotificationBell locale={locale} className="pk-mobile-bottom-nav__action-slot shrink-0" /> : null}
        <ThemeAndAccentPicker
          variant={CLOUD_THEME_ENABLED ? "mobile" : "nav-icon"}
          className="pk-mobile-bottom-nav__action-slot shrink-0"
        />
        <div className="hidden md:block">{localePicker}</div>
        {user ? (
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="pk-sidebar-ctrl-btn pk-mobile-bottom-nav__action-slot shrink-0"
            aria-label={m.app.logout}
            title={m.app.logout}
          >
            {logoutIcon}
          </button>
        ) : (
          <Link
            to={buildAuthUrl({ mode: "login", next: "/dashboard" })}
            className="pk-sidebar-ctrl-btn pk-mobile-bottom-nav__action-slot shrink-0"
            aria-label={m.nav.login}
            title={m.nav.login}
          >
            <LogIn className={SIDEBAR_ICON_CLASS} {...SIDEBAR_ICON_PROPS} />
          </Link>
        )}
      </div>
    </div>
  );
}
