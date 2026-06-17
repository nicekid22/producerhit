import { Loader2, MessageCircle, Pause, Play, Radio, Shuffle, Sparkles, TrendingUp, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { ProfileAuthorChip } from "@/components/profile/ProfileAuthorChip";
import { resolveCommunityDisplayCoverUrl } from "@/lib/coverArt";
import { displayProducerInfluence } from "@/lib/beatInfluence";
import { COMMUNITY_HUB_PAGE, type CommunityVibeCategory } from "@/lib/communityHub";
import { discordCommunityUrl } from "@/lib/discordConfig";
import { COVER_SURFACE_CLASS, cn } from "@/lib/utils";
import type { PublicLoopRow } from "@/lib/publicLoops";

type Props = {
  isFr: boolean;
  liveCount: number;
  newTodayCount: number;
  totalComments: number;
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
  onJoinChat?: () => void;
};

export function CommunityHubHero({
  isFr,
  liveCount,
  newTodayCount,
  totalComments,
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
  onJoinChat,
}: Props) {
  const title = isFr ? COMMUNITY_HUB_PAGE.title.fr : COMMUNITY_HUB_PAGE.title.en;
  const hook = isFr ? COMMUNITY_HUB_PAGE.hook.fr : COMMUNITY_HUB_PAGE.hook.en;
  const tagline = isFr ? COMMUNITY_HUB_PAGE.tagline.fr : COMMUNITY_HUB_PAGE.tagline.en;
  const ctaPrimary = isFr ? COMMUNITY_HUB_PAGE.ctaPrimary.fr : COMMUNITY_HUB_PAGE.ctaPrimary.en;
  const ctaShuffle = isFr ? COMMUNITY_HUB_PAGE.ctaShuffle.fr : COMMUNITY_HUB_PAGE.ctaShuffle.en;
  const playingNow = isActive && isPlaying;
  const coverUrl = spotlight ? resolveCommunityDisplayCoverUrl(spotlight) : "";
  const spotlightInfluence = spotlight ? displayProducerInfluence(spotlight.influence) : null;

  return (
    <section className="pk-hub-hero" aria-labelledby="hub-hero-title">
      <div className="pk-hub-hero__mesh" aria-hidden />
      <div className="pk-hub-hero__orb pk-hub-hero__orb--a" aria-hidden />
      <div className="pk-hub-hero__orb pk-hub-hero__orb--b" aria-hidden />

      <div className="pk-hub-hero__inner">
        <div className="pk-hub-hero__copy">
          <div className="pk-hub-hero__copy-content">
            <div className="flex flex-wrap items-center gap-2">
              <span className="pk-hub-hero__live-pill">
                <span className="pk-hub-hero__live-dot" />
                {loading ? "…" : `${liveCount} ${isFr ? "sons live" : "tracks live"}`}
              </span>
              {!loading && newTodayCount > 0 ? (
                <span className="pk-hub-hero__stat-pill">
                  <TrendingUp className="h-3 w-3" />
                  +{newTodayCount} {isFr ? "aujourd'hui" : "today"}
                </span>
              ) : null}
              {!loading && totalComments > 0 ? (
                <span className="pk-hub-hero__stat-pill">
                  <MessageCircle className="h-3 w-3" />
                  {totalComments} {isFr ? "coms" : "comments"}
                </span>
              ) : null}
            </div>

            <p className="pk-hub-hero__hook mt-3">{hook}</p>
            <h1 id="hub-hero-title" className="pk-hub-hero__title">
              <span className="pk-prism-holo-text">{title}</span>
            </h1>
            <p className="pk-hub-hero__tagline mt-2 max-w-lg text-sm leading-relaxed">{tagline}</p>

            {topCategories.length ? (
              <div className="pk-hub-hero__chips mt-4 flex flex-wrap gap-2">
                {topCategories.slice(0, 5).map(({ category, count }) => (
                  <span
                    key={category.id}
                    className="pk-hub-hero__chip"
                    data-vibe={category.id}
                    style={{ ["--pk-chip-accent" as string]: category.accent }}
                    title={isFr ? category.subtitle.fr : category.subtitle.en}
                  >
                    {isFr ? category.title.fr : category.title.en}
                    <span className="pk-hub-hero__chip-count">{count}</span>
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={onCreate} className="pk-hub-hero__btn-primary inline-flex h-10 items-center gap-2 rounded-full px-5 text-xs font-bold">
                <Zap className="h-3.5 w-3.5" />
                {ctaPrimary}
              </button>
              <button
                type="button"
                onClick={onShuffle}
                className="pk-hub-hero__btn-ghost inline-flex h-10 items-center gap-2 rounded-full px-5 text-xs font-bold"
              >
                <Shuffle className="h-3.5 w-3.5" />
                {ctaShuffle}
              </button>
              {onJoinChat && totalComments > 0 ? (
                <button
                  type="button"
                  onClick={onJoinChat}
                  className="pk-hub-hero__btn-ghost inline-flex h-10 items-center gap-2 rounded-full px-5 text-xs font-bold"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {isFr ? "Rejoins le chat" : "Join the chat"}
                </button>
              ) : null}
              <Link
                to="/blog/producerhit-community-feed-guide"
                className="pk-hub-hero__btn-ghost inline-flex h-10 items-center gap-2 rounded-full px-5 text-xs font-bold"
              >
                {isFr ? "C'est quoi le Flux ?" : "What's the Feed?"}
              </Link>
              <a
                href={discordCommunityUrl("community_hero")}
                target="_blank"
                rel="noopener noreferrer"
                className="pk-hub-hero__btn-ghost inline-flex h-10 items-center gap-2 rounded-full px-5 text-xs font-bold"
              >
                Discord
              </a>
            </div>
          </div>
        </div>

        <div className="pk-hub-hero__spotlight">
          {spotlight ? (
            <article className="pk-hub-hero__card pk-hub-hero__card--spotlight">
              <p className="pk-hub-hero__card-label">{isFr ? "🔥 Spotlight commu" : "🔥 Community spotlight"}</p>
              <button
                type="button"
                onClick={onPlay}
                className={cn(
                  "pk-hub-hero__card-cover group relative w-full overflow-hidden rounded-xl border border-white/20 text-left",
                  COVER_SURFACE_CLASS,
                )}
                aria-label={isFr ? `Écouter ${spotlight.name}` : `Play ${spotlight.name}`}
              >
                <img
                  src={coverUrl}
                  alt=""
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="pk-hub-hero__card-cover-img aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06060c]/75 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/15 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/50 text-white backdrop-blur-md">
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

              <div className="pk-hub-hero__card-meta">
                <h2 className="pk-hub-hero__card-title" title={spotlight.name ?? undefined}>
                  {spotlight.name ?? "Untitled"}
                </h2>
                <div className="mt-2 flex flex-wrap gap-1">
                  {spotlight.genre ? (
                    <span className="pk-hub-hero__vibe-chip max-w-full truncate">{spotlight.genre}</span>
                  ) : null}
                  {spotlightInfluence ? (
                    <span className="pk-hub-hero__vibe-chip pk-hub-hero__vibe-chip--producer max-w-full truncate">
                      {spotlightInfluence}
                    </span>
                  ) : null}
                  {(spotlight.bpm ?? 0) > 0 ? <span className="pk-hub-hero__vibe-chip shrink-0">{spotlight.bpm} BPM</span> : null}
                </div>
                {spotlight.author ? (
                  <div className="mt-2">
                    <ProfileAuthorChip author={spotlight.author} isFr={isFr} size="sm" hideAvatar />
                  </div>
                ) : null}
                <div className="pk-hub-hero__card-actions mt-3">
                  <button
                    type="button"
                    onClick={onPlay}
                    disabled={resolving}
                    className="pk-hub-hero__btn-primary inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-full text-[11px] font-bold disabled:opacity-60"
                  >
                    {playingNow ? <Pause className="h-3 w-3 shrink-0" fill="currentColor" /> : <Play className="h-3 w-3 shrink-0" fill="currentColor" />}
                    <span className="truncate">{isFr ? "Écouter" : "Play"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onRemix}
                    disabled={resolving}
                    className="pk-hub-hero__btn-ghost inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-[11px] font-bold"
                  >
                    <Sparkles className="h-3 w-3 shrink-0" />
                    Remix
                  </button>
                </div>
              </div>
            </article>
          ) : (
            <div className="pk-hub-hero__card pk-hub-hero__card--empty flex min-h-[6.5rem] flex-col items-center justify-center p-4 text-center">
              <Radio className="pk-hub-hero__card--empty-icon h-10 w-10" />
              <p className="mt-3 text-sm font-bold text-white/85">
                {loading ? (isFr ? "Le flux charge…" : "Loading the feed…") : isFr ? "Sois le premier drop du jour 👀" : "Be today's first drop 👀"}
              </p>
              <Link to="/dashboard" className="pk-hub-hero__btn-primary mt-4 inline-flex h-9 items-center rounded-full px-4 text-xs font-bold">
                {ctaPrimary}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
