import { useEffect, useMemo, useState } from "react";
import type { AppLocale } from "@/i18n/config";
import {
  landingHeroDreamCopy,
  pickNextDreamHeadlineIndex,
} from "@/lib/landingHeroDreamCopy";
import { cn } from "@/lib/utils";

type Props = {
  locale: AppLocale;
  reduceMotion?: boolean;
  className?: string;
};

const CYCLE_MS = 7200;

export function HeroDreamHeadline({ locale, reduceMotion = false, className }: Props) {
  const { headlines, seoTitle } = useMemo(() => landingHeroDreamCopy(locale), [locale]);
  const pool = useMemo(() => [...headlines], [headlines]);
  const [current, setCurrent] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);

  useEffect(() => {
    setCurrent(0);
    setPrevious(null);
  }, [locale]);

  useEffect(() => {
    if (reduceMotion || pool.length <= 1) return;
    const id = window.setInterval(() => {
      setCurrent((idx) => {
        setPrevious(idx);
        return pickNextDreamHeadlineIndex(pool, idx);
      });
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [pool, reduceMotion]);

  useEffect(() => {
    if (previous === null) return;
    const id = window.setTimeout(() => setPrevious(null), reduceMotion ? 0 : 1400);
    return () => window.clearTimeout(id);
  }, [previous, current, reduceMotion]);

  const currentText = pool[current] ?? pool[0] ?? "";
  const previousText = previous !== null ? pool[previous] ?? "" : "";

  return (
    <h1 className={cn("pk-hero-dream-wrap mx-auto w-full max-w-2xl", className)}>
      <span className="sr-only">{seoTitle}</span>
      <div className="pk-hero-dream-stage">
        {previous !== null && previousText ? (
          <span
            className={cn(
              "pk-hero-dream-layer pk-hero-dream-line",
              reduceMotion ? "opacity-0" : "pk-hero-dream-layer--out",
            )}
          >
            {previousText}
          </span>
        ) : null}
        <span
          key={current}
          className={cn(
            "pk-hero-dream-layer pk-hero-dream-line pk-hero-dream-line--active",
            reduceMotion || previous === null ? "pk-hero-dream-layer--idle" : "pk-hero-dream-layer--in",
          )}
        >
          {currentText}
        </span>
      </div>
    </h1>
  );
}
