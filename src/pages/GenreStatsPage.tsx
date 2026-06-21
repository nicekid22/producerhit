import { Link } from "react-router-dom";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import { GENRE_STATS_SNAPSHOT } from "@/lib/marketing/genreStatsSnapshot";
import { getGenreStatsPageSeo } from "@/lib/marketing/phase2PagesSeo";
import { buildSignupUrl } from "@/lib/growthLinks";

export default function GenreStatsPage() {
  const locale = useLocaleStore((s) => s.locale);
  const user = useAuthStore((s) => s.user);
  const isFr = locale === "fr";
  const seo = getGenreStatsPageSeo(locale);
  const snap = GENRE_STATS_SNAPSHOT;
  const insights = isFr ? snap.insights.fr : snap.insights.en;
  const ctaHref = user ? "/dashboard" : buildSignupUrl("organic");

  return (
    <MarketingPageShell>
      <Navbar variant="marketing" />
      <article className="mx-auto max-w-3xl px-4 py-16 text-white/90">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/80">
          {isFr ? "Données exclusives · GEO" : "Original data · GEO"}
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{seo.h1}</h1>
        <p className="mt-4 text-base leading-relaxed text-white/70">{seo.description}</p>
        <p className="mt-2 text-sm text-white/45">
          {isFr ? "Dernière mise à jour :" : "Last updated:"} {snap.generatedAt} ·{" "}
          {isFr
            ? `${snap.totalLoops.toLocaleString("fr-FR")} morceaux analysés (${snap.publicLoops.toLocaleString("fr-FR")} publics)`
            : `${snap.totalLoops.toLocaleString()} tracks analyzed (${snap.publicLoops.toLocaleString()} public)`}
        </p>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-white">{isFr ? "Définition" : "Definition"}</h2>
          <p className="mt-3 leading-relaxed text-white/75">
            {isFr ? (
              <>
                Un <strong>générateur de musique IA</strong> produit des instrumentaux ou chansons à partir de prompts texte.
                Cette page résume les <strong>genres réellement générés</strong> par les producteurs sur ProducerHit — pas une enquête
                tierce.
              </>
            ) : (
              <>
                An <strong>AI music generator</strong> creates instrumentals or songs from text prompts. This page summarizes{" "}
                <strong>genres actually generated</strong> by producers on ProducerHit — not a third-party survey.
              </>
            )}
          </p>
        </section>

        <section className="mt-10 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/15 bg-white/[0.03] text-white/50">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">{isFr ? "Genre" : "Genre"}</th>
                <th className="px-4 py-3 font-semibold">{isFr ? "Morceaux" : "Tracks"}</th>
                <th className="px-4 py-3 font-semibold">%</th>
              </tr>
            </thead>
            <tbody>
              {snap.topGenres.map((row, i) => (
                <tr key={row.genre} className="border-b border-white/8 text-white/85">
                  <td className="px-4 py-2.5 text-white/40">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium">{row.genre}</td>
                  <td className="px-4 py-2.5 tabular-nums">{row.count.toLocaleString(isFr ? "fr-FR" : "en-US")}</td>
                  <td className="px-4 py-2.5 tabular-nums text-violet-200/90">{row.sharePct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-white">{isFr ? "Insights clés" : "Key insights"}</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-white/75">
            {insights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-bold text-white">{isFr ? "Méthodologie" : "Methodology"}</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/60">
            <li>{isFr ? "Source : table `loops` ProducerHit (production)." : "Source: ProducerHit production `loops` table."}</li>
            <li>{isFr ? "Genres normalisés (lowercase, trim)." : "Genres normalized (lowercase, trim)."}</li>
            <li>{isFr ? "Regénération : `npm run genre-stats:sync`" : "Regenerate: `npm run genre-stats:sync`"}</li>
          </ul>
          <p className="mt-4 text-sm">
            <Link to="/for-ai" className="text-violet-300 hover:underline">
              /for-ai
            </Link>
            {" · "}
            <Link to="/ai-beat-name-generator" className="text-violet-300 hover:underline">
              {isFr ? "Générateur noms beats" : "Beat name generator"}
            </Link>
            {" · "}
            <Link to="/suno-alternatives" className="text-violet-300 hover:underline">
              {isFr ? "Alternatives Suno" : "Suno alternatives"}
            </Link>
          </p>
        </section>

        <div className="mt-10">
          <Link
            to={ctaHref}
            className="inline-flex rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500"
          >
            {isFr ? "Générer dans un de ces genres" : "Generate in one of these genres"}
          </Link>
        </div>
      </article>
      <LandingFooter locale={locale} user={user} />
    </MarketingPageShell>
  );
}
