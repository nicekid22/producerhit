import { Link } from "react-router-dom";
import {
  Compass,
  Gift,
  Globe2,
  Layers,
  Music2,
  Share2,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { landingCopy, landingValueBlocks } from "@/lib/landingContent";
import { PLAN_LIMITS } from "@/lib/planLimits";
import { Button } from "@/components/ui/Button";

type Props = {
  locale: "en" | "fr";
  user: boolean;
};

const ICONS = [Music2, Share2, ShieldCheck, Layers, Wand2, Sparkles] as const;

export function LandingValueGrid({ locale, user }: Props) {
  const copy = landingCopy(locale);
  const blocks = landingValueBlocks(locale);
  const isFr = locale === "fr";

  return (
    <div className="grid gap-10 sm:gap-14">
      <section id="free" className="pk-prism-card relative overflow-hidden p-6 sm:p-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(236,72,153,0.12),transparent_55%),radial-gradient(ellipse_at_90%_100%,rgba(103,195,255,0.1),transparent_50%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-6 text-center lg:px-10">
            <Gift className="h-6 w-6 text-[var(--prism-cyan)]" strokeWidth={1.75} />
            <div className="mt-2 text-[clamp(2.5rem,8vw,4rem)] font-extrabold leading-none tracking-tight text-white">
              {PLAN_LIMITS.free}
            </div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/50">
              {isFr ? "gratuit / mois" : "free / month"}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink-300/75">
              {isFr ? "Plan Free" : "Free plan"}
            </p>
            <h2 className="mt-2 text-balance text-[clamp(1.35rem,3.2vw,2rem)] font-bold tracking-tight text-white">
              {copy.freeSpotlightTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">{copy.freeSpotlightLead}</p>
            <div className="mt-6">
              <Link to={user ? "/dashboard" : "/auth"}>
                <Button variant="primary">{copy.heroCtaPrimary}</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {blocks.map((block, i) => {
          const Icon = ICONS[i] ?? Sparkles;
          return (
            <article key={block.id} className="pk-prism-card flex h-full flex-col p-5 sm:p-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                <Icon className="h-5 w-5 text-[var(--prism-violet)]" strokeWidth={1.75} />
              </div>
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">{block.eyebrow}</p>
              <h3 className="mt-2 text-base font-bold tracking-tight text-white sm:text-lg">{block.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">{block.body}</p>
            </article>
          );
        })}
      </section>

      <section id="explore-inspire" className="pk-prism-card relative overflow-hidden p-6 text-center sm:p-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(157,124,255,0.1),transparent_70%)]" />
        <div className="relative mx-auto max-w-2xl">
          <Globe2 className="mx-auto h-7 w-7 text-[var(--prism-cyan)]" strokeWidth={1.75} />
          <h2 className="mt-4 text-balance text-[clamp(1.35rem,3.5vw,2.25rem)] font-bold tracking-tight text-white">
            <span className="pk-prism-holo-text">{copy.exploreCtaTitle}</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/60">{copy.exploreCtaLead}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/community">
              <Button variant="secondary">
                <Compass className="h-4 w-4" />
                {copy.exploreCtaButton}
              </Button>
            </Link>
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button variant="primary">{copy.heroCtaPrimary}</Button>
            </Link>
          </div>
          <p className="mt-4 text-[11px] font-semibold text-white/35">
            {isFr
              ? "Crée des songs, remixe des tracks, exporte — où que tu sois."
              : "Create songs, remix tracks, export — wherever you are."}
          </p>
        </div>
      </section>
    </div>
  );
}
