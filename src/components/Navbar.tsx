import { Link } from "react-router-dom";
import { useLocaleStore } from "@/stores/localeStore";

export function Navbar({ variant }: { variant: "marketing" | "auth" }) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <header
      className={[
        "sticky top-0 z-10 border-b border-[#e5e7eb]",
        variant === "marketing" ? "bg-white/60 backdrop-blur" : "bg-white",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-base font-semibold tracking-tight text-[#1a1a2e]">
          <span className="lowercase">producer</span>
          <span className="lowercase text-[#6d28d9]">hit</span>
        </Link>
        {variant === "marketing" ? (
          <nav className="hidden items-center gap-7 text-sm text-[#6b7280] md:flex">
            <a href="#how" className="hover:text-[#1a1a2e]">
              {locale === "fr" ? "Comment ça marche" : "How it works"}
            </a>
            <a href="#features" className="hover:text-[#1a1a2e]">
              {locale === "fr" ? "Fonctionnalités" : "Features"}
            </a>
            <Link to="/pricing" className="hover:text-[#1a1a2e]">
              {locale === "fr" ? "Tarifs" : "Pricing"}
            </Link>
            <Link to="/auth" className="hover:text-[#1a1a2e]">
              {locale === "fr" ? "Connexion" : "Login"}
            </Link>
            <div className="inline-flex items-center gap-1 rounded-full border border-[#e5e7eb] bg-white px-1 py-1">
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={[
                  "h-8 rounded-full px-3 text-xs font-semibold transition-colors",
                  locale === "en" ? "bg-[#6d28d9] text-white" : "text-[#6b7280] hover:text-[#1a1a2e]",
                ].join(" ")}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLocale("fr")}
                className={[
                  "h-8 rounded-full px-3 text-xs font-semibold transition-colors",
                  locale === "fr" ? "bg-[#6d28d9] text-white" : "text-[#6b7280] hover:text-[#1a1a2e]",
                ].join(" ")}
              >
                FR
              </button>
            </div>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-[12px] bg-[#6d28d9] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5b21b6]"
            >
              {locale === "fr" ? "Essayer gratuit" : "Start Free"}
            </Link>
          </nav>
        ) : null}
        {variant === "marketing" ? (
          <Link
            to="/auth"
            className="md:hidden inline-flex items-center justify-center rounded-[12px] bg-[#6d28d9] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5b21b6]"
          >
            {locale === "fr" ? "Essayer gratuit" : "Start Free"}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
