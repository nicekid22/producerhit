import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { SeoLandingExtras } from "@/components/seo/SeoLandingExtras";
import { SeoCompetitiveEdge } from "@/components/seo/SeoCompetitiveEdge";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import {
  getSeoPageByPath,
  getSeoPageBySlugKey,
  getSeoPageCanonicalPath,
  getSeoPageLocaleForPath,
  SEO_PAGES,
} from "@/lib/seoPages";
import { getSeoLandingExtras } from "@/lib/seoLandingExtras";
import { buildSeoLandingCtaHref } from "@/lib/seoCta";

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

  const page = useMemo(() => {
    if (!seo) {
      return {
        h1: isFr ? "Générateur de beats IA" : "AI Beat Generator",
        lead: isFr
          ? "Génère des type beats et des chansons en ligne avec ProducerHit."
          : "Generate type beats and songs online with ProducerHit.",
        bullets: [isFr ? "Génération IA rapide" : "Fast AI music generation"],
        faq: [] as { q: string; a: string }[],
        promptHint: null as string | null,
      };
    }
    return {
      h1: isFr ? seo.h1Fr : seo.h1En,
      lead: isFr ? seo.leadFr : seo.leadEn,
      bullets: isFr ? seo.bulletsFr : seo.bulletsEn,
      faq: isFr ? seo.faqFr : seo.faqEn,
      promptHint: isFr ? (seo.promptHintFr ?? null) : (seo.promptHintEn ?? null),
    };
  }, [isFr, seo]);

  const relatedPages = useMemo(() => {
    if (!seo) return SEO_PAGES.filter((p) => p.path !== pathname && p.pathFr !== pathname).slice(0, 6);
    const keys = seo.relatedSlugKeys?.length
      ? seo.relatedSlugKeys
      : SEO_PAGES.filter((p) => p.category === seo.category && p.slugKey !== seo.slugKey)
          .slice(0, 6)
          .map((p) => p.slugKey);
    return keys
      .map((key) => getSeoPageBySlugKey(key))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .slice(0, seo.relatedLimit ?? 6);
  }, [pathname, seo]);

  const extras = useMemo(() => (seo?.category ? getSeoLandingExtras(seo.category, isFr) : null), [seo, isFr]);

  const ctaHref = buildSeoLandingCtaHref(seo, { user: Boolean(user), pathname });

  return (
    <MarketingPageShell>
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

        {extras ? <SeoLandingExtras extras={extras} isFr={isFr} ctaHref={ctaHref} /> : null}

        {seo ? <SeoCompetitiveEdge isFr={isFr} compact /> : null}

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
    </MarketingPageShell>
  );
}
