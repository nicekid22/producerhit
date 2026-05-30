import { Link } from "react-router-dom";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import { HeroCtaButton } from "@/components/landing/HeroCtaButton";

export function Navbar({ variant }: { variant: "marketing" | "auth" }) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const user = useAuthStore((s) => s.user);

  return (
    <header
      className={[
        "sticky top-0 z-20 border-b border-pk-border/70 backdrop-blur-xl",
        variant === "marketing" ? "bg-pk-bg/55" : "bg-pk-bg/80",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-base font-semibold tracking-tight text-pk-text">
          <span className="lowercase text-pk-text/90">producer</span>
          <span className="lowercase bg-gradient-to-r from-[#a78bfa] via-[#7c3aed] to-[#22d3ee] bg-clip-text text-transparent">hit</span>
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
          user ? (
            <Link
              to="/dashboard"
              className="pk-prism-btn md:hidden inline-flex h-9 items-center justify-center rounded-full px-5 text-sm font-semibold"
            >
              {locale === "fr" ? "Dashboard" : "Dashboard"}
            </Link>
          ) : (
            <HeroCtaButton to="/auth" variant="spark" size="nav" className="md:hidden">
              {locale === "fr" ? "Essayer gratuit" : "Start Free"}
            </HeroCtaButton>
          )
        ) : null}
      </div>
    </header>
  );
}
