import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { BrandLogo } from "@/components/landing/BrandLogo";

type Props = {
  locale: "en" | "fr";
  user: User | null;
};

export function LandingFooter({ locale, user }: Props) {
  const isFr = locale === "fr";

  const productLinks = [
    { to: "/dashboard", label: isFr ? "Générateur" : "Generator" },
    { to: "/community", label: isFr ? "Communauté" : "Community" },
    { to: "/pricing", label: isFr ? "Tarifs" : "Pricing" },
    { to: "/blog", label: "Blog" },
  ];

  const seoLinks = [
    { to: isFr ? "/generateur-music-ai" : "/music-ai-generator", label: "Music AI Generator" },
    { to: isFr ? "/generateur-musique-ia-gratuit" : "/free-music-ai-generator", label: isFr ? "Musique IA gratuit" : "Free Music AI" },
    { to: isFr ? "/musique-sommeil-ia" : "/ai-sleep-music-generator", label: isFr ? "Musique sommeil" : "Sleep Music AI" },
    { to: isFr ? "/musique-etude-ia" : "/ai-study-music-generator", label: isFr ? "Musique étude" : "Study Music AI" },
    { to: "/ai-beat-generator", label: "AI Beat Generator" },
    { to: "/ai-trap-beat-generator", label: "Trap AI" },
    { to: "/ai-lofi-beat-generator", label: "Lo-Fi AI" },
    { to: "/ai-music-generator", label: "AI Music Generator" },
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
    <footer className="pk-landing-footer relative z-[1] border-t border-white/[0.06] bg-[#04030a]">
      <div className="mx-auto max-w-6xl px-4 py-12 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <BrandLogo compact />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              {isFr
                ? "Générateur IA de chansons et type beats — studio quality, release-ready."
                : "AI song & type beat generator — studio quality, release-ready output."}
            </p>
            <p className="mt-4 text-xs font-semibold text-white/35">Powered by ACE-Step</p>
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

        <div className="mt-10 flex flex-col gap-4 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-white/50">© 2026 ProducerHit</span>
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
