import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { buildAuthUrl } from "@/lib/authRoutes";
import { useT } from "@/i18n";
import { useAuthStore } from "@/stores/authStore";
import { HeroCtaButton } from "@/components/landing/HeroCtaButton";
import { ThemeAndAccentPicker } from "@/components/ThemeAndAccentPicker";
import { BrandLogo } from "@/components/landing/BrandLogo";
import { LanguagePicker } from "@/components/LanguagePicker";
import { discordCommunityUrl } from "@/lib/discordConfig";

export function Navbar({ variant }: { variant: "marketing" | "auth" }) {
  const { m } = useT();
  const user = useAuthStore((s) => s.user);
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
          <nav className="hidden items-center gap-7 text-sm text-pk-muted md:flex">
            <Link to="/#how" className="hover:text-pk-text">
              {m.nav.howItWorks}
            </Link>
            <Link to="/#features" className="hover:text-pk-text">
              {m.nav.features}
            </Link>
            <Link to="/pricing" className="hover:text-pk-text">
              {m.nav.pricing}
            </Link>
            <Link to="/community" className="hover:text-pk-text">
              {m.nav.community}
            </Link>
            <a
              href={discordCommunityUrl("navbar")}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pk-text"
            >
              Discord
            </a>
            <Link to="/blog" className="hover:text-pk-text">
              {m.nav.blog}
            </Link>
            {user ? null : (
              <Link to={buildAuthUrl({ mode: "login" })} className="hover:text-pk-text">
                {m.nav.login}
              </Link>
            )}
            <ThemeAndAccentPicker variant="nav-icon" />
            <LanguagePicker />
            {user ? (
              <Link
                to="/dashboard"
                className="pk-prism-btn inline-flex h-9 items-center justify-center rounded-full px-5 text-sm font-semibold"
              >
                Dashboard
              </Link>
            ) : (
              <HeroCtaButton to={buildAuthUrl()} variant="spark" size="nav">
                {m.nav.startFree}
              </HeroCtaButton>
            )}
          </nav>
        ) : null}
        {variant === "marketing" ? (
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-pk-border bg-white/5 text-pk-text md:hidden"
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
              <Link
                to="/dashboard"
                className="pk-prism-btn inline-flex h-10 items-center justify-center rounded-xl text-sm font-semibold"
                onClick={() => setMobileOpen(false)}
              >
                {m.nav.openStudio}
              </Link>
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
                <HeroCtaButton to={buildAuthUrl()} variant="spark" size="nav" className="w-full rounded-xl" onClick={() => setMobileOpen(false)}>
                  {m.nav.startFree}
                </HeroCtaButton>
              </>
            ) : (
              <Link to="/?home=1" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-pk-muted hover:bg-white/5" onClick={() => setMobileOpen(false)}>
                {m.nav.homePage}
              </Link>
            )}
            <div className="mt-2 flex justify-center">
              <ThemeAndAccentPicker variant="nav-icon" className="rounded-xl" />
            </div>
            <LanguagePicker variant="mobile" onChange={() => setMobileOpen(false)} />
          </div>
        </nav>
      ) : null}
    </header>
  );
}
