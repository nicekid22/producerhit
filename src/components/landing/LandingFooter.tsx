import { Link } from "react-router-dom";

import type { User } from "@supabase/supabase-js";

import { BrandLogo } from "@/components/landing/BrandLogo";

import { SocialIconLinks } from "@/components/landing/SocialIconLinks";

import { landingCopy } from "@/lib/landingContent";

import { EmailCaptureSection } from "@/components/growth/EmailCaptureSection";

import { localizedPath, type AppLocale } from "@/i18n/config";

import { getMessages } from "@/i18n/locales";



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

  const f = getMessages(locale).footer;

  const copy = landingCopy(locale);



  const productLinks: FooterLink[] = [

    { to: "/dashboard", label: f.generator },

    { to: "/community", label: f.community },

    { to: "/trending", label: f.trending },

    { to: "/pricing", label: f.pricing },

    { to: "/blog", label: "Blog" },

    { to: "/voice-studio", label: f.voiceStudio },

    { to: "/ai-beat-name-generator", label: locale === "fr" ? "Noms de beats IA" : "Beat Name Generator" },

    { to: "/for-ai", label: locale === "fr" ? "Fiche produit IA" : "For AI assistants" },

  ];



  const compareLinks: FooterLink[] = [

    { to: localizedPath(locale, "/suno-alternatives", "/alternatives-suno"), label: f.sunoAlt },

    { to: localizedPath(locale, "/udio-alternatives", "/alternatives-udio"), label: f.udioAlt },

    { to: localizedPath(locale, "/remix-cover-ai", "/remix-cover-ia"), label: f.remixCover },

    { to: localizedPath(locale, "/spotify-ready-ai-music", "/musique-ia-spotify-ready"), label: "Spotify Ready" },

    {

      to: localizedPath(locale, "/ai-music-generator-comparison-2026", "/comparatif-generateur-musique-ia-2026"),

      label: f.comparison2026,

    },

    {

      to: localizedPath(locale, "/best-ai-beat-generator-for-producers", "/meilleur-generateur-beats-ia-producteurs"),

      label: f.bestBeatAi,

    },

  ];



  const legalLinks: FooterLink[] = [

    { to: "/legal#privacy", label: getMessages(locale).common.privacy },

    { to: "/legal#terms", label: getMessages(locale).common.terms },

    { to: "/legal#cookies", label: getMessages(locale).common.cookies },

    { to: "/legal#refunds", label: getMessages(locale).common.refunds },

    { to: "/legal#contact", label: getMessages(locale).common.support },

  ];



  const guideLinks: FooterLink[] = [

    { to: localizedPath(locale, "/music-ai-generator", "/generateur-music-ai"), label: "Music AI Generator" },

    { to: localizedPath(locale, "/free-music-ai-generator", "/generateur-musique-ia-gratuit"), label: f.freeMusicAi },

    { to: localizedPath(locale, "/text-to-music-ai-generator", "/texte-en-musique-ia"), label: f.textToMusic },

    { to: localizedPath(locale, "/ai-song-generator", "/generateur-chanson-ia"), label: f.aiSong },

    { to: "/ai-beat-generator", label: "AI Beat" },

    { to: "/ai-trap-beat-generator", label: "Trap AI" },

    { to: "/ai-lofi-beat-generator", label: "Lo-Fi AI" },

    { to: "/ai-phonk-beat-generator", label: "Phonk AI" },

    { to: localizedPath(locale, "/ai-k-pop-song-generator", "/generateur-k-pop-ia"), label: "K-Pop AI" },

    { to: localizedPath(locale, "/ai-sleep-music-generator", "/musique-sommeil-ia"), label: f.sleep },

    { to: localizedPath(locale, "/ai-study-music-generator", "/musique-etude-ia"), label: f.study },

    { to: localizedPath(locale, "/ai-meditation-music-generator", "/musique-meditation-ia"), label: f.meditation },

    { to: localizedPath(locale, "/ai-song-generator-by-genre", "/generateur-chanson-ia-par-genre"), label: f.byGenre },

    { to: localizedPath(locale, "/ai-song-generator-alternatives", "/alternatives-generateur-chanson-ia"), label: f.songAlt },

    { to: "/beatoven-alternatives", label: f.beatovenAlt },

    { to: localizedPath(locale, "/mubert-alternatives", "/alternatives-mubert"), label: f.mubertAlt },

  ];



  return (

    <footer className="pk-landing-footer pk-landing-footer-v2 relative z-[1]">

      <div className="relative z-[1] mx-auto max-w-6xl px-4 py-12 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] sm:py-14 md:py-16">

        <div className="pk-landing-footer-v2__top">

          <div>

            <BrandLogo />

            <p className="pk-landing-footer-v2__brand-lead">{f.brandLead}</p>

            <p className="pk-landing-footer-v2__ace">Powered by ACE-Step</p>

            <p className="pk-landing-footer-v2__social-label">{copy.footerSocialLabel}</p>

            <SocialIconLinks locale={locale} variant="footer" className="mt-3" />

          </div>



          <div className="pk-landing-footer-v2__nav-grid">

            <FooterNavColumn title={f.product} links={productLinks} />

            <FooterNavColumn title={f.compare} links={compareLinks} />

            <FooterNavColumn title={f.legalCol} links={legalLinks} />

          </div>

        </div>



        <section className="pk-landing-footer-v2__guides" aria-label={f.guidesAria}>

          <div className="pk-landing-footer-v2__guides-head">

            <h3 className="pk-landing-footer-v2__guides-title">{f.guidesTitle}</h3>

            <span className="pk-landing-footer-v2__guides-note">{f.guidesNote}</span>

          </div>

          <div className="pk-landing-footer-v2__pill-grid">

            {guideLinks.map((l) => (

              <Link key={l.to} to={l.to} className="pk-landing-footer-v2__pill">

                {l.label}

              </Link>

            ))}

          </div>

        </section>



        <section className="pk-landing-footer-v2__newsletter px-4 py-8 sm:px-6">

          <EmailCaptureSection locale={locale} source="landing_footer" className="mx-auto max-w-xl" />

        </section>



        <div className="pk-landing-footer-v2__bottom">

          <span className="pk-landing-footer-v2__copy">

            Made with <span className="pk-footer-heart" aria-hidden>♥</span> © 2026 ProducerHit

          </span>

          <div className="pk-landing-footer-v2__bottom-actions">

            <Link to={user ? "/dashboard" : "/auth"} className="pk-landing-footer-v2__cta">

              {user ? "Dashboard" : f.startFree}

            </Link>

            <Link to="/legal" className="pk-landing-footer-v2__legal-link">

              {f.legalPage}

            </Link>

            <a href="/rss.xml" className="pk-landing-footer-v2__legal-link">

              RSS

            </a>

          </div>

        </div>

      </div>

    </footer>

  );

}

