import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Dice5, Sparkles } from "lucide-react";
import {
  buildStructuredCoverPrompt,
  pickCoverSurpriseSuggestion,
} from "@producerhit/shared";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/Button";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import { buildAuthUrl } from "@/lib/authRoutes";
import { getAlbumCoverGeneratorSeo } from "@/lib/marketing/phase1PagesSeo";
import { trackClientEvent } from "@/lib/supabaseClient";

const GENRES = [
  { id: "", en: "Any genre", fr: "Tous genres" },
  { id: "trap", en: "Trap", fr: "Trap" },
  { id: "drill", en: "Drill", fr: "Drill" },
  { id: "lo-fi", en: "Lo-fi", fr: "Lo-fi" },
  { id: "phonk", en: "Phonk", fr: "Phonk" },
  { id: "house", en: "House", fr: "House" },
  { id: "ambient", en: "Ambient", fr: "Ambient" },
  { id: "rnb", en: "R&B", fr: "R&B" },
  { id: "pop", en: "Pop", fr: "Pop" },
  { id: "rock", en: "Rock", fr: "Rock" },
] as const;

const FAQ = {
  en: [
    {
      q: "What size are ProducerHit AI album covers?",
      a: "Distribution covers are generated at 1400×1400 px — the standard for Spotify, Apple Music, and DistroKid uploads.",
    },
    {
      q: "Can I put text on the cover?",
      a: "No — our prompts are optimized for artwork without typography so your release stays readable at thumbnail size (64px on Spotify). Add title text in your distributor, not on the image.",
    },
    {
      q: "How do I get the actual image?",
      a: "Save a track in ProducerHit, open Pack distribution (Studio plan), use Cover Studio, then generate and validate. One credit per generation.",
    },
  ],
  fr: [
    {
      q: "Quelle taille pour les covers IA ProducerHit ?",
      a: "Les covers distribution sont en 1400×1400 px — standard Spotify, Apple Music et DistroKid.",
    },
    {
      q: "Peut-on mettre du texte sur la cover ?",
      a: "Non — nos prompts évitent la typo pour rester lisibles en vignette (64px sur Spotify). Le titre se met chez le distributeur, pas sur l'image.",
    },
    {
      q: "Comment obtenir l'image finale ?",
      a: "Sauvegarde un morceau, ouvre Pack distribution (plan Studio), utilise Cover Studio, génère et valide. 1 crédit par génération.",
    },
  ],
} as const;

export default function AlbumCoverGeneratorPage() {
  const locale = useLocaleStore((s) => s.locale);
  const user = useAuthStore((s) => s.user);
  const isFr = locale === "fr";
  const seo = getAlbumCoverGeneratorSeo(locale);
  const faq = isFr ? FAQ.fr : FAQ.en;

  const [genre, setGenre] = useState("");
  const [seed, setSeed] = useState(() => Date.now());
  const [idea, setIdea] = useState(() => pickCoverSurpriseSuggestion(undefined, { seed: Date.now() }));

  const prompt = useMemo(() => buildStructuredCoverPrompt(idea), [idea]);

  const surprise = useCallback(() => {
    const nextSeed = (Date.now() ^ seed) >>> 0;
    setSeed(nextSeed);
    const next = pickCoverSurpriseSuggestion(genre ? { genre } : undefined, { seed: nextSeed });
    setIdea(next);
    trackClientEvent("album_cover_generator_surprise", { genre: genre || "any" });
  }, [genre, seed]);

  const openStudio = () => {
    trackClientEvent("album_cover_generator_cta", { genre: genre || "any" });
    const next = user ? "/library" : buildAuthUrl({ mode: "signup", next: "/library" });
    window.location.href = next;
  };

  return (
    <MarketingPageShell>
      <Navbar variant="marketing" />
      <div className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/80">
          {isFr ? "Cover album · distribution" : "Album art · distribution"}
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{seo.h1}</h1>
        <p className="mt-4 text-base leading-relaxed text-white/70">{seo.description}</p>

        <div className="mt-8 rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-600/15 to-fuchsia-600/10 p-5">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-white/70">{isFr ? "Genre (optionnel)" : "Genre (optional)"}</span>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-violet-400/50"
            >
              {GENRES.map((g) => (
                <option key={g.id || "any"} value={g.id}>
                  {isFr ? g.fr : g.en}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={surprise}
            className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-violet-400/40 bg-violet-500/15 p-4 text-left transition hover:bg-violet-500/22"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
              <Dice5 className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-bold text-white">{isFr ? "Surprends-moi" : "Surprise me"}</span>
              <span className="mt-0.5 block text-sm text-white/60">
                {isFr ? "Une idée visuelle inédite à chaque clic" : "A fresh visual idea every tap"}
              </span>
            </span>
          </button>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/35 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/45">{isFr ? "Idée du moment" : "Current idea"}</p>
            <p className="mt-2 text-sm font-medium text-white/90">{idea.subject}</p>
            <p className="mt-1 text-xs text-white/50">
              {[idea.mood, idea.palette].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-3 rounded-lg bg-white/5 p-3 font-mono text-xs leading-relaxed text-violet-200/90">{prompt}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" className="gap-2" onClick={openStudio}>
              <Sparkles className="h-4 w-4" />
              {isFr ? "Générer la cover dans ProducerHit" : "Generate cover in ProducerHit"}
            </Button>
            <Button variant="secondary" className="gap-2" onClick={surprise}>
              <Dice5 className="h-4 w-4" />
              {isFr ? "Autre idée" : "Another idea"}
            </Button>
          </div>
        </div>

        <section className="mt-12" aria-labelledby="cover-faq">
          <h2 id="cover-faq" className="text-lg font-bold text-white">
            {isFr ? "Questions fréquentes" : "FAQ"}
          </h2>
          <dl className="mt-4 space-y-4">
            {faq.map((item) => (
              <div key={item.q} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <dt className="font-semibold text-white/90">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-white/65">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="mt-8 text-center text-sm text-white/45">
          {isFr ? "Inclus dans le plan Studio avec Pack distribution et Academy." : "Included with Studio plan — distribution pack & Academy."}
        </p>
        <p className="mt-4 text-center text-sm">
          <Link to="/learn/distribute-ai-music" className="text-violet-300 hover:underline">
            {isFr ? "Guide distribution IA" : "AI distribution guide"}
          </Link>
          {" · "}
          <Link to="/ai-beat-name-generator" className="text-white/40 hover:text-white/60">
            {isFr ? "Noms de beats" : "Beat names"}
          </Link>
        </p>
      </div>
      <LandingFooter locale={locale} user={user} />
    </MarketingPageShell>
  );
}
