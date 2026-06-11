import { Link } from "react-router-dom";
import { COMMUNITY_VIBE_CATEGORIES } from "@/lib/communityHub";
import {
  COMMUNITY_VIBE_BASE,
  SEO_INTERNAL_LINKS,
  TRENDING_PATH,
  communityVibePath,
} from "@/lib/communitySeo";

type Props = {
  isFr: boolean;
  variant?: "hub" | "vibe" | "trending";
  vibeTitle?: string;
};

export function CommunitySeoFooter({ isFr, variant = "hub", vibeTitle }: Props) {
  const links = isFr ? SEO_INTERNAL_LINKS.fr : SEO_INTERNAL_LINKS.en;

  return (
    <footer className="pk-community-seo mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
      <h2 className="text-lg font-bold text-white">
        {variant === "trending"
          ? isFr
            ? "Beats IA trending & remix 2026"
            : "Trending AI beats & remix 2026"
          : variant === "vibe" && vibeTitle
            ? isFr
              ? `Plus de vibes ${vibeTitle} & guides`
              : `More ${vibeTitle} vibes & guides`
            : isFr
              ? "Découvrir beats IA par vibe"
              : "Discover AI beats by vibe"}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
        {variant === "trending"
          ? isFr
            ? "ProducerHit combine un flux communautaire (écoutes, notes, commentaires) et un studio IA pour remixer les vibes du moment — alternative aux listes statiques « 9 meilleurs générateurs IA »."
            : "ProducerHit combines a community feed (plays, ratings, comments) with an AI studio to remix hot vibes — an alternative to static « 9 best AI generators » listicles."
          : isFr
            ? "Chaque vibe a sa page indexable avec des tracks publics réels. Remixe une vibe, crée ton type beat, ou compare ProducerHit aux autres générateurs IA."
            : "Each vibe has an indexable page with real public tracks. Remix a vibe, create your type beat, or compare ProducerHit to other AI music tools."}
      </p>

      <nav className="mt-5" aria-label={isFr ? "Vibes communauté" : "Community vibes"}>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
          {isFr ? "Vibes du flux" : "Feed vibes"}
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {COMMUNITY_VIBE_CATEGORIES.map((cat) => (
            <li key={cat.id}>
              <Link
                to={communityVibePath(cat.id)}
                className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-cyan-400/30 hover:text-white"
              >
                {isFr ? cat.title.fr : cat.title.en}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to={TRENDING_PATH}
              className="inline-flex rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/15"
            >
              🔥 Trending
            </Link>
          </li>
          <li>
            <Link to="/community" className="inline-flex rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/55 hover:text-white">
              {isFr ? "Tout le flux" : "All feed"}
            </Link>
          </li>
        </ul>
      </nav>

      <nav className="mt-5" aria-label={isFr ? "Guides SEO" : "SEO guides"}>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
          {isFr ? "Guides & comparatifs" : "Guides & comparisons"}
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link to={link.href} className="text-xs font-semibold text-white/50 hover:text-cyan-200">
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link to="/blog" className="text-xs font-semibold text-white/50 hover:text-cyan-200">
              {isFr ? "Blog beats IA" : "AI beats blog"}
            </Link>
          </li>
        </ul>
      </nav>
    </footer>
  );
}
