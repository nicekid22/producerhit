import { Link } from "react-router-dom";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Navbar } from "@/components/Navbar";
import { useT } from "@/i18n";

export default function NotFound() {
  const { m, locale } = useT();
  const isFr = locale === "fr";

  return (
    <MarketingPageShell>
      <Navbar variant="marketing" />
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--prism-cyan)]">404</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {isFr ? "Page introuvable" : "Page not found"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/58">
          {isFr
            ? "Ce lien n’existe pas ou a été déplacé. Retourne à l’accueil ou ouvre le studio."
            : "This link doesn’t exist or was moved. Head back home or open the studio."}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="pk-prism-btn inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          >
            {m.nav.homePage}
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex rounded-xl border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10"
          >
            {m.nav.openStudio}
          </Link>
        </div>
      </main>
    </MarketingPageShell>
  );
}
