import { Link } from "react-router-dom";
import { BookOpen, GitCompare, ListChecks, Sparkles } from "lucide-react";
import type { SeoLandingExtras as Extras } from "@/lib/seoLandingExtras";

type Props = {
  extras: Extras;
  isFr: boolean;
  ctaHref: string;
};

export function SeoLandingExtras({ extras, isFr, ctaHref }: Props) {
  return (
    <>
      <section className="mt-14">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Sparkles className="h-6 w-6 text-violet-400" />
          {isFr ? "Cas d’usage" : "Use cases"}
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {extras.useCases.map((u) => (
            <li key={u} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/75">
              {u}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ListChecks className="h-6 w-6 text-cyan-400" />
          {isFr ? "Workflow en 4 étapes" : "4-step workflow"}
        </h2>
        <ol className="mt-6 space-y-4">
          {extras.workflow.map((w, i) => (
            <li key={w.step} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-200">
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-semibold text-white">{w.step}</div>
                <p className="mt-1 text-sm text-white/65">{w.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {extras.blogSlugs.length ? (
        <section className="mt-14">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white/90">
            <BookOpen className="h-5 w-5 text-amber-400" />
            {isFr ? "Guides liés" : "Related guides"}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {extras.blogSlugs.map((b) => (
              <Link
                key={b.slug}
                to={`/blog/${b.slug}`}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/70 hover:border-amber-400/25 hover:text-white"
              >
                {isFr ? b.labelFr : b.labelEn}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {extras.comparePaths.length ? (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white/90">
            <GitCompare className="h-5 w-5 text-pink-400" />
            {isFr ? "Comparatifs" : "Comparisons"}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {extras.comparePaths.map((c) => (
              <Link
                key={c.pathEn}
                to={isFr ? c.pathFr : c.pathEn}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/70 hover:border-pink-400/25 hover:text-white"
              >
                {isFr ? c.labelFr : c.labelEn}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-14 rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-200/80">
          {isFr ? "Conversion" : "Get started"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/75">
          {isFr
            ? "Crée un compte gratuit — crédits mensuels, lecture auto des résultats, export MP3. Upgrade pour WAV et plus de générations."
            : "Free account — monthly credits, autoplay results, MP3 export. Upgrade for WAV and higher limits."}
        </p>
        <Link
          to={ctaHref}
          className="mt-4 inline-flex rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          {isFr ? "Lancer le générateur" : "Launch generator"}
        </Link>
      </section>
    </>
  );
}
