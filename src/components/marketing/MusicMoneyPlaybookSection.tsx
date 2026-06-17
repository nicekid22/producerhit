import { ArrowRight, Mic2 } from "lucide-react";
import { Link } from "react-router-dom";
import { musicMoneyPlaybook, musicMoneySectionCopy } from "@/lib/musicMoneyPlaybook";
import { cn } from "@/lib/utils";

import type { AppLocale } from "@/i18n/config";
type Props = {
  locale: AppLocale;
  className?: string;
};

export function MusicMoneyPlaybookSection({ locale, className }: Props) {
  const copy = musicMoneySectionCopy(locale);
  const plays = musicMoneyPlaybook(locale);
  const isFr = locale === "fr";

  return (
    <section className={cn("pk-money-playbook", className)} aria-labelledby="pk-money-playbook-title">
      <div className="pk-money-playbook__origin pk-prism-card relative overflow-hidden px-5 py-5 sm:px-7 sm:py-6">
        <div className="pk-money-playbook__origin-glow" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200/65">{copy.eyebrow}</p>
            <h2 id="pk-money-playbook-title" className="mt-2 text-balance text-[clamp(1.35rem,3.2vw,1.85rem)] font-bold tracking-tight text-white">
              {copy.title}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/52">{copy.lead}</p>
          </div>
          <Link
            to="/commercial-license/example"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-white/12 bg-white/[0.05] px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-white/10"
          >
            <Mic2 className="h-3.5 w-3.5 opacity-70" aria-hidden />
            {isFr ? "Exemple licence" : "Sample license"}
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="pk-money-playbook__rail mt-5">
        {plays.map((play) => (
          <article key={play.id} className="pk-money-playbook__pill">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-white">{play.title}</h3>
              <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-200">
                {play.plan}
              </span>
            </div>
            <p className="pk-money-playbook__pill-potential">{play.potential}</p>
          </article>
        ))}
      </div>

      <p className="mt-4 text-center text-[11px] italic text-white/35">{copy.originLine}</p>
    </section>
  );
}
