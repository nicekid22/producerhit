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
    { to: "/ai-beat-generator", label: "AI Beat Generator" },
    { to: "/ai-music-generator", label: "AI Music Generator" },
    { to: "/type-beat-generator-ai", label: "Type Beat AI" },
    { to: "/generate-beats-online-free", label: isFr ? "Beats gratuits" : "Free Beats" },
  ];

  const legalLinks = [
    { to: "/legal#privacy", label: "Privacy" },
    { to: "/legal#terms", label: isFr ? "Conditions" : "Terms" },
    { to: "/legal#cookies", label: "Cookies" },
    { to: "/legal#refunds", label: isFr ? "Remboursements" : "Refunds" },
    { to: "/legal#contact", label: isFr ? "Support" : "Support" },
  ];

  return (
    <footer className="pk-landing-footer border-t border-white/10 bg-[rgba(4,3,10,0.55)] backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-12 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <BrandLogo compact />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              {isFr
                ? "Générateur IA de chansons et type beats — holographic metal, release-ready."
                : "AI song & type beat generator — holographic metal aesthetic, release-ready output."}
            </p>
            <p className="mt-4 text-xs font-semibold text-white/35">Powered by ACE-Step</p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-8">
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
            <div className="col-span-2 sm:col-span-1">
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

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
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
