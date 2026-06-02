import { Loader2, Pause, Play, Radio, Shuffle, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { ProfileAuthorChip } from "@/components/profile/ProfileAuthorChip";
import { publicRowToCoverLoop, resolveCoverImageUrl } from "@/lib/coverArt";
import { COMMUNITY_HUB_PAGE, type CommunityVibeCategory } from "@/lib/communityHub";
import { coverGradient } from "@/lib/utils";
import type { PublicLoopRow } from "@/lib/publicLoops";

/** public/img/starz.png → servi par Vite à /img/starz.png */
const STARZ_SRC = "/img/starz.png";

type Props = {
  isFr: boolean;
  liveCount: number;
  loading: boolean;
  spotlight: PublicLoopRow | null;
  topCategories: Array<{ category: CommunityVibeCategory; count: number }>;
  isActive: boolean;
  isPlaying: boolean;
  resolving: boolean;
  onPlay: () => void;
  onShuffle: () => void;
  onRemix: () => void;
  onCreate: () => void;
};

export function CommunityHubHero({
  isFr,
  liveCount,
  loading,
  spotlight,
  topCategories,
  isActive,
  isPlaying,
  resolving,
  onPlay,
  onShuffle,
  onRemix,
  onCreate,
}: Props) {
  const title = isFr ? COMMUNITY_HUB_PAGE.title.fr : COMMUNITY_HUB_PAGE.title.en;
  const tagline = isFr ? COMMUNITY_HUB_PAGE.tagline.fr : COMMUNITY_HUB_PAGE.tagline.en;
  const playingNow = isActive && isPlaying;

  const loop = spotlight ? publicRowToCoverLoop(spotlight) : null;
  const bg = loop ? coverGradient(loop) : "linear-gradient(135deg, #1e1b4b, #0f172a)";
  const coverUrl = loop ? resolveCoverImageUrl(loop) : "";

  return (
    <section className="pk-hub-hero" aria-labelledby="hub-hero-title">
      <div className="pk-hub-hero__mesh" aria-hidden />
      <div className="pk-hub-hero__orb pk-hub-hero__orb--a" aria-hidden />
      <div className="pk-hub-hero__orb pk-hub-hero__orb--b" aria-hidden />

      <div className="pk-hub-hero__inner">
        <div className="pk-hub-hero__copy">
          <div className="pk-hub-hero__copy-content">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pk-prism-live-badge">
              <span className="pk-prism-live-badge__dot" />
              <Radio className="mr-1 inline h-3 w-3 opacity-80" />
              {loading ? "…" : `${liveCount} ${isFr ? "en ligne" : "live"}`}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">
              {isFr ? "Streaming communautaire" : "Community streaming"}
            </span>
          </div>
          <h1 id="hub-hero-title" className="pk-hub-hero__title mt-3">
            <span className="pk-prism-holo-text">{title}</span>
          </h1>
          <p className="pk-hub-hero__tagline mt-2 max-w-md text-sm leading-relaxed text-white/60">{tagline}</p>

          {topCategories.length ? (
            <div className="pk-hub-hero__chips mt-3 flex flex-wrap gap-2">
              {topCategories.slice(0, 5).map(({ category, count }) => (
                <span
                  key={category.id}
                  className="pk-hub-hero__chip"
                  style={{ backgroundImage: category.accent }}
                  title={isFr ? category.subtitle.fr : category.subtitle.en}
                >
                  {isFr ? category.title.fr : category.title.en}
                  <span className="pk-hub-hero__chip-count">{count}</span>
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={onCreate} className="pk-prism-btn inline-flex h-9 items-center gap-2 rounded-full px-4 text-xs font-semibold">
              <Zap className="h-3.5 w-3.5" />
              {isFr ? "Créer un son" : "Create a track"}
            </button>
            <button
              type="button"
              onClick={onShuffle}
              className="pk-glass-btn pk-glass-btn--ghost inline-flex h-9 items-center gap-2 rounded-full px-4 text-xs font-semibold"
            >
              <Shuffle className="h-3.5 w-3.5" />
              {isFr ? "Surprise-moi" : "Surprise me"}
            </button>
          </div>
          </div>
        </div>

        <div className="pk-hub-hero__starz-col" aria-hidden>
          <div className="pk-hub-hero__starz-stage">
            <div className="pk-hub-hero__starz-aura" />
            <div className="pk-hub-hero__starz-shine" />
            <div className="pk-hub-hero__starz-sheen" />
            <img src={STARZ_SRC} alt="" className="pk-hub-hero__starz-img" decoding="async" draggable={false} />
          </div>
        </div>

        <div className="pk-hub-hero__spotlight">
          {spotlight ? (
            <article className="pk-hub-hero__card">
              <p className="pk-hub-hero__card-label">{isFr ? "À la une" : "Spotlight"}</p>
              <div className="pk-hub-hero__card-body">
                <button
                  type="button"
                  onClick={onPlay}
                  className="pk-hub-hero__card-cover group relative shrink-0 overflow-hidden rounded-lg border border-white/12 text-left"
                  style={{ background: bg }}
                >
                  <img
                    src={coverUrl}
                    alt=""
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="h-[4.25rem] w-[4.25rem] object-cover opacity-0 transition-all duration-500 group-hover:scale-[1.05] md:h-[4.75rem] md:w-[4.75rem]"
                    onLoad={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06060c]/80 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white backdrop-blur-md">
                      {resolving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : playingNow ? (
                        <Pause className="h-4 w-4" fill="currentColor" />
                      ) : (
                        <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
                      )}
                    </span>
                  </div>
                </button>
                <div className="pk-hub-hero__card-meta min-w-0 flex-1">
                  <h2 className="truncate text-sm font-bold text-white">{spotlight.name}</h2>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {spotlight.genre ? <span className="pk-prism-vibe-chip text-[10px]">{spotlight.genre}</span> : null}
                    {(spotlight.bpm ?? 0) > 0 ? <span className="pk-prism-vibe-chip text-[10px]">{spotlight.bpm} BPM</span> : null}
                  </div>
                  {spotlight.author ? (
                    <div className="mt-1.5 hidden sm:block">
                      <ProfileAuthorChip author={spotlight.author} isFr={isFr} size="sm" hideAvatar />
                    </div>
                  ) : null}
                  <div className="mt-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={onPlay}
                      disabled={resolving}
                      className="pk-prism-btn inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-full text-[11px] font-semibold disabled:opacity-60"
                    >
                      {playingNow ? <Pause className="h-3 w-3" fill="currentColor" /> : <Play className="h-3 w-3" fill="currentColor" />}
                      {isFr ? "Écouter" : "Play"}
                    </button>
                    <button
                      type="button"
                      onClick={onRemix}
                      disabled={resolving}
                      className="pk-glass-btn pk-glass-btn--ghost inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold"
                    >
                      <Sparkles className="h-3 w-3 text-cyan-300" />
                      Remix
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ) : (
            <div className="pk-hub-hero__card pk-hub-hero__card--empty flex min-h-[5.5rem] flex-col items-center justify-center rounded-xl border border-dashed border-white/15 p-3 text-center">
              <Radio className="h-10 w-10 text-white/25" />
              <p className="mt-4 text-sm font-semibold text-white/70">
                {loading ? (isFr ? "Chargement du flux…" : "Loading the feed…") : isFr ? "Le flux s’anime bientôt" : "The feed is warming up"}
              </p>
              <Link to="/dashboard" className="pk-prism-btn mt-4 inline-flex h-9 items-center rounded-full px-4 text-xs font-semibold">
                {isFr ? "Publier un son" : "Publish a track"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
