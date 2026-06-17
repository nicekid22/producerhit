import { useMemo } from "react";
import { ExternalLink, Instagram, Play } from "lucide-react";
import { landingCopy } from "@/lib/landingContent";
import { LANDING_SOCIAL_POSTS, type LandingSocialPost } from "@/lib/landingSocialPosts";
import { getSocialProfile } from "@/lib/socialLinks";
import { useLazyInView } from "@/hooks/useLazyInView";
import { cn } from "@/lib/utils";

import type { AppLocale } from "@/i18n/config";
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.77a4.85 4.85 0 0 1-1.01-.08z" />
    </svg>
  );
}

type Props = {
  locale: AppLocale;
};

function SocialPostCard({ post, locale }: { post: LandingSocialPost; locale: AppLocale }) {
  const isFr = locale === "fr";
  const profile = getSocialProfile(post.platform);
  const isIg = post.platform === "instagram";
  const caption = isFr ? post.captionFr : post.captionEn;
  const tag = isFr ? post.tagFr : post.tagEn;

  return (
    <a
      href={profile.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "pk-landing-social__card group block shrink-0 overflow-hidden rounded-2xl border bg-[#0a0a0f] transition-transform duration-300 hover:-translate-y-1",
        isIg ? "pk-landing-social__card--ig border-white/10" : "pk-landing-social__card--tt border-white/10",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              isIg ? "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]" : "bg-black ring-1 ring-white/15",
            )}
          >
            {isIg ? <Instagram className="h-4 w-4 text-white" /> : <TikTokIcon className="h-4 w-4 text-white" />}
          </span>
          <div className="min-w-0">
            <div className="truncate text-xs font-bold text-white">{profile.handle}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
              {isIg ? "Instagram" : "TikTok"}
            </div>
          </div>
        </div>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-white/30 transition-colors group-hover:text-white/70" />
      </div>

      <div className="relative aspect-[4/5] overflow-hidden bg-black/40">
        <img src={post.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        {post.platform === "tiktok" ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
            </span>
          </span>
        ) : null}
        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/90 backdrop-blur-sm">
          {tag}
        </span>
      </div>

      <p className="line-clamp-3 px-3 py-3 text-xs leading-relaxed text-white/75">{caption}</p>
    </a>
  );
}

export function LandingSocialFeed({ locale }: Props) {
  const { ref, visible } = useLazyInView("200px");
  const copy = landingCopy(locale);
  const isFr = locale === "fr";

  const scrollDurationSec = useMemo(() => 55 + Math.floor(Math.random() * 20), []);
  const trackItems = visible ? [...LANDING_SOCIAL_POSTS, ...LANDING_SOCIAL_POSTS] : LANDING_SOCIAL_POSTS.slice(0, 4);

  return (
    <section ref={ref} className="pk-landing-social" aria-labelledby="landing-social-title">
      <div className="pk-landing-section-head text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">{copy.socialEyebrow}</p>
        <h2 id="landing-social-title" className="pk-landing-section-head__title mt-2">
          <span className="pk-prism-holo-text">{copy.socialTitle}</span>
        </h2>
        <p className="pk-landing-section-head__lead mx-auto mt-3 max-w-2xl">{copy.socialLead}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
          <a
            href={getSocialProfile("instagram").href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:border-pink-400/30 hover:text-white"
          >
            <Instagram className="h-4 w-4 text-pink-300" />
            @producerhit_com
          </a>
          <a
            href={getSocialProfile("tiktok").href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:border-cyan-400/30 hover:text-white"
          >
            <TikTokIcon className="h-4 w-4" />
            @producerhit
          </a>
        </div>
      </div>

      <div className={`pk-landing-social__viewport mt-8 sm:mt-10 ${visible ? "is-active" : ""}`}>
        <div
          className={`pk-landing-social__track ${visible ? "" : "is-static"}`}
          style={visible ? { animationDuration: `${scrollDurationSec}s` } : undefined}
        >
          {trackItems.map((post, i) => (
            <SocialPostCard key={`${post.id}-${i}`} post={post} locale={locale} />
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-white/40">
        {isFr ? "Suis-nous pour des drops, tutos et morceaux de la communauté." : "Follow for drops, tutorials, and community highlights."}
      </p>
    </section>
  );
}
