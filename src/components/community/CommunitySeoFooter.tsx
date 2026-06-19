import { Link } from "react-router-dom";
import { COMMUNITY_VIBE_CATEGORIES } from "@/lib/communityHub";
import {
  COMMUNITY_VIBE_BASE,
  SEO_INTERNAL_LINKS,
  TRENDING_PATH,
  communityVibePath,
} from "@/lib/communitySeo";
import type { AppLocale } from "@/i18n/config";
import { buildCommunityHubUiCopy, vibeCategoryTitle } from "@/i18n/communityHubUiCatalog";
import { useMemo } from "react";

type Props = {
  locale: AppLocale;
  variant?: "hub" | "vibe" | "trending";
  vibeTitle?: string;
};

export function CommunitySeoFooter({ locale, variant = "hub", vibeTitle }: Props) {
  const copy = useMemo(() => buildCommunityHubUiCopy(locale), [locale]);
  const seo = copy.seoFooter;
  const links = locale === "fr" ? SEO_INTERNAL_LINKS.fr : SEO_INTERNAL_LINKS.en;

  const heading =
    variant === "trending"
      ? seo.trendingTitle
      : variant === "vibe" && vibeTitle
        ? seo.moreVibes(vibeTitle)
        : seo.discoverByVibe;

  const body = variant === "trending" ? seo.trendingBody : seo.hubBody;

  return (
    <footer className="pk-community-seo mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
      <h2 className="text-lg font-bold text-white">{heading}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">{body}</p>

      <nav className="mt-5" aria-label={seo.communityVibes}>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">{seo.feedVibes}</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {COMMUNITY_VIBE_CATEGORIES.map((cat) => (
            <li key={cat.id}>
              <Link
                to={communityVibePath(cat.id)}
                className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-cyan-400/30 hover:text-white"
              >
                {vibeCategoryTitle(cat, locale)}
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
              {seo.allFeed}
            </Link>
          </li>
        </ul>
      </nav>

      <nav className="mt-5" aria-label={seo.guidesNav}>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">{seo.guides}</p>
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
              {seo.aiBeatsBlog}
            </Link>
          </li>
        </ul>
      </nav>
    </footer>
  );
}
