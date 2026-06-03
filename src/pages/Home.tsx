import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import {
  getSeoPageByPath,
  getSeoPageBySlugKey,
  getSeoPageCanonicalPath,
  getSeoPageLocaleForPath,
  SEO_PAGES,
} from "@/lib/seoPages";
import { buildSignupUrl } from "@/lib/growthLinks";

export default function Home() {
  const { pathname } = useLocation();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const user = useAuthStore((s) => s.user);

  const seo = useMemo(() => getSeoPageByPath(pathname), [pathname]);
  const isFr = locale === "fr";

  useEffect(() => {
    if (!seo) return;
    const pathLocale = getSeoPageLocaleForPath(pathname);
    if (pathLocale !== locale) setLocale(pathLocale);
  }, [pathname, locale, seo, setLocale]);

  const t = (en: string, fr: string) => (isFr ? fr : en);

  const page = useMemo(() => {
    if (!seo) {
      return {
        h1: t("AI Beat Generator", "Générateur de beats IA"),
        lead: t(
          "Generate type beats and songs online with ProducerHit.",
          "Génère des type beats et des chansons en ligne avec ProducerHit.",
        ),
        bullets: [t("Fast AI music generation", "Génération IA rapide")],
        faq: [] as { q: string; a: string }[],
        promptHint: null as string | null,
      };
    }
    return {
      h1: t(seo.h1En, seo.h1Fr),
      lead: t(seo.leadEn, seo.leadFr),
      bullets: isFr ? seo.bulletsFr : seo.bulletsEn,
      faq: isFr ? seo.faqFr : seo.faqEn,
    };
  }, [isFr, seo, t]);

  const relatedPages = useMemo(() => {
    if (!seo) return SEO_PAGES.filter((p) => p.path !== pathname && p.pathFr !== pathname).slice(0, 6);
    return SEO_PAGES.filter((p) => p.slugKey !== seo.slugKey).slice(0, 6);
  }, [pathname, seo]);

  const ctaHref = user ? "/dashboard" : buildSignupUrl("organic");

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar variant="marketing" />
      <div className="mx-auto max-w-5xl px-4 py-16">
        {seo ? (
          <div className="mt-12 flex flex-wrap gap-2">
            <Link
              to={seo.path}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${pathname === seo.path ? "bg-white/15 text-white" : "text-white/50 hover:text-white"}`}
            >
              English
            </Link>
            <Link
              to={seo.pathFr}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${pathname === seo.pathFr ? "bg-white/15 text-white" : "text-white/50 hover:text-white"}`}
            >
              Français
            </Link>
          </div>
        ) : null}

        <h1 className={`text-balance text-4xl font-extrabold tracking-tight sm:text-5xl${seo ? " mt-4" : " mt-12"}`}>{page.h1}</h1>
        <p className="mt-5 max-w-3xl text-balance text-lg text-white/70">{page.lead}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {page.bullets.map((b) => (
            <div key={b} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
              {b}
            </div>
          ))}
        </div>

        {page.promptHint ? (
          <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.06] p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-cyan-200/70">
              {isFr ? "Prompt recommandé" : "Suggested prompt"}
            </div>
            <p className="mt-2 font-mono text-sm leading-relaxed text-white/85">{page.promptHint}</p>
          </div>
        ) : null}

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg font-semibold">{isFr ? "Essaye maintenant — gratuit" : "Try it now — free"}</div>
          <p className="mt-2 text-sm text-white/70">
            {isFr
              ? "Commence par une génération courte, active Versions=2, puis clique sur Variation sur le meilleur résultat."
              : "Start with a short generation, switch Versions=2, then click Variation on the best result."}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              to={ctaHref}
              className="inline-flex items-center justify-center rounded-full bg-[#7c3aed] px-6 py-3 text-sm font-semibold text-white hover:bg-[#6d28d9]"
            >
              {user ? (isFr ? "Ouvrir le générateur" : "Open generator") : isFr ? "Commencer gratuitement" : "Start free"}
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-transparent px-6 py-3 text-sm font-semibold text-white/90 hover:border-white/30 hover:text-white"
            >
              {isFr ? "Voir les plans" : "View plans"}
            </Link>
            <Link
              to="/community"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-transparent px-6 py-3 text-sm font-semibold text-white/90 hover:border-white/30 hover:text-white"
            >
              {isFr ? "Explorer la communauté" : "Explore community"}
            </Link>
          </div>
        </div>

        {page.faq.length ? (
          <div className="mt-14">
            <h2 className="text-2xl font-bold tracking-tight">FAQ</h2>
            <div className="mt-6 grid gap-3">
              {page.faq.map((f) => (
                <details key={f.q} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <summary className="cursor-pointer text-sm font-semibold text-white">{f.q}</summary>
                  <p className="mt-3 text-sm text-white/70">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-14">
          <h2 className="text-lg font-semibold text-white/90">{isFr ? "Autres générateurs IA" : "More AI generators"}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedPages.map((p) => (
              <Link
                key={p.slugKey}
                to={getSeoPageCanonicalPath(p, isFr ? "fr" : "en")}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/70 hover:border-white/20 hover:text-white"
              >
                {isFr ? p.h1Fr : p.h1En}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <LandingFooter locale={locale} user={user} />
    </div>
  );
}
