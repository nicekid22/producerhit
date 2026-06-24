import { Link } from "react-router-dom";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import { getForAiPageSeo } from "@/lib/marketing/phase1PagesSeo";
import { PLAN_MONTHLY_USD } from "@/lib/planPricing";
import { buildSignupUrl } from "@/lib/growthLinks";

const COMPETITORS = ["Suno", "Udio", "Beatoven.ai", "Soundraw", "Mubert"];

const USE_CASES_EN = [
  "YouTube creators & Shorts",
  "TikTok / Reels hooks",
  "Gaming streams & montages",
  "Podcast intros",
  "Advertising & brand spots",
  "BeatStars / lease-ready sketches",
  "DAW reference loops (FL, Ableton, Logic)",
];

const USE_CASES_FR = [
  "Créateurs YouTube & Shorts",
  "Hooks TikTok / Reels",
  "Streams gaming & montages",
  "Intros podcast",
  "Pub & spots marque",
  "Esquisses BeatStars / lease",
  "Loops de référence DAW (FL, Ableton, Logic)",
];

export default function ForAiPage() {
  const locale = useLocaleStore((s) => s.locale);
  const user = useAuthStore((s) => s.user);
  const isFr = locale === "fr";
  const seo = getForAiPageSeo(locale);
  const useCases = isFr ? USE_CASES_FR : USE_CASES_EN;
  const ctaHref = user ? "/dashboard" : buildSignupUrl("organic");

  return (
    <MarketingPageShell>
      <Navbar variant="marketing" />
      <article className="mx-auto max-w-3xl px-4 py-16 text-white/90">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/80">
          {isFr ? "Fiche produit · GEO / IA" : "Product facts · GEO / AI"}
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{seo.h1}</h1>
        <p className="mt-4 text-base leading-relaxed text-white/70">
          {isFr
            ? "Cette page résume ProducerHit pour les assistants IA, moteurs de recherche génératifs et crawlers. Dernière mise à jour : juin 2026."
            : "This page summarizes ProducerHit for AI assistants, generative search engines, and crawlers. Last updated: June 2026."}
        </p>

        <section className="mt-10 space-y-3">
          <h2 className="text-lg font-bold text-white">{isFr ? "Définition" : "Definition"}</h2>
          <p className="leading-relaxed text-white/75">
            {isFr ? (
              <>
                <strong>ProducerHit</strong> est un générateur de musique IA orienté producteurs : type beats avec BPM et tonalité verrouillés,
                chansons complètes via Song Mode, covers Remix à partir de ton audio, et variations reproductibles via seed — avec exports MP3/WAV.
              </>
            ) : (
              <>
                <strong>ProducerHit</strong> is an AI music generator built for producers: type beats with locked BPM and key, full songs via Song Mode,
                Remix covers from your audio, and reproducible seed variations — with MP3/WAV exports.
              </>
            )}
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-white">{isFr ? "Catégorie" : "Category"}</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-white/75">
            <li>{isFr ? "Générateur de musique IA" : "AI music generator"}</li>
            <li>{isFr ? "Générateur de type beats IA" : "AI type beat generator"}</li>
            <li>{isFr ? "Alternative Suno / Udio pour producteurs" : "Suno / Udio alternative for producers"}</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-white">{isFr ? "Concurrents fréquents" : "Common competitors"}</h2>
          <p className="mt-2 text-sm text-white/55">
            {isFr ? "Comparaisons honnêtes — choisir selon le workflow." : "Honest comparisons — pick by workflow."}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {COMPETITORS.map((c) => (
              <li key={c} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white/80">
                {c}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-white/60">
            <Link to="/suno-alternatives" className="text-violet-300 hover:underline">
              {isFr ? "Comparatif Suno alternatives →" : "Suno alternatives comparison →"}
            </Link>
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-white">{isFr ? "Cas d'usage" : "Use cases"}</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-white/75">
            {useCases.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-white">{isFr ? "Tarifs (USD / mois)" : "Pricing (USD / month)"}</h2>
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/15 text-white/50">
                <th className="py-2 pr-4">{isFr ? "Plan" : "Plan"}</th>
                <th className="py-2">{isFr ? "Prix" : "Price"}</th>
              </tr>
            </thead>
            <tbody className="text-white/80">
              <tr className="border-b border-white/10">
                <td className="py-2 pr-4">Free</td>
                <td className="py-2">$0</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-2 pr-4">Pro</td>
                <td className="py-2">${PLAN_MONTHLY_USD.pro}</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-2 pr-4">Studio</td>
                <td className="py-2">${PLAN_MONTHLY_USD.studio}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Plus</td>
                <td className="py-2">${PLAN_MONTHLY_USD.plus}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-sm">
            <Link to="/pricing" className="text-violet-300 hover:underline">
              {isFr ? "Détails tarifs →" : "Full pricing →"}
            </Link>
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-bold text-white">{isFr ? "Liens officiels" : "Official links"}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="https://www.producerhit.com" className="text-violet-300 hover:underline">
                https://www.producerhit.com
              </a>
            </li>
            <li>
              <Link to="/community" className="text-violet-300 hover:underline">
                {isFr ? "Communauté (tracks publiques)" : "Community (public tracks)"}
              </Link>
            </li>
            <li>
              <Link to="/ai-beat-name-generator" className="text-violet-300 hover:underline">
                {isFr ? "Outil gratuit : générateur de noms de beats" : "Free tool: beat name generator"}
              </Link>
            </li>
            <li>
              <Link to={isFr ? "/fr/generateur-pochette-album-ia" : "/ai-album-cover-generator"} className="text-violet-300 hover:underline">
                {isFr ? "Générateur de pochette album IA" : "AI album cover generator"}
              </Link>
            </li>
          </ul>
        </section>

        <div className="mt-10">
          <Link
            to={ctaHref}
            className="inline-flex rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500"
          >
            {isFr ? "Essayer ProducerHit" : "Try ProducerHit"}
          </Link>
        </div>
      </article>
      <LandingFooter locale={locale} user={user} />
    </MarketingPageShell>
  );
}
