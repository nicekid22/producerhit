import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pause, Play, Radio, Shuffle, Sparkles } from "lucide-react";
import type { Loop } from "@/types/loop";
import type { PublicProfileCard } from "@/lib/creatorProfile";
import { resolveCoverImageUrl } from "@/lib/coverArt";
import { coverGradient } from "@/lib/utils";
import { isPlayablePublicLoop } from "@/lib/publicLoops";
import { ProfileAuthorChip } from "@/components/profile/ProfileAuthorChip";

export type LandingCommunityTrack = {
  id: string;
  name: string;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  audioUrl: string | null;
  createdAt: string | null;
  seed?: number | null;
  stemsUrl?: Record<string, unknown> | null;
  kind: "song" | "beat";
  badge: "Song" | "Type Beat";
  tags: string[];
  prompt: string;
  author?: PublicProfileCard | null;
  /** URL persistée en DB — pas de Pollinations à la volée sur la landing */
  coverUrl?: string | null;
};

type Props = {
  locale: "en" | "fr";
  title: string;
  lead: string;
  tracks: LandingCommunityTrack[];
  loading: boolean;
  activeTrackId: string | null;
  isPlaying: boolean;
  onPlay: (track: LandingCommunityTrack) => void;
  onRemix: (track: LandingCommunityTrack) => void;
  onRefresh?: () => void;
  footer?: React.ReactNode;
};

function isNew(createdAt: string | null) {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
}

function toCoverLoop(track: LandingCommunityTrack): Loop {
  return {
    id: track.id,
    name: track.name,
    genre: track.genre ?? "",
    influence: "No Influence",
    key: "",
    scale: "",
    bpm: track.bpm ?? 0,
    loopLength: "8 bars",
    swing: 0,
    mood: track.mood ?? "",
    energyLevel: "",
    reverb: "",
    prompt: track.prompt,
    audioUrl: track.audioUrl,
    seed: track.seed ?? null,
    details: null,
    stemsUrl: track.stemsUrl ?? null,
    isSaved: false,
    isPublic: true,
    createdAt: track.createdAt ?? new Date().toISOString(),
  };
}

