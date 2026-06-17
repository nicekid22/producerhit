import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { BrandLogo } from "@/components/landing/BrandLogo";
import { SocialIconLinks } from "@/components/landing/SocialIconLinks";
import { landingCopy } from "@/lib/landingContent";
import type { AppLocale } from "@/i18n/config";

type Props = {
  locale: AppLocale;
  user: User | null;
};

type FooterLink = { to: string; label: string };

function FooterNavColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="pk-landing-footer-v2__nav-title">{title}</h3>
      <ul className="pk-landing-footer-v2__nav-list">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="pk-landing-footer-v2__nav-link">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingFooter({ locale, user }: Props) {
  const isFr = locale === "fr";
  const copy = landingCopy(locale);

  const productLinks: FooterLink[] = [
    { to: "/dashboard", label: isFr ? "Générateur" : "Generator" },
    { to: "/community", label: isFr ? "Communauté" : "Community" },
    { to: "/pricing", label: isFr ? "Tarifs" : "Pricing" },
    { to: "/blog", label: "Blog" },
  ];

  const compareLinks: FooterLink[] = [
    { to: "/suno-alternatives", label: isFr ? "Alternatives Suno" : "Suno Alternatives" },
    { to: isFr ? "/alternatives-udio" : "/udio-alternatives", label: isFr ? "Alternatives Udio" : "Udio Alternatives" },
    { to: isFr ? "/remix-cover-ia" : "/remix-cover-ai", label: isFr ? "Remix & Cover IA" : "AI Remix & Cover" },
    { to: isFr ? "/musique-ia-spotify-ready" : "/spotify-ready-ai-music", label: "Spotify Ready" },
    { to: isFr ? "/comparatif-generateur-musique-ia-2026" : "/ai-music-generator-comparison-2026", label: isFr ? "Comparatif 2026" : "Comparison 2026" },
    { to: isFr ? "/meilleur-generateur-beats-ia-producteurs" : "/best-ai-beat-generator-for-producers", label: isFr ? "Meilleur beats IA" : "Best Beat AI" },
  ];

  const legalLinks: FooterLink[] = [
    { to: "/legal#privacy", label: "Privacy" },
    { to: "/legal#terms", label: isFr ? "Conditions" : "Terms" },
    { to: "/legal#cookies", label: "Cookies" },
    { to: "/legal#refunds", label: isFr ? "Remboursements" : "Refunds" },
    { to: "/legal#contact", label: "Support" },
  ];

  const guideLinks: FooterLink[] = [
    { to: isFr ? "/generateur-music-ai" : "/music-ai-generator", label: "Music AI Generator" },
    { to: isFr ? "/generateur-musique-ia-gratuit" : "/free-music-ai-generator", label: isFr ? "Musique IA gratuit" : "Free Music AI" },
    { to: isFr ? "/texte-en-musique-ia" : "/text-to-music-ai-generator", label: isFr ? "Texte → musique" : "Text to Music" },
    { to: isFr ? "/generateur-chanson-ia" : "/ai-song-generator", label: isFr ? "Chanson IA" : "AI Song" },
    { to: "/ai-beat-generator", label: "AI Beat" },
    { to: "/ai-trap-beat-generator", label: "Trap AI" },
    { to: "/ai-lofi-beat-generator", label: "Lo-Fi AI" },
    { to: "/ai-phonk-beat-generator", label: "Phonk AI" },
    { to: isFr ? "/generateur-k-pop-ia" : "/ai-k-pop-song-generator", label: "K-Pop AI" },
    { to: isFr ? "/musique-sommeil-ia" : "/ai-sleep-music-generator", label: isFr ? "Sommeil" : "Sleep" },
    { to: isFr ? "/musique-etude-ia" : "/ai-study-music-generator", label: isFr ? "Étude" : "Study" },
    { to: isFr ? "/musique-meditation-ia" : "/ai-meditation-music-generator", label: isFr ? "Méditation" : "Meditation" },
    { to: isFr ? "/generateur-chanson-ia-par-genre" : "/ai-song-generator-by-genre", label: isFr ? "Par genre" : "By genre" },
    { to: isFr ? "/alternatives-generateur-chanson-ia" : "/ai-song-generator-alternatives", label: isFr ? "Alt. chanson IA" : "Song alt." },
    { to: "/beatoven-alternatives", label: isFr ? "Alt. Beatoven" : "Beatoven alt." },
    { to: isFr ? "/alternatives-mubert" : "/mubert-alternatives", label: isFr ? "Alt. Mubert" : "Mubert alt." },
  ];

  return (
    <footer className="pk-landing-footer pk-landing-footer-v2 relative z-[1]">
      <div className="relative z-[1] mx-auto max-w-6xl px-4 py-12 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] sm:py-14 md:py-16">
        <div className="pk-landing-footer-v2__top">
          <div>
            <BrandLogo />
            <p className="pk-landing-footer-v2__brand-lead">
              {isFr
                ? "Générateur IA de chansons et type beats — qualité studio, prêt à publier."
                : "AI song & type beat generator — studio quality, release-ready."}
            </p>
            <p className="pk-landing-footer-v2__ace">Powered by ACE-Step</p>
            <p className="pk-landing-footer-v2__social-label">{copy.footerSocialLabel}</p>
            <SocialIconLinks locale={locale} variant="footer" className="mt-3" />
          </div>

          <div className="pk-landing-footer-v2__nav-grid">
            <FooterNavColumn title={isFr ? "Produit" : "Product"} links={productLinks} />
            <FooterNavColumn title={isFr ? "Comparatifs" : "Compare"} links={compareLinks} />
            <FooterNavColumn title={isFr ? "Légal" : "Legal"} links={legalLinks} />
          </div>
        </div>

        <section className="pk-landing-footer-v2__guides" aria-label={isFr ? "Guides SEO" : "SEO guides"}>
          <div className="pk-landing-footer-v2__guides-head">
            <h3 className="pk-landing-footer-v2__guides-title">{isFr ? "Guides & générateurs" : "Guides & generators"}</h3>
            <span className="pk-landing-footer-v2__guides-note">
              {isFr ? "Pages ressources · SEO" : "Resource pages · SEO"}
            </span>
          </div>
          <div className="pk-landing-footer-v2__pill-grid">
            {guideLinks.map((l) => (
              <Link key={l.to} to={l.to} className="pk-landing-footer-v2__pill">
                {l.label}
              </Link>
            ))}
          </div>
        </section>

        <div className="pk-landing-footer-v2__bottom">
          <span className="pk-landing-footer-v2__copy">
            Made with <span className="pk-footer-heart" aria-hidden>♥</span> © 2026 ProducerHit
          </span>
          <div className="pk-landing-footer-v2__bottom-actions">
            <Link to={user ? "/dashboard" : "/auth"} className="pk-landing-footer-v2__cta">
              {user ? "Dashboard" : isFr ? "Commencer gratuitement" : "Start free"}
            </Link>
            <Link to="/legal" className="pk-landing-footer-v2__legal-link">
              {isFr ? "Mentions légales" : "Legal"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
