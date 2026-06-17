import { Link } from "react-router-dom";
import { AudioWaveform, Bookmark, Disc3, Grid3X3, ListMusic, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  isFr: boolean;
  totalCount: number;
  savedCount: number;
  playlistCount: number;
  mixtapeCount: number;
};

export function LibraryVaultHero({ isFr, totalCount, savedCount, playlistCount, mixtapeCount }: Props) {
  const stats = [
    {
      label: isFr ? "Morceaux" : "Tracks",
      value: totalCount,
      icon: Music2,
      tone: "tracks" as const,
    },
    {
      label: isFr ? "Favoris" : "Saved",
      value: savedCount,
      icon: Bookmark,
      tone: "saved" as const,
    },
    {
      label: isFr ? "Playlists" : "Playlists",
      value: playlistCount,
      icon: ListMusic,
      tone: "playlists" as const,
    },
    {
      label: isFr ? "Mixtapes" : "Mixtapes",
      value: mixtapeCount,
      icon: Disc3,
      tone: "mixtapes" as const,
    },
  ];

  return (
    <header className="pk-library-hero pk-library-hero--cozy">
      <div className="pk-library-hero__mesh" aria-hidden />
      <div className="pk-library-hero__orb pk-library-hero__orb--a" aria-hidden />
      <div className="pk-library-hero__orb pk-library-hero__orb--b" aria-hidden />

      <div className="pk-library-hero__top">
        <div className="min-w-0">
          <p className="pk-library-hero__eyebrow">
            <Grid3X3 className="pk-library-hero__eyebrow-icon" aria-hidden />
            {isFr ? "Ton espace sonore" : "Your sound space"}
          </p>
          <h1 className="pk-library-hero__title">{isFr ? "Bibliothèque" : "Library"}</h1>
          <p className="pk-library-hero__subtitle">
            {isFr
              ? "Playlists, mixtapes et morceaux — un endroit cozy pour revenir écouter."
              : "Playlists, mixtapes and tracks — a cozy place you'll want to return to."}
          </p>
        </div>

        <div className="pk-library-hero__stats" aria-label={isFr ? "Statistiques bibliothèque" : "Library stats"}>
          {stats.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className={cn("pk-library-stat-pill", `pk-library-stat-pill--${tone}`)}>
              <Icon className="pk-library-stat-pill__icon" aria-hidden />
              <span className="pk-library-stat-pill__value">{value}</span>
              <span className="pk-library-stat-pill__label">{label}</span>
            </div>
          ))}
        </div>

        <Link to="/dashboard" className="pk-library-hero__cta">
          <AudioWaveform className="h-4 w-4" aria-hidden />
          {isFr ? "Créer un morceau" : "Create a track"}
        </Link>
      </div>
    </header>
  );
}