export function LandingCommunityRail({
  locale,
  title,
  lead,
  tracks,
  loading,
  activeTrackId,
  isPlaying,
  onPlay,
  onRemix,
  onRefresh,
  footer,
}: Props) {
  const isFr = locale === "fr";
  const railRef = useRef<HTMLDivElement | null>(null);
  const [edgeLeft, setEdgeLeft] = useState(false);
  const [edgeRight, setEdgeRight] = useState(true);
  const [scrollHint, setScrollHint] = useState(true);

  const syncEdges = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth - 2);
    setEdgeLeft(el.scrollLeft > 8);
    setEdgeRight(el.scrollLeft < max);
  }, []);

  useEffect(() => {
    syncEdges();
    const el = railRef.current;
    if (!el) return;
    const onScroll = () => {
      syncEdges();
      if (el.scrollLeft > 12) setScrollHint(false);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(syncEdges) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro?.disconnect();
    };
  }, [syncEdges, tracks.length, loading]);

  const scrollBy = (dir: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    setScrollHint(false);
    el.scrollBy({ left: dir * Math.min(360, el.clientWidth * 0.82), behavior: "smooth" });
  };

  const shufflePlay = () => {
    if (!tracks.length) return;
    const pick = tracks[Math.floor(Math.random() * tracks.length)]!;
    onPlay(pick);
    const card = railRef.current?.querySelector(`[data-track-id="${pick.id}"]`);
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  return (
    <div id="trending" className="pk-landing-community">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pk-prism-live-badge">
              <span className="pk-prism-live-badge__dot" aria-hidden />
              {isFr ? "Live" : "Live"}
            </span>
            {!loading && tracks.length ? (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/45">
                {tracks.length} {isFr ? "tracks" : "tracks"}
              </span>
            ) : null}
          </div>
          <h2 className="mt-3 text-balance text-[clamp(1.5rem,3.2vw,2.25rem)] font-bold tracking-tight text-white">
            <span className="pk-prism-holo-text">{title}</span>
          </h2>
          <p className="mt-3 max-w-3xl text-balance text-sm leading-relaxed text-white/60">{lead}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={shufflePlay}
            disabled={loading || !tracks.length}
            className="pk-glass-btn pk-glass-btn--ghost inline-flex h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold disabled:opacity-40"
          >
            <Shuffle className="h-3.5 w-3.5" />
            {isFr ? "Aléatoire" : "Shuffle"}
          </button>
          <Link
            to="/community"
            className="pk-glass-btn pk-glass-btn--primary inline-flex h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold"
          >
            <Radio className="h-3.5 w-3.5" />
            {isFr ? "Toute la communauté" : "Full community"}
          </Link>
        </div>
      </div>

      <div className="pk-landing-community__stage mt-6 sm:mt-8">
        <div className={["pk-landing-community__fade pk-landing-community__fade--left", edgeLeft ? "is-visible" : ""].join(" ")} aria-hidden />
        <div className={["pk-landing-community__fade pk-landing-community__fade--right", edgeRight ? "is-visible" : ""].join(" ")} aria-hidden />

        {scrollHint && !loading && tracks.length > 3 ? (
          <div className="pk-landing-community__nudge" aria-hidden>
            <span>{isFr ? "Glisse pour explorer" : "Swipe to explore"}</span>
            <ChevronRight className="h-4 w-4 pk-landing-community__nudge-icon" />
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => scrollBy(-1)}
          className={[
            "pk-landing-community__nav pk-landing-community__nav--left",
            edgeLeft ? "is-visible" : "",
          ].join(" ")}
          aria-label={isFr ? "Précédent" : "Previous"}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          className={[
            "pk-landing-community__nav pk-landing-community__nav--right",
            edgeRight ? "is-visible" : "",
          ].join(" ")}
          aria-label={isFr ? "Suivant" : "Next"}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div ref={railRef} className="pk-landing-community__rail">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="pk-landing-community__card pk-landing-community__card--skeleton animate-pulse">
                  <div className="h-44 rounded-2xl bg-white/5" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-white/5" />
                  <div className="mt-3 flex gap-2">
                    <div className="h-9 flex-1 rounded-full bg-white/5" />
                    <div className="h-9 w-24 rounded-full bg-white/5" />
                  </div>
                </div>
              ))
            : tracks.length
              ? tracks.map((t, idx) => {
                  const loopForCover = toCoverLoop(t);
                  const bg = coverGradient(loopForCover);
                  const url = t.coverUrl?.trim() || resolveCoverImageUrl(loopForCover);
                  const active = activeTrackId === t.id;
                  const playingNow = active && isPlaying;
                  const playable = isPlayablePublicLoop(t.audioUrl, t.stemsUrl);

                  return (
                    <article
                      key={t.id}
                      data-track-id={t.id}
                      className={[
                        "pk-landing-community__card group",
                        playingNow ? "pk-landing-community__card--playing" : "",
                      ].join(" ")}
                      style={{ animationDelay: `${Math.min(idx, 8) * 70}ms` }}
                    >
                      <button
                        type="button"
                        onClick={() => onPlay(t)}
                        className="pk-landing-community__cover-btn w-full text-left"
                        aria-label={playingNow ? (isFr ? `Pause ${t.name}` : `Pause ${t.name}`) : isFr ? `Écouter ${t.name}` : `Play ${t.name}`}
                      >
                        <div className="pk-landing-community__cover relative h-44 overflow-hidden rounded-2xl" style={{ background: bg }}>
                          {url ? (
                            <img
                              key={`${t.id}:${url}`}
                              src={url}
                              alt=""
                              loading={idx < 4 ? "eager" : "lazy"}
                              decoding="async"
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:scale-[1.03]"
                              onLoad={(e) => {
                                e.currentTarget.style.opacity = "1";
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : null}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                          <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                            {t.badge}
                          </div>
                          {t.createdAt && isNew(t.createdAt) ? (
                            <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              {isFr ? "Nouveau" : "New"}
                            </div>
                          ) : null}
                          <div
                            className={[
                              "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
                              playingNow ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                            ].join(" ")}
                          >
                            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white shadow-[0_0_40px_rgba(103,195,255,0.35)] backdrop-blur-md">
                              {playingNow ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
                            </span>
                          </div>
                        </div>
                      </button>

                      <div className="mt-4 min-w-0">
                        <div className="truncate text-sm font-semibold text-white">{t.name}</div>
                        {t.author ? (
                          <div className="mt-1.5">
                            <ProfileAuthorChip author={t.author} isFr={isFr} hideAvatar size="sm" className="max-w-full" />
                          </div>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {t.tags.slice(0, 3).map((x) => (
                            <span key={x} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-semibold text-white/55">
                              {x}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => onPlay(t)}
                            disabled={!playable}
                            className={[
                              "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition-all",
                              playable ? "pk-prism-btn rounded-full px-3 py-1.5 text-[11px] font-semibold" : "border border-white/10 bg-white/5 text-white/40",
                            ].join(" ")}
                          >
                            {playingNow ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            {playingNow ? (isFr ? "Pause" : "Pause") : isFr ? "Écouter" : "Listen"}
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemix(t)}
                            className="pk-glass-btn pk-glass-btn--ghost inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                            {isFr ? "Remixer" : "Remix"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              : (
                <div className="pk-landing-community__empty pk-prism-card p-6">
                  <div className="text-sm font-semibold text-white">
                    {isFr ? "Aucun aperçu audio pour le moment" : "No audio previews right now"}
                  </div>
                  <div className="mt-2 text-sm text-white/55">
                    {isFr ? "Les tracks publiques apparaissent ici dès qu’elles sont prêtes." : "Public tracks show up here as soon as they’re ready."}
                  </div>
                  {onRefresh ? (
                    <button
                      type="button"
                      onClick={onRefresh}
                      className="pk-glass-btn pk-glass-btn--ghost mt-4 inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold"
                    >
                      {isFr ? "Rafraîchir" : "Refresh"}
                    </button>
                  ) : null}
                </div>
              )}
        </div>
      </div>

      {footer}
    </div>
  );
}
