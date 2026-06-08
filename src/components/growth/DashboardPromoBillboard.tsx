import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AudioWaveform,
  ChevronRight,
  Flame,
  Megaphone,
  Music2,
  Sparkles,
  UserCircle,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  REFERRAL_REFEREE_START_TOTAL,
  REFERRAL_REFERRER_PLUS_BONUS,
} from "@/lib/referralConfig";
import { canClaimDailyBonus, loadGamification } from "@/lib/gamification";
import { trackClientEvent } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

const ROTATE_MS = 12000;
const HIDDEN_STORAGE_KEY = "producerhit_dashboard_spotlight_hidden_v1";

type SlideAccent = "cyan" | "violet" | "amber" | "orange" | "rose" | "emerald";

type Props = {
  locale: "en" | "fr";
  plan?: string;
  streak?: number;
  onShare?: () => void;
  onReferral?: () => void;
  onCommunity?: () => void;
  onMastering?: () => void;
  onProgress?: () => void;
  onPricing?: () => void;
  onProfile?: () => void;
  onCreate?: () => void;
  /** Bouton bonus fixe (dashboard) — hors carousel. */
  bonusAction?: ReactNode;
};

type SlideId =
  | "satisfaction"
  | "referral"
  | "community"
  | "mastering"
  | "streak"
  | "upgrade"
  | "profile"
  | "create";

type Slide = {
  id: SlideId;
  accent: SlideAccent;
  tag: string;
  headline: string;
  subline: string;
  cta: string;
  icon: typeof Megaphone;
  onClick?: () => void;
};

const ACCENT_STYLES: Record<
  SlideAccent,
  { pill: string; iconWrap: string; icon: string; dot: string; cta: string }
> = {
  cyan: {
    pill: "border-cyan-400/15 bg-cyan-500/[0.08] text-cyan-200/70",
    iconWrap: "border-cyan-400/15 bg-cyan-500/[0.1]",
    icon: "text-cyan-200",
    dot: "bg-cyan-300 shadow-[0_0_6px_rgba(103,195,255,0.45)]",
    cta: "text-cyan-200/90 hover:text-cyan-100",
  },
  violet: {
    pill: "border-violet-400/15 bg-violet-500/[0.08] text-violet-200/70",
    iconWrap: "border-violet-400/15 bg-violet-500/[0.1]",
    icon: "text-violet-200",
    dot: "bg-violet-300 shadow-[0_0_6px_rgba(157,124,255,0.45)]",
    cta: "text-violet-200/90 hover:text-violet-100",
  },
  amber: {
    pill: "border-amber-400/15 bg-amber-500/[0.08] text-amber-200/70",
    iconWrap: "border-amber-400/15 bg-amber-500/[0.1]",
    icon: "text-amber-200",
    dot: "bg-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.4)]",
    cta: "text-amber-200/90 hover:text-amber-100",
  },
  orange: {
    pill: "border-orange-400/15 bg-orange-500/[0.08] text-orange-200/70",
    iconWrap: "border-orange-400/15 bg-orange-500/[0.1]",
    icon: "text-orange-200",
    dot: "bg-orange-300 shadow-[0_0_6px_rgba(251,146,60,0.4)]",
    cta: "text-orange-200/90 hover:text-orange-100",
  },
  rose: {
    pill: "border-pink-400/15 bg-pink-500/[0.08] text-pink-200/70",
    iconWrap: "border-pink-400/15 bg-pink-500/[0.1]",
    icon: "text-pink-200",
    dot: "bg-pink-300 shadow-[0_0_6px_rgba(236,72,153,0.4)]",
    cta: "text-pink-200/90 hover:text-pink-100",
  },
  emerald: {
    pill: "border-emerald-400/15 bg-emerald-500/[0.08] text-emerald-200/70",
    iconWrap: "border-emerald-400/15 bg-emerald-500/[0.1]",
    icon: "text-emerald-200",
    dot: "bg-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.4)]",
    cta: "text-emerald-200/90 hover:text-emerald-100",
  },
};

