import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Sparkles, Wand2, type LucideIcon } from "lucide-react";
import { landingCopy } from "@/lib/landingContent";

import type { AppLocale } from "@/i18n/config";
type Step = {
  n: string;
  t: string;
  d: string;
  note?: string;
  accent: "cyan" | "violet" | "pink";
  Icon: LucideIcon;
};

type Props = {
  locale: AppLocale;
};

export function LandingWorkflow({ locale }: Props) {
  const copy = landingCopy(locale);
  const [active, setActive] = useState(0);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  const steps = useMemo((): Step[] => {
    if (locale === "fr") {
      return [
        {
          n: "01",
          t: "Décris ton son",
          d: "Prompt + tags. Un seul objectif : trouver le bounce.",
          accent: "cyan",
          Icon: Wand2,
        },
        {
          n: "02",
          t: "Génère & itère",
          d: "Variations rapides. Garde la meilleure prise, regen le reste.",
          accent: "violet",
          Icon: Sparkles,
        },
        {
          n: "03",
          t: "Sauvegarde & exporte",
          d: "Bibliothèque + MP3/WAV royalty-free. Prêt Spotify, DAW & release.",
          note: "MP3 (Free) · WAV (Pro/Studio)",
          accent: "pink",
          Icon: Download,
        },
      ];
    }
    return [
      {
        n: "01",
        t: "Describe your sound",
        d: "Prompt + genre tags. Song Mode or Type Beat — one clear goal.",
        accent: "cyan",
        Icon: Wand2,
      },
      {
        n: "02",
        t: "Generate & iterate",
        d: "Fast variations. Keep the best take, regen the rest.",
        accent: "violet",
        Icon: Sparkles,
      },
      {
        n: "03",
        t: "Save & export",
        d: "Library + royalty-free MP3/WAV. Spotify Ready, DAW & release.",
        note: "MP3 (Free) · WAV (Pro/Studio)",
        accent: "pink",
        Icon: Download,
      },
    ];
  }, [locale]);

  useEffect(() => {
    let reduceMotion = false;
    try {
      reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      reduceMotion = false;
    }
    if (reduceMotion) return;

    const els = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        let best: IntersectionObserverEntry | null = null;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
        }
        if (!best) return;
        const idx = els.indexOf(best.target as HTMLDivElement);
        if (idx >= 0) setActive(idx);
      },
      { threshold: [0.2, 0.35, 0.5, 0.65, 0.8] },
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [steps.length]);

  return (
    <div className="pk-landing-workflow">
      <div className="pk-landing-workflow__aura" aria-hidden />
      <div className="pk-landing-workflow__grid relative z-[1] grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-14">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
            {locale === "fr" ? "Workflow" : "Workflow"}
          </p>
          <h2 className="pk-landing-section-head__title mt-3 text-left">
            <span className="pk-prism-holo-text">{copy.howTitle}</span>
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/58">{copy.howLead}</p>

          <div className="pk-landing-workflow__rail mt-8 hidden sm:block">
            {steps.map((s, idx) => (
              <div key={s.n} className="pk-landing-workflow__rail-item">
                <div
                  className={[
                    "pk-landing-workflow__node",
                    idx <= active ? "is-lit" : "",
                    idx === active ? "is-active" : "",
                    `pk-landing-workflow__node--${s.accent}`,
                  ].join(" ")}
                >
                  <span>{s.n}</span>
                </div>
                {idx < steps.length - 1 ? (
                  <div
                    className={[
                      "pk-landing-workflow__connector",
                      idx < active ? "is-lit" : "",
                    ].join(" ")}
                    aria-hidden
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-7 flex gap-2 sm:hidden">
            {steps.map((s, idx) => (
              <div key={s.n} className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
                <div
                  className={[
                    "pk-landing-workflow__mobile-bar h-full w-full transition-opacity duration-300",
                    idx <= active ? "opacity-100" : "opacity-0",
                  ].join(" ")}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {steps.map((step, idx) => {
            const Icon = step.Icon;
            const isActive = idx === active;
            return (
              <div
                key={step.n}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                className={[
                  "pk-landing-workflow-step",
                  `pk-landing-workflow-step--${step.accent}`,
                  isActive ? "pk-landing-workflow-step--active" : "",
                ].join(" ")}
              >
                <span className="pk-landing-workflow-step__sheen" aria-hidden />
                <span className="pk-landing-workflow-step__liquid" aria-hidden />
                <div className="relative z-[2] flex items-start justify-between gap-5">
                  <div className="min-w-0">
                    <div className="pk-landing-workflow-step__index">{step.n}</div>
                    <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">{step.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/58">{step.d}</p>
                    {step.note ? (
                      <p className="mt-3 text-xs font-semibold text-white/62">{step.note}</p>
                    ) : null}
                  </div>
                  <div
                    className={[
                      "pk-landing-workflow-step__orb shrink-0",
                      `pk-landing-workflow-step__orb--${step.accent}`,
                      isActive ? "is-active" : "",
                    ].join(" ")}
                    aria-hidden
                  >
                    <Icon className="relative z-[1] h-5 w-5 text-white/90" strokeWidth={1.75} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
