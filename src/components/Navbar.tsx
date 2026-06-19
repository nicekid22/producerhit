import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { buildAuthUrl } from "@/lib/authRoutes";
import { normalizePlan } from "@/lib/billing";
import { useT } from "@/i18n";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { LandingMobileMenuFooter } from "@/components/landing/LandingMobileMenuFooter";
import { ThemeAndAccentPicker } from "@/components/ThemeAndAccentPicker";
import { BrandLogo } from "@/components/landing/BrandLogo";
import { LanguagePicker } from "@/components/LanguagePicker";
import { discordCommunityUrl } from "@/lib/discordConfig";

export function Navbar({ variant }: { variant: "marketing" | "auth" }) {
  const { m } = useT();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const plan = normalizePlan(profile?.plan);
  const showUpgrade = !!user && plan === "free";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className={[
        "pk-marketing-navbar sticky top-0 z-20 border-b border-pk-border/70 backdrop-blur-xl pt-[env(safe-area-inset-top,0px)]",
        variant === "marketing" ? "bg-pk-bg/55" : "bg-pk-bg/80",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <BrandLogo compact />
        {variant === "marketing" ? (
          <nav className="pk-header-chrome hidden md:flex" aria-label="Main">
            <div className="pk-header-chrome__links">
              <Link to="/#how" className="pk-header-chrome__link">
                {m.nav.howItWorks}
              </Link>
              <Link to="/#features" className="pk-header-chrome__link">
                {m.nav.features}
              </Link>
              <Link to="/pricing" className="pk-header-chrome__link">
                {m.nav.pricing}
              </Link>
              <Link to="/community" className="pk-header-chrome__link">
                {m.nav.community}
              </Link>
              <Link to="/trending" className="pk-header-chrome__link">
                {isFr ? "Trending" : "Trending"}
              </Link>
              <a
                href={discordCommunityUrl("navbar")}
                target="_blank"
                rel="noopener noreferrer"
                className="pk-header-chrome__link"
              >
                Discord
              </a>
              <Link to="/blog" className="pk-header-chrome__link">
                {m.nav.blog}
              </Link>
            </div>
            <div className="pk-header-chrome__cluster">
              {user ? (
                <>
                  {showUpgrade ? (
                    <Link
                      to="/pricing?plan=pro&checkout=1"
                      className="pk-header-chrome__cta pk-header-chrome__cta--ghost hidden sm:inline-flex"
                    >
                      {isFr ? "Passer Pro" : "Upgrade Pro"}
                    </Link>
                  ) : null}
                  <Link to="/dashboard" className="pk-header-chrome__cta pk-header-chrome__cta--primary">
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link to={buildAuthUrl({ mode: "login" })} className="pk-header-chrome__cta pk-header-chrome__cta--ghost">
                    {m.nav.login}
                  </Link>
                  <Link to={buildAuthUrl()} className="pk-header-chrome__cta pk-landing-header__gen-cta">
                    {m.nav.startFree}
                  </Link>
                </>
              )}
              <span className="pk-header-chrome__sep" aria-hidden />
              <div className="pk-header-chrome__tools">
                <ThemeAndAccentPicker variant="nav-icon" surface="header" />
                <LanguagePicker variant="nav" />
              </div>
            </div>
          </nav>
        ) : null}
        {variant === "marketing" ? (
          <button
            type="button"
            className="pk-header-chrome__pill pk-header-chrome__pill--icon inline-flex md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={m.nav.menu}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        ) : null}
      </div>

      {variant === "marketing" && mobileOpen ? (
        <nav
          className="border-t border-pk-border/70 bg-pk-bg/95 px-4 py-3 backdrop-blur-xl md:hidden"
          aria-label={m.nav.mobileMenu}
        >
          <div className="flex flex-col gap-1.5">
            {user ? (
              <>
                {showUpgrade ? (
                  <Link
                    to="/pricing?plan=pro&checkout=1"
                    className="pk-prism-btn inline-flex h-10 items-center justify-center rounded-xl text-sm font-semibold"
                    onClick={() => setMobileOpen(false)}
                  >
                    {isFr ? "Passer Pro — $8/mo" : "Upgrade Pro — $8/mo"}
                  </Link>
                ) : null}
                <Link
                  to="/dashboard"
                  className="pk-prism-btn inline-flex h-10 items-center justify-center rounded-xl text-sm font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  {m.nav.openStudio}
                </Link>
              </>
            ) : null}
            <Link to="/#how" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-pk-text hover:bg-white/5" onClick={() => setMobileOpen(false)}>
              {m.nav.howItWorks}
            </Link>
            <Link to="/#features" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-pk-text hover:bg-white/5" onClick={() => setMobileOpen(false)}>
              {m.nav.features}
            </Link>
            <Link to="/community" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-pk-text hover:bg-white/5" onClick={() => setMobileOpen(false)}>
              {m.nav.community}
            </Link>
            <Link to="/trending" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-pk-text hover:bg-white/5" onClick={() => setMobileOpen(false)}>
              {isFr ? "Trending" : "Trending"}
            </Link>
            <a
              href={discordCommunityUrl("navbar_mobile")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-pk-text hover:bg-white/5"
              onClick={() => setMobileOpen(false)}
            >
              Discord
            </a>
            <Link to="/pricing" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-pk-text hover:bg-white/5" onClick={() => setMobileOpen(false)}>
              {m.nav.pricing}
            </Link>
            <Link to="/blog" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-pk-text hover:bg-white/5" onClick={() => setMobileOpen(false)}>
              {m.nav.blog}
            </Link>
            {!user ? (
              <>
                <Link to={buildAuthUrl({ mode: "login" })} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-pk-text hover:bg-white/5" onClick={() => setMobileOpen(false)}>
                  {m.nav.login}
                </Link>
                <Link to={buildAuthUrl()} className="pk-landing-header__gen-cta w-full rounded-xl" onClick={() => setMobileOpen(false)}>
                  {m.nav.startFree}
                </Link>
              </>
            ) : (
              <Link to="/?home=1" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-pk-muted hover:bg-white/5" onClick={() => setMobileOpen(false)}>
                {m.nav.homePage}
              </Link>
            )}
            <LandingMobileMenuFooter onLocaleChange={() => setMobileOpen(false)} />
          </div>
        </nav>
      ) : null}
    </header>
  );
}
