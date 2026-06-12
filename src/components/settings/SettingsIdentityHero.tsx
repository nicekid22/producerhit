import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { id: string; label: string };

type Props = {
  isFr: boolean;
  initials: string;
  displayName: string;
  email: string;
  plan: string;
  planClass: string;
  usedThisMonth: number;
  limit: number;
  remaining: number;
  pct: number;
  publicProfileUrl: string | null;
  navItems: NavItem[];
  activeSection?: string;
  onNav: (id: string) => void;
};

export function SettingsIdentityHero({
  isFr,
  initials,
  displayName,
  email,
  plan,
  planClass,
  usedThisMonth,
  limit,
  remaining,
  pct,
  publicProfileUrl,
  navItems,
  activeSection,
  onNav,
}: Props) {
  return (
    <header className="pk-settings-hero">
      <div className="pk-settings-hero__mesh" aria-hidden />
      <div className="pk-settings-hero__orb pk-settings-hero__orb--a" aria-hidden />
      <div className="pk-settings-hero__orb pk-settings-hero__orb--b" aria-hidden />

      <div className="pk-settings-hero__top">
        <div className="pk-settings-hero__identity">
          <div className="pk-settings-hero__avatar" aria-hidden>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="pk-settings-hero__eyebrow">{isFr ? "Espace personnel" : "Personal space"}</p>
            <h1 className="pk-settings-hero__title">{displayName}</h1>
            <p className="pk-settings-hero__email">{email}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className={cn("pk-prism-tier-badge", planClass)}>
                <Sparkles className="h-3 w-3" />
                {plan}
              </span>
              {publicProfileUrl ? (
                <Link to={publicProfileUrl} className="pk-settings-hero__link">
                  {isFr ? "Profil public →" : "Public profile →"}
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="pk-settings-hero__quota">
          <div
            className="pk-settings-quota-ring"
            style={{ "--pk-quota-pct": `${Math.min(100, Math.max(0, pct))}%` } as CSSProperties}
            aria-label={
              isFr
                ? `${remaining} générations restantes sur ${limit}`
                : `${remaining} generations left of ${limit}`
            }
          >
            <div className="pk-settings-quota-ring__inner">
              <span className="pk-settings-quota-ring__value">{remaining}</span>
              <span className="pk-settings-quota-ring__label">{isFr ? "restants" : "left"}</span>
            </div>
          </div>
          <div className="pk-settings-hero__quota-meta">
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <Zap className="h-3.5 w-3.5 text-pk-accent" />
              <span>
                {usedThisMonth}/{limit} {isFr ? "ce mois" : "this month"}
              </span>
            </div>
            <Link to="/pricing" className="pk-settings-hero__upgrade">
              {isFr ? "Upgrade" : "Upgrade"}
            </Link>
          </div>
        </div>
      </div>

      <nav className="pk-settings-nav" aria-label={isFr ? "Sections paramètres" : "Settings sections"}>
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNav(item.id)}
            className={cn("pk-settings-nav__pill", activeSection === item.id && "pk-settings-nav__pill--active")}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
