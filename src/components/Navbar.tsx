import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import { HeroCtaButton } from "@/components/landing/HeroCtaButton";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";

export function Navbar({ variant }: { variant: "marketing" | "auth" }) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isFr = locale === "fr";

  return (
    <header
      className={[
        "pk-marketing-navbar sticky top-0 z-20 border-b border-pk-border/70 backdrop-blur-xl pt-[env(safe-area-inset-top,0px)]",
        variant === "marketing" ? "bg-pk-bg/55" : "bg-pk-bg/80",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-base font-semibold tracking-tight text-pk-text">
          <span className="lowercase text-pk-text/90">producer</span>
          <span className="pk-navbar-logo-hit lowercase bg-gradient-to-r from-[#a78bfa] via-[#7c3aed] to-[#22d3ee] bg-clip-text text-transparent">hit</span>
        </Link>
        {variant === "marketing" ? (
          <nav className="hidden items-center gap-7 text-sm text-pk-muted md:flex">
            <Link to="/#how" className="hover:text-pk-text">
              {locale === "fr" ? "Comment ça marche" : "How it works"}
            </Link>
            <Link to="/#features" className="hover:text-pk-text">
              {locale === "fr" ? "Fonctionnalités" : "Features"}
            </Link>
            <Link to="/pricing" className="hover:text-pk-text">
              {locale === "fr" ? "Tarifs" : "Pricing"}
            </Link>
            <Link to="/community" className="hover:text-pk-text">
              {locale === "fr" ? "Communauté" : "Community"}
            </Link>
            <Link to="/blog" className="hover:text-pk-text">
              {locale === "fr" ? "Blog" : "Blog"}
            </Link>
            {user ? null : (
              <Link to="/auth" className="hover:text-pk-text">
                {locale === "fr" ? "Connexion" : "Login"}
              </Link>
            )}
            <ThemeToggleButton variant="icon" />
            <div className="inline-flex items-center gap-1 rounded-full border border-pk-border bg-white/5 px-1 py-1">
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={[
                  "h-8 rounded-full px-3 text-xs font-semibold transition-colors",
                  locale === "en" ? "bg-[#7c3aed] text-white" : "text-pk-muted hover:text-pk-text",
                ].join(" ")}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLocale("fr")}
                className={[
                  "h-8 rounded-full px-3 text-xs font-semibold transition-colors",
                  locale === "fr" ? "bg-[#7c3aed] text-white" : "text-pk-muted hover:text-pk-text",
                ].join(" ")}
              >
                FR
              </button>
            </div>
            {user ? (
              <Link
                to="/dashboard"
                className="pk-prism-btn inline-flex h-9 items-center justify-center rounded-full px-5 text-sm font-semibold"
              >
                {locale === "fr" ? "Dashboard" : "Dashboard"}
              </Link>
            ) : (
              <HeroCtaButton to="/auth" variant="spark" size="nav">
                {locale === "fr" ? "Essayer gratuit" : "Start Free"}
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
            aria-label={isFr ? "Menu navigation" : "Navigation menu"}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        ) : null}
      </div>

      {variant === "marketing" && mobileOpen ? (
        <nav
          className="border-t border-pk-border/70 bg-pk-bg/95 px-4 py-3 backdrop-blur-xl md:hidden"
          aria-label={isFr ? "Menu mobile" : "Mobile menu"}
        >
          <div className="flex flex-col gap-1.5">
            {user ? (
              <Link
                to="/dashboard"
                className="pk-prism-btn inline-flex h-10 items-center justify-center rounded-xl text-sm font-semibold"
                onClick={() => setMobileOpen(false)}
              >
                {isFr ? "Ouvrir le studio" : "Open studio"}
              </Link>
            ) : null}
            <Link to="/#how" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-pk-text hover:bg-white/5" onClick={() => setMobileOpen(false)}>
              {isFr ? "Comment ça marche" : "How it works"}
            </Link>
            <Link to="/#features" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-pk-text hover:bg-white/5" onClick={() => setMobileOpen(false)}>
              {isFr ? "Fonctionnalités" : "Features"}
            </Link>
            <Link to="/community" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-pk-text hover:bg-white/5" onClick={() => setMobileOpen(false)}>
              {isFr ? "Communauté" : "Community"}
            </Link>
            <Link to="/pricing" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-pk-text hover:bg-white/5" onClick={() => setMobileOpen(false)}>
              {isFr ? "Tarifs" : "Pricing"}
            </Link>
            <Link to="/blog" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-pk-text hover:bg-white/5" onClick={() => setMobileOpen(false)}>
              Blog
            </Link>
            {!user ? (
              <>
                <Link to="/auth" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-pk-text hover:bg-white/5" onClick={() => setMobileOpen(false)}>
                  {isFr ? "Connexion" : "Login"}
                </Link>
                <HeroCtaButton to="/auth" variant="spark" size="nav" className="w-full rounded-xl" onClick={() => setMobileOpen(false)}>
                  {isFr ? "Essayer gratuit" : "Start free"}
                </HeroCtaButton>
              </>
            ) : (
              <Link to="/?home=1" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-pk-muted hover:bg-white/5" onClick={() => setMobileOpen(false)}>
                {isFr ? "Page d’accueil" : "Home page"}
              </Link>
            )}
            <div className="mt-2 flex justify-center">
              <ThemeToggleButton variant="icon" className="rounded-xl" />
            </div>
            <div className="mt-1 inline-flex w-full items-center gap-1 rounded-full border border-pk-border bg-white/5 p-1">
              <button
                type="button"
                onClick={() => {
                  setLocale("en");
                  setMobileOpen(false);
                }}
                className={["flex-1 rounded-full px-3 py-1.5 text-xs font-semibold", locale === "en" ? "bg-[#7c3aed] text-white" : "text-pk-muted"].join(" ")}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocale("fr");
                  setMobileOpen(false);
                }}
                className={["flex-1 rounded-full px-3 py-1.5 text-xs font-semibold", locale === "fr" ? "bg-[#7c3aed] text-white" : "text-pk-muted"].join(" ")}
              >
                FR
              </button>
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
