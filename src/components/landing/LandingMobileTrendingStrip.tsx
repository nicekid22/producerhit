import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Pause, Play, Sparkles } from "lucide-react";
import { StoredLoopCover } from "@/components/cover/StoredLoopCover";
import { publicRowToCoverLoop, resolveLoopDisplayCoverUrl } from "@/lib/coverArt";
import { cn } from "@/lib/utils";
import type { LandingCommunityTrack } from "@/components/landing/LandingCommunityRail";
import { useMobileScrollReveal } from "@/hooks/useMobileScrollReveal";

import type { AppLocale } from "@/i18n/config";

type Props = {
  locale: AppLocale;
  tracks: LandingCommunityTrack[];
  loading: boolean;
  activeTrackId: string | null;
  isPlaying: boolean;
  onPlay: (track: LandingCommunityTrack) => void;
  onCreateSimilar?: (track: LandingCommunityTrack) => void;
};

export function LandingMobileTrendingStrip({
  locale,
  tracks,
  loading,
  activeTrackId,
  isPlaying,
  onPlay,
  onCreateSimilar,
}: Props) {
  const isFr = locale === "fr";
  const { ref: stageRef, revealed, scrollLinked } = useMobileScrollReveal();

  return (
    <section
      ref={stageRef}
      id="trending-mobile"
      className={cn(
        "pk-landing-trending-strip pk-landing-trending-strip--apple pk-landing-trending-scroll-stage lg:hidden",
        revealed && "is-scroll-revealed",
        scrollLinked && "is-scroll-linked",
      )}
      aria-label={isFr ? "Dernières créations publiques" : "Latest public tracks"}
    >
      <div className="pk-landing-trending-strip__head">
        <div>
          <p className="pk-landing-trending-strip__eyebrow">{isFr ? "Communauté live" : "Live community"}</p>
          <h2 className="pk-landing-trending-strip__title">{isFr ? "Dernières tracks publiques" : "Latest public tracks"}</h2>
        </div>
        <Link to="/community" className="pk-landing-trending-strip__link">
          {isFr ? "Tout voir" : "See all"}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div className="pk-landing-trending-strip__rail">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="pk-audio-card-wrap pk-audio-card-wrap--skeleton"
                style={{ "--card-i": i } as CSSProperties}
              >
                <div className="pk-audio-card" aria-hidden>
                  <div className="pk-audio-card__shell">
                    <div className="pk-audio-card__cover-wrap animate-pulse" />
                    <div className="pk-audio-card__info">
                      <span className="pk-audio-card__name-line animate-pulse" />
                      <span className="pk-audio-card__meta-line animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          : tracks.length
            ? tracks.slice(0, 10).map((track, index) => {
                const playingNow = activeTrackId === track.id && isPlaying;
                const loop = publicRowToCoverLoop({
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
                const coverUrl = track.coverUrl?.trim() || resolveLoopDisplayCoverUrl(loop);
                const meta =
                  [track.genre, track.mood].filter(Boolean).join(" · ") || (isFr ? "Track public" : "Public track");

                return (
                  <article
                    key={track.id}
                    className="pk-audio-card-wrap"
                    style={{ "--card-i": index } as CSSProperties}
                  >
                    <AudioCardTrackButton
                      track={track}
                      playingNow={playingNow}
                      isFr={isFr}
                      meta={meta}
                      coverUrl={coverUrl}
                      badge={track.badge}
                      onPlay={onPlay}
                    />
                    {onCreateSimilar ? (
                      <button
                        type="button"
                        onClick={() => onCreateSimilar(track)}
                        className="pk-audio-card__remix"
                      >
                        <Sparkles className="h-3 w-3" aria-hidden />
                        {isFr ? "Créer pareil" : "Create similar"}
                      </button>
                    ) : null}
                  </article>
                );
              })
            : (
              <p className="pk-landing-trending-strip__empty">{isFr ? "Aucune track publique pour le moment." : "No public tracks yet."}</p>
            )}
      </div>
    </section>
  );
}

function AudioCardTrackButton({
  track,
  playingNow,
  isFr,
  meta,
  coverUrl,
  badge,
  onPlay,
}: {
  track: LandingCommunityTrack;
  playingNow: boolean;
  isFr: boolean;
  meta: string;
  coverUrl: string;
  badge?: string;
  onPlay: (track: LandingCommunityTrack) => void;
}) {
  const titleRef = useRef<HTMLSpanElement>(null);
  const [titleClamped, setTitleClamped] = useState(false);

  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;

    const measure = () => {
      setTitleClamped(el.scrollWidth > el.clientWidth + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [track.name]);

  return (
    <button
      type="button"
      onClick={() => onPlay(track)}
      className={cn("pk-audio-card", playingNow && "is-playing", titleClamped && "is-title-clamped")}
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
      <div className="pk-audio-card__shell">
        <div className="pk-audio-card__cover-wrap">
          <StoredLoopCover
            coverUrl={coverUrl}
            className="absolute inset-0 h-full w-full"
            imageClassName="pk-audio-card__cover-img h-full w-full object-cover object-center"
            loading="lazy"
          />
          {badge ? <span className="pk-audio-card__badge">{badge}</span> : null}
          <span className="pk-audio-card__play-fab" aria-hidden>
            {playingNow ? (
              <Pause fill="currentColor" strokeWidth={0} />
            ) : (
              <Play className="ml-0.5" fill="currentColor" strokeWidth={0} />
            )}
          </span>
        </div>
        <div className="pk-audio-card__info">
          <span ref={titleRef} className="pk-audio-card__name" title={titleClamped ? track.name : undefined}>
            {track.name}
          </span>
          {titleClamped ? (
            <span className="pk-audio-card__hover-tip" role="tooltip">
              {track.name}
            </span>
          ) : null}
          <span className="pk-audio-card__meta">{meta}</span>
        </div>
      </div>
    </button>
  );
}
