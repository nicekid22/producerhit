import { Link } from "react-router-dom";
import { AudioWaveform, Bookmark, Disc3, Grid3X3, ListMusic, Music2 } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import { buildLibrarySection } from "@/i18n/libraryCatalog";
import { cn } from "@/lib/utils";

type Props = {
  locale: AppLocale;
  totalCount: number;
  savedCount: number;
  playlistCount: number;
  mixtapeCount: number;
};

export function LibraryVaultHero({ locale, totalCount, savedCount, playlistCount, mixtapeCount }: Props) {
  const lb = buildLibrarySection(locale);
  const stats = [
    { label: lb.statTracks, value: totalCount, icon: Music2, tone: "tracks" as const },
    { label: lb.statSaved, value: savedCount, icon: Bookmark, tone: "saved" as const },
    { label: lb.statPlaylists, value: playlistCount, icon: ListMusic, tone: "playlists" as const },
    { label: lb.statMixtapes, value: mixtapeCount, icon: Disc3, tone: "mixtapes" as const },
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
            {lb.eyebrow}
          </p>
          <h1 className="pk-library-hero__title">{lb.title}</h1>
          <p className="pk-library-hero__subtitle">{lb.subtitle}</p>
        </div>

        <div className="pk-library-hero__stats" aria-label={lb.statsAria}>
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
          {lb.createTrack}
        </Link>
      </div>
    </header>
  );
}
