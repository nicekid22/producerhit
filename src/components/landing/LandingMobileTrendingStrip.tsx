import { Link } from "react-router-dom";
import { ChevronRight, Pause, Play, Sparkles } from "lucide-react";
import { StoredLoopCover } from "@/components/cover/StoredLoopCover";
import { publicRowToCoverLoop, resolveLoopDisplayCoverUrl } from "@/lib/coverArt";
import { cn, COVER_SURFACE_CLASS } from "@/lib/utils";
import type { LandingCommunityTrack } from "@/components/landing/LandingCommunityRail";

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

  return (
    <section
      id="trending-mobile"
      className="pk-landing-trending-strip lg:hidden"
      aria-label={isFr ? "Dernières créations publiques" : "Latest public tracks"}
    >
      <div className="pk-landing-trending-strip__head">
        <div>
          <p className="pk-landing-trending-strip__eyebrow">{isFr ? "Communauté live" : "Live community"}</p>
          <h2 className="pk-landing-trending-strip__title">{isFr ? "Dernières tracks publiques" : "Latest public tracks"}</h2>
        </div>
        <Link to="/community" className="pk-landing-trending-strip__link">
          {isFr ? "Tout voir" : "See all"}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="pk-landing-trending-strip__rail">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="pk-landing-trending-strip__card pk-landing-trending-strip__card--skeleton animate-pulse">
                <div className="pk-landing-trending-strip__cover bg-white/5" />
                <div className="mt-2 h-3 w-3/4 rounded bg-white/5" />
              </div>
            ))
          : tracks.length
            ? tracks.slice(0, 10).map((track) => {
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

                return (
                  <div key={track.id} className="pk-landing-trending-strip__card-wrap">
                    <button
                      type="button"
                      onClick={() => onPlay(track)}
                      className={cn("pk-landing-trending-strip__card", playingNow && "is-playing")}
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
                      <div className={cn("pk-landing-trending-strip__cover", COVER_SURFACE_CLASS, playingNow && "is-playing")}>
                        <StoredLoopCover
                          coverUrl={coverUrl}
                          className="absolute inset-0 h-full w-full"
                          imageClassName="pk-landing-trending-strip__cover-img h-full w-full object-cover object-center"
                          loading="eager"
                        />
                        <span className="pk-landing-trending-strip__cover-tint" aria-hidden />
                        <span className="pk-landing-trending-strip__play" aria-hidden>
                          {playingNow ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
                        </span>
                        <span className="pk-landing-trending-strip__badge">{track.badge}</span>
                      </div>
                      <span className="pk-landing-trending-strip__name">{track.name}</span>
                      <span className="pk-landing-trending-strip__meta">
                        {[track.genre, track.mood].filter(Boolean).join(" · ") || (isFr ? "Track public" : "Public track")}
                      </span>
                    </button>
                    {onCreateSimilar ? (
                      <button
                        type="button"
                        onClick={() => onCreateSimilar(track)}
                        className="pk-landing-trending-strip__create-btn"
                      >
                        <Sparkles className="h-3 w-3" aria-hidden />
                        {isFr ? "Créer pareil" : "Create similar"}
                      </button>
                    ) : null}
                  </div>
                );
              })
            : (
              <p className="pk-landing-trending-strip__empty">{isFr ? "Aucune track publique pour le moment." : "No public tracks yet."}</p>
            )}
      </div>
    </section>
  );
}
