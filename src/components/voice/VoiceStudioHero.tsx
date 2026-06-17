import { Link } from "react-router-dom";
import { Mic2, Sparkles, Type, Users, Wand2, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Stat = { label: string; value: string; icon: LucideIcon };

type Props = {
  isFr: boolean;
  stats: Stat[];
  profileCount: number;
};

export function VoiceStudioHero({ isFr, stats, profileCount }: Props) {
  return (
    <header className="pk-voice-studio-hero">
      <div className="pk-voice-studio-hero__mesh" aria-hidden />
      <div className="pk-voice-studio-hero__orb pk-voice-studio-hero__orb--a" aria-hidden />
      <div className="pk-voice-studio-hero__orb pk-voice-studio-hero__orb--b" aria-hidden />

      <div className="pk-voice-studio-hero__top">
        <div className="min-w-0 flex-1">
          <p className="pk-voice-studio-hero__eyebrow">{isFr ? "Clone vocal ACE" : "ACE voice clone"}</p>
          <h1 className="pk-voice-studio-hero__title">{isFr ? "Voice Studio" : "Voice Studio"}</h1>
          <p className="pk-voice-studio-hero__subtitle">
            {isFr
              ? "Crée tes profils une fois — réutilise-les dans Song Mode."
              : "Create profiles once — reuse them in Song Mode."}
          </p>
        </div>

        <div className="pk-voice-studio-hero__stats" aria-label={isFr ? "Quotas Voice Studio" : "Voice Studio quotas"}>
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="pk-voice-studio-stat">
              <Icon className="pk-voice-studio-stat__icon" aria-hidden />
              <span className="pk-voice-studio-stat__value">{value}</span>
              <span className="pk-voice-studio-stat__label">{label}</span>
            </div>
          ))}
        </div>

        <Link to="/dashboard?mode=song" className="pk-voice-studio-hero__cta">
          <Sparkles className="h-4 w-4" aria-hidden />
          {isFr ? "Song Mode" : "Song Mode"}
        </Link>
      </div>

      <div className="pk-voice-studio-hero__footer">
        <span className="pk-voice-studio-hero__chip">
          <Users className="h-3.5 w-3.5" aria-hidden />
          {profileCount} {isFr ? (profileCount > 1 ? "voix sauvées" : "voix sauvée") : profileCount === 1 ? "saved voice" : "saved voices"}
        </span>
        <span className="pk-voice-studio-hero__chip pk-voice-studio-hero__chip--muted">
          <Waves className="h-3.5 w-3.5" aria-hidden />
          {isFr ? "15–60 s a cappella recommandé" : "15–60 s a cappella recommended"}
        </span>
      </div>
    </header>
  );
}