function readHidden(): boolean {
  try {
    return window.localStorage.getItem(HIDDEN_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Bannière spotlight compacte — une ligne, rotation auto, dismissible. */
export function DashboardPromoBillboard({
  locale,
  plan = "free",
  streak: streakProp,
  onShare,
  onReferral,
  onCommunity,
  onMastering,
  onProgress,
  onPricing,
  onProfile,
  onCreate,
  bonusAction,
}: Props) {
  const isFr = locale === "fr";
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [hidden, setHidden] = useState(readHidden);
  const timerRef = useRef<number | null>(null);
  const gamification = loadGamification();
  const streak = streakProp ?? gamification.streak;
  const dailyReady = canClaimDailyBonus(gamification);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const slides = useMemo<Slide[]>(() => {
    const streakLine =
      streak > 0
        ? isFr
          ? `Série ${streak}j — partage ta dernière créa.`
          : `${streak}-day streak — share your latest track.`
        : isFr
          ? "Partage ta créa — le feedback fait monter la scène."
          : "Share your track — feedback lifts the scene.";

    const streakSlideLine = dailyReady
      ? isFr
        ? "Bonus du jour prêt — bouton Bonus à droite."
        : "Daily bonus ready — use the Bonus button."
      : streak > 0
        ? isFr
          ? `Série ${streak}j — reviens demain pour la garder.`
          : `${streak}-day streak — back tomorrow to keep it.`
        : isFr
          ? "Série + bonus quotidien = gens en plus."
          : "Streak + daily bonus = extra gens.";

    const all: Slide[] = [
      {
        id: "satisfaction",
        accent: "cyan",
        tag: isFr ? "Satisfaction" : "Satisfaction",
        headline: isFr ? "Tu kiffes ?" : "Loving it?",
        subline: streakLine,
        cta: isFr ? "Partager" : "Share",
        icon: Megaphone,
        onClick: onShare,
      },
      {
        id: "referral",
        accent: "violet",
        tag: isFr ? "Crew" : "Crew",
        headline: isFr ? "Invite ton crew" : "Invite your crew",
        subline: isFr
          ? `+${REFERRAL_REFERRER_PLUS_BONUS} gen pour toi · ${REFERRAL_REFEREE_START_TOTAL} pour lui`
          : `+${REFERRAL_REFERRER_PLUS_BONUS} gen for you · ${REFERRAL_REFEREE_START_TOTAL} for them`,
        cta: isFr ? "Inviter" : "Invite",
        icon: Users,
        onClick: onReferral,
      },
      {
        id: "community",
        accent: "amber",
        tag: isFr ? "Communauté" : "Community",
        headline: isFr ? "Remix league" : "Remix league",
        subline: isFr ? "Publie et pioche des idées." : "Go public and pick up ideas.",
        cta: isFr ? "Explorer" : "Explore",
        icon: Zap,
        onClick: onCommunity,
      },
      {
        id: "mastering",
        accent: "rose",
        tag: isFr ? "Mastering" : "Mastering",
        headline: isFr ? "Haute qualité Audio" : "High Quality/WAV",
        subline: isFr ? "Export pro, prêt pour la sortie." : "Pro export, release-ready.",
        cta: isFr ? "Studio" : "Studio",
        icon: AudioWaveform,
        onClick: onMastering,
      },
      {
        id: "streak",
        accent: "orange",
        tag: isFr ? "Série" : "Streak",
        headline: dailyReady ? (isFr ? "Bonus du jour" : "Daily bonus") : isFr ? "Garde la série" : "Keep streak",
        subline: streakSlideLine,
        cta: isFr ? "Paramètres" : "Settings",
        icon: Flame,
        onClick: onProgress,
      },
      {
        id: "create",
        accent: "violet",
        tag: isFr ? "Création" : "Create",
        headline: isFr ? "Nouvelle vibe" : "New vibe",
        subline: isFr ? "Change genre ou prompt." : "Switch genre or prompt.",
        cta: isFr ? "Générer" : "Generate",
        icon: Music2,
        onClick: onCreate,
      },
      {
        id: "profile",
        accent: "cyan",
        tag: isFr ? "Profil" : "Profile",
        headline: isFr ? "Profil créateur" : "Creator profile",
        subline: isFr ? "Username, bio, avatar publics." : "Public username, bio, avatar.",
        cta: isFr ? "Profil" : "Profile",
        icon: UserCircle,
        onClick: onProfile,
      },
    ];

    if (plan === "free") {
      all.splice(5, 0, {
        id: "upgrade",
        accent: "emerald",
        tag: isFr ? "Upgrade" : "Upgrade",
        headline: isFr ? "Passe Plus" : "Go Plus",
        subline: isFr ? "Plus de gen, mastering, priorité." : "More gens, mastering, priority.",
        cta: isFr ? "Tarifs" : "Pricing",
        icon: Sparkles,
        onClick: onPricing,
      });
    }

    return all.filter((slide) => slide.onClick);
  }, [
    dailyReady,
    isFr,
    onCommunity,
    onCreate,
    onMastering,
    onPricing,
    onProfile,
    onProgress,
    onReferral,
    onShare,
    plan,
    streak,
  ]);

  useEffect(() => {
    if (activeIndex >= slides.length) setActiveIndex(0);
  }, [activeIndex, slides.length]);

  const advance = useCallback(() => {
    setActiveIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused || reduceMotion || slides.length <= 1) return;
    timerRef.current = window.setInterval(advance, ROTATE_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [advance, paused, reduceMotion, slides.length]);

  const handleCta = (slide: Slide) => {
    trackClientEvent("dashboard_billboard_cta", { slide: slide.id, locale });
    slide.onClick?.();
  };

  const handleDot = (index: number) => {
    setActiveIndex(index);
    trackClientEvent("dashboard_billboard_dot", { slide: slides[index]?.id, locale });
  };

  const dismiss = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(HIDDEN_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    trackClientEvent("dashboard_billboard_dismiss", { locale });
  };

  if (hidden || !slides.length) return null;

  return (
    <div
      className="pk-dashboard-spotlight-banner mb-3 overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-r from-violet-500/[0.06] via-black/20 to-cyan-500/[0.05] px-2 py-1 sm:px-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-label={isFr ? "Messages spotlight" : "Spotlight messages"}
      role="region"
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="pk-dashboard-spotlight-banner__viewport min-w-0 flex-1">
          {slides.map((slide, index) => {
            const Icon = slide.icon;
            const accent = ACCENT_STYLES[slide.accent];
            const isActive = index === activeIndex;
            return (
              <article
                key={slide.id}
                className={cn(
                  "pk-dashboard-spotlight-banner__slide",
                  isActive && "is-active",
                  !reduceMotion && "pk-dashboard-spotlight-banner__slide--animated",
                )}
                aria-hidden={!isActive}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border",
                    accent.iconWrap,
                  )}
                >
                  <Icon className={cn("h-3 w-3", accent.icon)} aria-hidden />
                </div>

                <span
                  className={cn(
                    "hidden shrink-0 rounded-full border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide sm:inline",
                    accent.pill,
                  )}
                >
                  {slide.tag}
                </span>

                <p className="min-w-0 flex-1 truncate text-[11px] leading-none sm:text-xs">
                  <span className="font-semibold text-white/90">{slide.headline}</span>
                  <span className="hidden text-white/38 md:inline"> · {slide.subline}</span>
                </p>

                <button
                  type="button"
                  className={cn(
                    "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors sm:px-2 sm:text-[11px]",
                    accent.cta,
                  )}
                  onClick={() => handleCta(slide)}
                  tabIndex={isActive ? 0 : -1}
                >
                  <span className="hidden sm:inline">{slide.cta}</span>
                  <ChevronRight className="h-3 w-3 opacity-80" aria-hidden />
                </button>
              </article>
            );
          })}
        </div>

        {bonusAction ? (
          <div className="flex shrink-0 items-center border-l border-white/[0.06] pl-1.5 sm:pl-2">{bonusAction}</div>
        ) : null}

        <div
          className="flex shrink-0 items-center gap-1 border-l border-white/[0.06] pl-1.5 sm:pl-2"
          role="tablist"
          aria-label={isFr ? "Slides" : "Slides"}
        >
          {slides.length > 1
            ? slides.map((slide, index) => {
                const accent = ACCENT_STYLES[slide.accent];
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={index === activeIndex}
                    aria-label={slide.headline}
                    className={cn(
                      "h-1 w-1 rounded-full border border-white/15 bg-white/[0.08] transition-all sm:h-1.5 sm:w-1.5",
                      index === activeIndex && accent.dot,
                      index === activeIndex && "scale-110 border-transparent",
                    )}
                    onClick={() => handleDot(index)}
                  />
                );
              })
            : null}
          <button
            type="button"
            onClick={dismiss}
            className="ml-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/70"
            aria-label={isFr ? "Masquer le spotlight" : "Hide spotlight"}
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
