import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import { COMPARISON_PAGES, getComparisonByPath, getComparisonLocaleForPath, getComparisonCanonicalPath } from "@/lib/seoComparisons";
import { buildSignupUrl } from "@/lib/growthLinks";

export default function ComparePage() {
  const { pathname } = useLocation();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const user = useAuthStore((s) => s.user);
  const isFr = locale === "fr";

  useEffect(() => {
    const page = getComparisonByPath(pathname);
    if (!page) return;
    const pathLocale = getComparisonLocaleForPath(pathname);
    if (pathLocale !== locale) setLocale(pathLocale);
  }, [pathname, locale, setLocale]);

  const page = useMemo(() => getComparisonByPath(pathname), [pathname]);

  const relatedPages = useMemo(() => {
    if (!page) return COMPARISON_PAGES.filter((p) => p.path !== pathname).slice(0, 4);
    return page.relatedPaths
      .map((path) => COMPARISON_PAGES.find((p) => p.path === path))
      .filter(Boolean)
      .slice(0, 4) as typeof COMPARISON_PAGES;
  }, [page, pathname]);

  const ctaHref = user ? "/dashboard" : buildSignupUrl("organic");

  if (!page) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <Navbar variant="marketing" />
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <p className="text-white/70">{isFr ? "Page introuvable." : "Page not found."}</p>
          <Link to="/" className="mt-6 inline-block text-[#a78bfa] hover:underline">
            {isFr ? "Retour à l’accueil" : "Back home"}
          </Link>
        </div>
        <LandingFooter locale={locale} user={user} />
      </div>
    );
  }

  const h1 = isFr ? page.h1Fr : page.h1En;
  const verdict = isFr ? page.verdictFr : page.verdictEn;
  const chooseUs = isFr ? page.chooseUsFr : page.chooseUsEn;
  const chooseThem = isFr ? page.chooseThemFr : page.chooseThemEn;
  const faq = isFr ? page.faqFr : page.faqEn;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar variant="marketing" />
      <div className="mx-auto max-w-5xl px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a78bfa]">
          {page.kind === "guide"
            ? isFr
              ? "Guide · mis à jour"
              : "Guide · updated"
            : isFr
              ? "Comparatif · mis à jour"
              : "Comparison · updated"}{" "}
          {page.updatedAt}
        </p>
        <h1 className="mt-4 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">{h1}</h1>

        <div className="mt-6 rounded-2xl border border-[#7c3aed]/30 bg-[#7c3aed]/10 p-6">
          <p className="text-sm font-semibold text-[#c4b5fd]">{isFr ? "Réponse rapide" : "Quick answer"}</p>
          <p className="mt-2 text-base leading-relaxed text-white/85">{verdict}</p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: isFr ? "Song Mode" : "Song Mode",
              desc: isFr ? "Chansons voix incluses, qualité studio" : "Full songs with vocals, studio-quality mix",
            },
            {
              title: "Remix",
              desc: isFr ? "Covers IA depuis ton audio (ACE)" : "AI covers from your audio (ACE)",
            },
            {
              title: isFr ? "Type Beat" : "Type Beat",
              desc: isFr ? "Instrumentaux producteur, BPM & seeds" : "Producer instrumentals, BPM & seeds",
            },
            {
              title: isFr ? "Cover & export" : "Cover & export",
              desc: isFr ? "Cover art auto, mastering, MP3/WAV" : "Auto cover art, mastering, MP3/WAV",
            },
          ].map((pillar) => (
            <div key={pillar.title} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-sm font-bold text-white">{pillar.title}</div>
              <p className="mt-1 text-xs leading-relaxed text-white/60">{pillar.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-white/40">
          {isFr
            ? "ProducerHit n’est affilié ni à Suno, ni à Udio, ni à Beatoven.ai. Infos basées sur les fonctionnalités publiques — vérifie les conditions de licence avant toute sortie commerciale."
            : "ProducerHit is not affiliated with Suno, Udio, or Beatoven.ai. Info based on public features — verify licensing terms before commercial release."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to={page.path}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${pathname === page.path ? "bg-white/15 text-white" : "text-white/50 hover:text-white"}`}
          >
            English
          </Link>
          <Link
            to={page.pathFr}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${pathname === page.pathFr ? "bg-white/15 text-white" : "text-white/50 hover:text-white"}`}
          >
            Français
          </Link>
        </div>

        <div className="mt-12 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04]">
                <th className="px-4 py-3 font-semibold text-white/60">{isFr ? "Critère" : "Feature"}</th>
                {page.columns.map((col) => (
                  <th
                    key={col.id}
                    className={`px-4 py-3 font-semibold ${col.highlight ? "text-[#c4b5fd]" : "text-white/80"}`}
                  >
                    {isFr ? col.labelFr : col.labelEn}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {page.matrix.map((row) => (
                <tr key={row.labelEn} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-white/70">{isFr ? row.labelFr : row.labelEn}</td>
                  {page.columns.map((col) => (
                    <td
                      key={col.id}
                      className={`px-4 py-3 ${col.highlight ? "text-white font-medium" : "text-white/65"}`}
                    >
                      {row.values[col.id] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#7c3aed]/25 bg-[#7c3aed]/5 p-6">
            <h2 className="text-lg font-bold text-[#c4b5fd]">
              {isFr ? "Choisis ProducerHit si…" : "Choose ProducerHit if…"}
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              {chooseUs.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[#a78bfa]">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-bold text-white/90">
              {isFr ? "Choisis l’alternative si…" : "Choose the alternative if…"}
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              {chooseThem.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-white/40">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg font-semibold">{isFr ? "Teste ProducerHit — gratuit" : "Try ProducerHit — free"}</div>
          <p className="mt-2 text-sm text-white/70">
            {isFr
              ? "Génère deux versions, choisis la meilleure, puis itère avec Variation."
              : "Generate two versions, pick the best, then iterate with Variation."}
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
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/90 hover:border-white/30"
            >
              {isFr ? "Voir les tarifs" : "View pricing"}
            </Link>
          </div>
        </div>

        {faq.length ? (
          <div className="mt-14">
            <h2 className="text-2xl font-bold tracking-tight">FAQ</h2>
            <div className="mt-6 grid gap-3">
              {faq.map((f) => (
                <details key={f.q} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <summary className="cursor-pointer text-sm font-semibold text-white">{f.q}</summary>
                  <p className="mt-3 text-sm text-white/70">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        ) : null}

        {relatedPages.length ? (
          <div className="mt-14">
            <h2 className="text-lg font-semibold text-white/90">{isFr ? "Autres comparatifs" : "More comparisons"}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {relatedPages.map((p) => (
                <Link
                  key={p.path}
                  to={p.path}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/70 hover:border-white/20 hover:text-white"
                >
                  {isFr ? p.h1Fr : p.h1En}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <LandingFooter locale={locale} user={user} />
    </div>
  );
}
