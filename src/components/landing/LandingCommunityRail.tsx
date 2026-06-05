import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pause, Play, Radio, Shuffle, Sparkles } from "lucide-react";
import type { Loop } from "@/types/loop";
import type { PublicProfileCard } from "@/lib/creatorProfile";
import { StoredLoopCover } from "@/components/cover/StoredLoopCover";
import { publicRowToCoverLoop, resolveLoopDisplayCoverUrl } from "@/lib/coverArt";
import { COVER_SURFACE_CLASS, cn } from "@/lib/utils";
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
  /** Masque le paragraphe lead (landing mobile épurée). */
  compactLead?: boolean;
};

const INITIAL_VISIBLE = 4;
const LOAD_BATCH = 3;

function isNew(createdAt: string | null) {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
}

function toCoverLoop(track: LandingCommunityTrack): Loop {
  return publicRowToCoverLoop({
    id: track.id,
    name: track.name,
    genre: track.genre,
    mood: track.mood,
    bpm: track.bpm,
    prompt: track.prompt,
    stems_url: track.stemsUrl ?? null,
    seed: track.seed ?? null,
    created_at: track.createdAt,
  });
}

function LandingCommunityCardCover({
  track,
  coverPriority,
  playingNow,
  isFr,
  onPlay,
}: {
  track: LandingCommunityTrack;
  coverPriority: boolean;
  playingNow: boolean;
  isFr: boolean;
  onPlay: () => void;
}) {
  const loopForCover = toCoverLoop(track);
  const coverUrl = track.coverUrl?.trim() || resolveLoopDisplayCoverUrl(loopForCover);
  return (
    <button
      type="button"
      onClick={onPlay}
      className="pk-landing-community__cover-btn w-full text-left"
      aria-label={
        playingNow
          ? isFr
            ? `Pause ${track.name}`
            : `Pause ${track.name}`
          : isFr
            ? `Écouter ${track.name}`
            : `Play ${track.name}`
      }
    >
      <div
        className={cn(
          "pk-landing-community__cover relative h-44 overflow-hidden rounded-2xl sm:h-48",
          COVER_SURFACE_CLASS,
          playingNow && "is-playing",
        )}
      >
        <div className="pk-landing-community__cover-media">
          <StoredLoopCover
            coverUrl={coverUrl}
            className="absolute inset-0"
            imageClassName="pk-landing-community__cover-img"
            loading={coverPriority ? "eager" : "lazy"}
          />
        </div>
        <div className="pk-landing-community__cover-shine" aria-hidden />
        <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-black/70 via-black/12 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {track.badge}
        </div>
        {track.createdAt && isNew(track.createdAt) ? (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {isFr ? "Nouveau" : "New"}
          </div>
        ) : null}
        {playingNow ? (
          <div className="pk-landing-community__eq pointer-events-none absolute bottom-3 left-3 right-3 z-[4] flex items-end justify-center gap-[3px]" aria-hidden>
            {Array.from({ length: 18 }).map((_, i) => (
              <span key={i} className="pk-landing-community__eq-bar" style={{ animationDelay: `${(i % 9) * 72}ms` }} />
            ))}
          </div>
        ) : null}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-[4] flex items-center justify-center transition-opacity duration-300",
            playingNow ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          <span className="pk-landing-community__play-fab flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white backdrop-blur-md">
            {playingNow ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
          </span>
        </div>
      </div>
    </button>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/** Léger tilt souris sur la carte centrée du carousel communauté. */
function useCommunityCenterTilt(reduceMotion: boolean, enabled: boolean, focusedIndex: number) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [pointerTilt, setPointerTilt] = useState({ rx: 0, ry: 0, tx: 0, ty: 0 });
  const [pointerOn, setPointerOn] = useState(false);

  useEffect(() => {
    setPointerOn(false);
    setPointerTilt({ rx: 0, ry: 0, tx: 0, ty: 0 });
  }, [focusedIndex]);

  useEffect(() => {
    if (reduceMotion || !enabled) return;
    const stage = stageRef.current;
    if (!stage) return;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!finePointer) return;

    const onMove = (e: PointerEvent) => {
      const card = stage.querySelector<HTMLElement>(".pk-landing-community__card--focus");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      const cx = clamp(nx);
      const cy = clamp(ny);
      setPointerOn(true);
      setPointerTilt({
        rx: cy * -1.6,
        ry: cx * 2,
        tx: cx * 3,
        ty: cy * 2.5,
      });
    };

    const onLeave = () => {
      setPointerOn(false);
      setPointerTilt({ rx: 0, ry: 0, tx: 0, ty: 0 });
    };

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, [reduceMotion, enabled, focusedIndex]);

  const centerInnerStyle = pointerOn
    ? {
        transform: `perspective(900px) rotateX(${pointerTilt.rx}deg) rotateY(${pointerTilt.ry}deg) translate3d(${pointerTilt.tx}px, ${pointerTilt.ty}px, 0)`,
      }
    : undefined;

  return {
    stageRef,
    centerInnerClass: cn(
      "pk-landing-community__center-inner",
      !pointerOn && !reduceMotion && "pk-landing-community__center-inner--float",
      pointerOn && "pk-landing-community__center-inner--tilt",
    ),
    centerInnerStyle,
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
  compactLead = false,
}: Props) {
  const isFr = locale === "fr";
  const reduceMotion = useReducedMotion();
  const railRef = useRef<HTMLDivElement | null>(null);
  const loadSentinelRef = useRef<HTMLDivElement | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const visibleTracks = useMemo(() => tracks.slice(0, visibleCount), [tracks, visibleCount]);
  const centerTilt = useCommunityCenterTilt(reduceMotion, !loading && visibleTracks.length > 0, focusedIndex);

  useEffect(() => {
    if (loading) return;
    setVisibleCount(Math.min(INITIAL_VISIBLE, tracks.length || INITIAL_VISIBLE));
    setFocusedIndex(0);
  }, [loading, tracks.length]);

  const syncFocus = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const cards = rail.querySelectorAll<HTMLElement>("[data-community-idx]");
    if (!cards.length) return;
    const railRect = rail.getBoundingClientRect();
    const railCenter = railRect.left + railRect.width / 2;
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const dist = Math.abs(rect.left + rect.width / 2 - railCenter);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setFocusedIndex(best);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || loading) return;
    syncFocus();
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncFocus);
    };
    rail.addEventListener("scroll", onScroll, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(syncFocus) : null;
    ro?.observe(rail);
    return () => {
      rail.removeEventListener("scroll", onScroll);
      ro?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [loading, visibleTracks.length, syncFocus]);

  useEffect(() => {
    if (loading || visibleCount >= tracks.length) return;
    const sentinel = loadSentinelRef.current;
    const rail = railRef.current;
    if (!sentinel || !rail) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + LOAD_BATCH, tracks.length));
        }
      },
      { root: rail, rootMargin: "0px 120px 0px 0px", threshold: 0.01 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, visibleCount, tracks.length]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const rail = railRef.current;
      if (!rail) return;
      const card = rail.querySelector<HTMLElement>(`[data-community-idx="${index}"]`);
      card?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", inline: "center", block: "nearest" });
    },
    [reduceMotion],
  );

  useEffect(() => {
    if (loading || !visibleTracks.length) return;
    const rail = railRef.current;
    if (!rail) return;
    // Important : ne pas utiliser scrollIntoView ici, sinon le navigateur peut faire défiler
    // toute la page jusqu’à la section "trending" au chargement.
    rail.scrollLeft = 0;
  }, [loading, visibleTracks.length]);

  const scrollByStep = (dir: -1 | 1) => {
    const next = Math.max(0, Math.min(visibleTracks.length - 1, focusedIndex + dir));
    scrollToIndex(next);
  };

  const shufflePlay = () => {
    if (!visibleTracks.length) return;
    const pick = visibleTracks[Math.floor(Math.random() * visibleTracks.length)]!;
    onPlay(pick);
    const idx = visibleTracks.findIndex((t) => t.id === pick.id);
    if (idx >= 0) scrollToIndex(idx);
  };

  const canScrollLeft = focusedIndex > 0;
  const canScrollRight = focusedIndex < visibleTracks.length - 1 || visibleCount < tracks.length;
  const totalLabel = tracks.length;

  return (
    <div id="trending" className="pk-landing-community">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pk-prism-live-badge">
              <span className="pk-prism-live-badge__dot" aria-hidden />
              {isFr ? "Live" : "Live"}
            </span>
            {!loading && totalLabel ? (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/45">
                {totalLabel} {isFr ? "tracks" : "tracks"}
              </span>
            ) : null}
          </div>
          <h2 className="mt-3 text-balance text-[clamp(1.5rem,3.2vw,2.25rem)] font-bold tracking-tight text-white">
            <span className="pk-prism-holo-text">{title}</span>
          </h2>
          <p className={cn("mt-3 max-w-3xl text-balance text-sm leading-relaxed text-white/60", compactLead && "pk-landing-community__lead--compact")}>
            {lead}
          </p>
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

      <div
        ref={centerTilt.stageRef}
        className="pk-landing-community__stage pk-landing-community__stage--cinema mt-6 sm:mt-8"
      >
        <div className="pk-landing-community__aurora" aria-hidden />
        <div className="pk-landing-community__spotlight" aria-hidden />

        <button
          type="button"
          onClick={() => scrollByStep(-1)}
          disabled={!canScrollLeft}
          className={cn("pk-landing-community__nav pk-landing-community__nav--left", canScrollLeft && "is-visible")}
          aria-label={isFr ? "Précédent" : "Previous"}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollByStep(1)}
          disabled={!canScrollRight}
          className={cn("pk-landing-community__nav pk-landing-community__nav--right", canScrollRight && "is-visible")}
          aria-label={isFr ? "Suivant" : "Next"}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div ref={railRef} className="pk-landing-community__rail pk-landing-community__rail--cinema" role="list">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="pk-landing-community__card pk-landing-community__card--skeleton pk-landing-community__card--focus animate-pulse"
                  role="listitem"
                >
                  <div className="h-44 rounded-2xl bg-white/5 sm:h-48" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-white/5" />
                  <div className="mt-3 flex gap-2">
                    <div className="h-9 flex-1 rounded-full bg-white/5" />
                    <div className="h-9 w-24 rounded-full bg-white/5" />
                  </div>
                </div>
              ))
            : visibleTracks.length
              ? visibleTracks.map((t, idx) => {
                  const active = activeTrackId === t.id;
                  const playingNow = active && isPlaying;
                  const playable = isPlayablePublicLoop(t.audioUrl, t.stemsUrl, t.createdAt);
                  const isCenter = idx === focusedIndex;
                  const dist = Math.abs(idx - focusedIndex);
                  const focusClass =
                    dist === 0
                      ? "pk-landing-community__card--focus"
                      : dist === 1
                        ? "pk-landing-community__card--adjacent"
                        : "pk-landing-community__card--far";

                  const cardBody = (
                    <>
                      <LandingCommunityCardCover
                        track={t}
                        coverPriority={dist <= 1}
                        playingNow={playingNow}
                        isFr={isFr}
                        onPlay={() => onPlay(t)}
                      />

                      <div className="mt-4 min-w-0">
                        <div className="truncate text-sm font-semibold text-white">{t.name}</div>
                        {t.author ? (
                          <div className="mt-1.5">
                            <ProfileAuthorChip author={t.author} isFr={isFr} hideAvatar size="sm" className="max-w-full" />
                          </div>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {t.tags.slice(0, 3).map((x) => (
                            <span
                              key={x}
                              className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-semibold text-white/55"
                            >
                              {x}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => onPlay(t)}
                            disabled={!playable}
                            className={cn(
                              "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition-all",
                              playable
                                ? "pk-prism-btn rounded-full px-3 py-1.5 text-[11px] font-semibold"
                                : "border border-white/10 bg-white/5 text-white/40",
                            )}
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
                    </>
                  );

                  return (
                    <article
                      key={t.id}
                      data-track-id={t.id}
                      data-community-idx={idx}
                      role="listitem"
                      className={cn(
                        "pk-landing-community__card group",
                        focusClass,
                        playingNow && "pk-landing-community__card--playing",
                        !reduceMotion && "pk-landing-community__card--reveal",
                      )}
                      style={!reduceMotion ? { animationDelay: `${Math.min(idx, 6) * 90}ms` } : undefined}
                    >
                      {isCenter ? (
                        <div className={centerTilt.centerInnerClass} style={centerTilt.centerInnerStyle}>
                          {cardBody}
                        </div>
                      ) : (
                        cardBody
                      )}
                    </article>
                  );
                })
              : (
                <div className="pk-landing-community__empty pk-prism-card p-6" role="listitem">
                  <div className="text-sm font-semibold text-white">
                    {isFr ? "Aucun aperçu audio pour le moment" : "No audio previews right now"}
                  </div>
                  <div className="mt-2 text-sm text-white/55">
                    {isFr
                      ? "Les tracks publiques apparaissent ici dès qu’elles sont prêtes."
                      : "Public tracks show up here as soon as they’re ready."}
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

          {!loading && visibleCount < tracks.length ? (
            <div ref={loadSentinelRef} className="pk-landing-community__sentinel" aria-hidden />
          ) : null}
        </div>

        {!loading && tracks.length > 1 ? (
          <div className="pk-landing-community__filmstrip" role="tablist" aria-label={isFr ? "Navigation des tracks" : "Track navigation"}>
            {tracks.map((t, i) => {
              const mounted = i < visibleCount;
              const isActive = i === focusedIndex && mounted;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={t.name}
                  disabled={!mounted}
                  onClick={() => mounted && scrollToIndex(i)}
                  className={cn(
                    "pk-landing-community__filmstrip-dot",
                    isActive && "is-active",
                    mounted && !isActive && "is-ready",
                  )}
                />
              );
            })}
            {visibleCount < tracks.length ? (
              <span className="pk-landing-community__filmstrip-more" aria-hidden>
                +
              </span>
            ) : null}
          </div>
        ) : null}

        {!loading && visibleTracks.length > 3 && visibleCount < tracks.length ? (
          <p className="pk-landing-community__scroll-hint">
            {isFr ? "Continue à défiler — d’autres tracks arrivent" : "Keep scrolling — more tracks loading"}
          </p>
        ) : null}
      </div>

      {footer}
    </div>
  );
}
