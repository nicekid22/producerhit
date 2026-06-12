import { Link } from "react-router-dom";
import { Bookmark, Disc3, Layers, Search, Sparkles } from "lucide-react";

type Props = {
  isFr: boolean;
  totalCount: number;
  savedCount: number;
  genreCount: number;
  visibleCount: number;
};

export function LibraryVaultHero({
  isFr,
  totalCount,
  savedCount,
  genreCount,
  visibleCount,
}: Props) {
  const stats = [
    { label: isFr ? "Beats" : "Beats", value: totalCount, icon: Disc3 },
    { label: isFr ? "Favoris" : "Saved", value: savedCount, icon: Bookmark },
    { label: isFr ? "Genres" : "Genres", value: genreCount, icon: Layers },
    { label: isFr ? "Affichés" : "Visible", value: visibleCount, icon: Search },
  ];

  return (
    <header className="pk-library-hero">
      <div className="pk-library-hero__mesh" aria-hidden />
      <div className="pk-library-hero__orb pk-library-hero__orb--a" aria-hidden />
      <div className="pk-library-hero__orb pk-library-hero__orb--b" aria-hidden />

      <div className="pk-library-hero__top">
        <div className="min-w-0">
          <p className="pk-library-hero__eyebrow">{isFr ? "Vault créatif" : "Creative vault"}</p>
          <h1 className="pk-library-hero__title">{isFr ? "Bibliothèque" : "Library"}</h1>
          <p className="pk-library-hero__subtitle">
            {isFr
              ? "Tes créations — rejoue, remixe, partage."
              : "Your creations — replay, remix, share."}
          </p>
        </div>

        <div className="pk-library-hero__stats" aria-label={isFr ? "Statistiques bibliothèque" : "Library stats"}>
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="pk-library-stat-pill">
              <Icon className="pk-library-stat-pill__icon" aria-hidden />
              <span className="pk-library-stat-pill__value">{value}</span>
              <span className="pk-library-stat-pill__label">{label}</span>
            </div>
          ))}
        </div>

        <Link to="/dashboard" className="pk-library-hero__cta">
          <Sparkles className="h-4 w-4" />
          {isFr ? "Nouveau son" : "New track"}
        </Link>
      </div>
    </header>
  );
}
