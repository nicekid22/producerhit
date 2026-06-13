import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { BrandLogo } from "@/components/landing/BrandLogo";
import { SocialIconLinks } from "@/components/landing/SocialIconLinks";
import { landingCopy } from "@/lib/landingContent";

type Props = {
  locale: "en" | "fr";
  user: User | null;
};

export function LandingFooter({ locale, user }: Props) {
  const isFr = locale === "fr";
  const copy = landingCopy(locale);

  const productLinks = [
    { to: "/dashboard", label: isFr ? "Générateur" : "Generator" },
    { to: "/community", label: isFr ? "Communauté" : "Community" },
    { to: "/pricing", label: isFr ? "Tarifs" : "Pricing" },
    { to: "/blog", label: "Blog" },
  ];

  const seoLinks = [
    { to: isFr ? "/generateur-music-ai" : "/music-ai-generator", label: "Music AI Generator" },
    { to: isFr ? "/generateur-musique-ia-gratuit" : "/free-music-ai-generator", label: isFr ? "Musique IA gratuit" : "Free Music AI" },
    { to: isFr ? "/texte-en-musique-ia" : "/text-to-music-ai-generator", label: isFr ? "Texte → musique" : "Text to Music AI" },
    { to: isFr ? "/musique-sommeil-ia" : "/ai-sleep-music-generator", label: isFr ? "Sommeil" : "Sleep AI" },
    { to: isFr ? "/musique-etude-ia" : "/ai-study-music-generator", label: isFr ? "Étude" : "Study AI" },
    { to: isFr ? "/musique-concentration-ia" : "/ai-focus-music-generator", label: isFr ? "Focus" : "Focus AI" },
    { to: isFr ? "/musique-meditation-ia" : "/ai-meditation-music-generator", label: isFr ? "Méditation" : "Meditation AI" },
    { to: "/ai-beat-generator", label: "AI Beat Generator" },
    { to: isFr ? "/generateur-chanson-ia" : "/ai-song-generator", label: isFr ? "Chanson IA" : "AI Song Generator" },
    { to: isFr ? "/generateur-musique-latine-ia" : "/latin-music-generator", label: isFr ? "Musique latine IA" : "Latin Music AI" },
    { to: isFr ? "/generateur-chanson-ia-par-genre" : "/ai-song-generator-by-genre", label: isFr ? "Par genre" : "By Genre Hub" },
    { to: isFr ? "/generateur-musique-asie-ia" : "/asia-music-generator", label: isFr ? "Musique Asie IA" : "Asia Music AI" },
    { to: isFr ? "/generateur-musique-moyen-orient-ia" : "/middle-east-music-generator", label: isFr ? "Moyen-Orient IA" : "Middle East AI" },
    { to: isFr ? "/generateur-k-pop-ia" : "/ai-k-pop-song-generator", label: "K-Pop AI" },
    { to: "/ai-trap-beat-generator", label: "Trap AI" },
    { to: "/ai-lofi-beat-generator", label: "Lo-Fi AI" },
    { to: "/ai-phonk-beat-generator", label: "Phonk AI" },
  ];

  const compareLinks = [
    { to: "/suno-alternatives", label: isFr ? "Alternatives Suno" : "Suno Alternatives" },
    { to: isFr ? "/alternatives-generateur-chanson-ia" : "/ai-song-generator-alternatives", label: isFr ? "Générateur chanson IA" : "AI Song Generator" },
    { to: isFr ? "/alternatives-udio" : "/udio-alternatives", label: isFr ? "Alternatives Udio" : "Udio Alternatives" },
    { to: isFr ? "/remix-cover-ia" : "/remix-cover-ai", label: isFr ? "Remix & Cover IA" : "AI Remix & Cover" },
    { to: isFr ? "/musique-ia-spotify-ready" : "/spotify-ready-ai-music", label: isFr ? "Spotify Ready" : "Spotify Ready" },
    { to: isFr ? "/alternatives-mubert" : "/mubert-alternatives", label: isFr ? "Alternatives Mubert" : "Mubert Alternatives" },
    { to: "/beatoven-alternatives", label: isFr ? "Alternatives Beatoven" : "Beatoven Alternatives" },
    { to: isFr ? "/meilleur-generateur-beats-ia-producteurs" : "/best-ai-beat-generator-for-producers", label: isFr ? "Meilleur beats IA" : "Best Beat AI" },
    { to: isFr ? "/comparatif-generateur-musique-ia-2026" : "/ai-music-generator-comparison-2026", label: isFr ? "Comparatif IA 2026" : "AI Comparison 2026" },
  ];

  const legalLinks = [
    { to: "/legal#privacy", label: "Privacy" },
    { to: "/legal#terms", label: isFr ? "Conditions" : "Terms" },
    { to: "/legal#cookies", label: "Cookies" },
    { to: "/legal#refunds", label: isFr ? "Remboursements" : "Refunds" },
    { to: "/legal#contact", label: isFr ? "Support" : "Support" },
  ];

  return (
    <footer className="pk-landing-footer relative z-[1]">
      <div className="relative z-[1] mx-auto max-w-6xl px-4 py-12 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] sm:py-14 sm:pb-[calc(2.25rem+env(safe-area-inset-bottom,0px))] md:py-16 md:pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <BrandLogo compact />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              {isFr
                ? "Générateur IA de chansons et type beats — studio quality, release-ready."
                : "AI song & type beat generator — studio quality, release-ready output."}
            </p>
            <p className="mt-4 text-xs font-medium tracking-wide text-white/45">Powered by ACE-Step</p>
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">{copy.footerSocialLabel}</p>
              <SocialIconLinks locale={locale} variant="footer" className="mt-3" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4 md:col-span-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">{isFr ? "Produit" : "Product"}</h3>
              <ul className="mt-4 space-y-2.5">
                {productLinks.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-white/65 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">SEO</h3>
              <ul className="mt-4 space-y-2.5">
                {seoLinks.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-white/65 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">{isFr ? "Comparatifs" : "Compare"}</h3>
              <ul className="mt-4 space-y-2.5">
                {compareLinks.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-white/65 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">{isFr ? "Légal" : "Legal"}</h3>
              <ul className="mt-4 space-y-2.5">
                {legalLinks.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-white/65 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/[0.08] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-white/50">
            Made with <span className="pk-footer-heart" aria-hidden>♥</span> © 2026 ProducerHit
          </span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to={user ? "/dashboard" : "/auth"} className="text-sm font-semibold text-[var(--prism-cyan)] hover:text-white">
              {user ? "Dashboard" : isFr ? "Commencer gratuitement" : "Start free"}
            </Link>
            <Link to="/legal" className="text-sm text-white/50 hover:text-white">
              {isFr ? "Mentions légales" : "Legal"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
