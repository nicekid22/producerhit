import { useEffect, useMemo, useState } from "react";
import type { AppLocale } from "@/i18n/config";
import {
  LANDING_HERO_PROMPTS_EN,
  LANDING_HERO_PROMPTS_FR,
  pickNextHeroPromptIndex,
} from "@/lib/landingHeroPrompts";
import { cn } from "@/lib/utils";

type Props = {
  locale: AppLocale;
  reduceMotion?: boolean;
  className?: string;
};

const CYCLE_MS = 5400;

export function HeroTypewriterPrompt({ locale, reduceMotion = false, className }: Props) {
  const pool = useMemo(() => (locale === "fr" ? [...LANDING_HERO_PROMPTS_FR] : [...LANDING_HERO_PROMPTS_EN]), [locale]);
  const [current, setCurrent] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    setCurrent(0);
    setPrevious(null);
    setIntroDone(false);
  }, [locale]);

  useEffect(() => {
    if (reduceMotion) {
      setIntroDone(true);
      return;
    }
    const id = window.setTimeout(() => setIntroDone(true), 1400);
    return () => window.clearTimeout(id);
  }, [locale, reduceMotion]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCurrent((idx) => {
        setPrevious(idx);
        return pickNextHeroPromptIndex(pool, idx);
      });
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [pool]);

  useEffect(() => {
    if (previous === null) return;
    const id = window.setTimeout(() => setPrevious(null), reduceMotion ? 0 : 1100);
    return () => window.clearTimeout(id);
  }, [previous, current, reduceMotion]);

  const seoTitle =
    locale === "fr"
      ? "Créateur de chansons IA — type beats, Song Mode, export royalty-free Spotify Ready"
      : "AI song creator — type beats, Song Mode, royalty-free Spotify Ready export";

  const currentText = pool[current] ?? pool[0] ?? "";
  const previousText = previous !== null ? pool[previous] ?? "" : "";

  return (
    <h1 className={cn("pk-hero-prompt-wrap mx-auto w-full max-w-2xl", className)}>
      <span className="sr-only">{seoTitle}</span>

      <div className="pk-hero-prompt-stage pk-hero-prompt-stage--compact">
        {previous !== null && previousText ? (
          <span
            className={cn(
              "pk-hero-prompt-layer pk-hero-prompt-line text-white/40",
              reduceMotion ? "pk-hero-prompt-layer--idle opacity-0" : "pk-hero-prompt-layer--out",
            )}
          >
            {previousText}
          </span>
        ) : null}

        <span
          key={current}
          className={cn(
            "pk-hero-prompt-layer pk-hero-prompt-line text-white/88",
            reduceMotion || (introDone && previous === null)
              ? "pk-hero-prompt-layer--idle"
              : "pk-hero-prompt-layer--in",
          )}
        >
          {currentText}
        </span>
      </div>
    </h1>
  );
}
