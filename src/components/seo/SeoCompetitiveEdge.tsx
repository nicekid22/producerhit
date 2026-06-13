import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { COMPETITIVE_ADVANTAGE_ROWS, COMPETITIVE_COMPARE_LINKS } from "@/lib/competitiveAdvantage";

type Props = {
  isFr: boolean;
  compact?: boolean;
};

export function SeoCompetitiveEdge({ isFr, compact }: Props) {
  const rows = compact ? COMPETITIVE_ADVANTAGE_ROWS.filter((r) => r.highlight) : COMPETITIVE_ADVANTAGE_ROWS;

  return (
    <section className="mt-14">
      <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Trophy className="h-6 w-6 text-amber-400" />
        {isFr ? "ProducerHit vs Suno / Udio" : "ProducerHit vs Suno / Udio"}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65">
        {isFr
          ? "Pourquoi les producteurs choisissent ProducerHit en 2026 : profondeur de genres, itération seed, beat + chanson, remix communauté — pas un one-shot démo."
          : "Why producers pick ProducerHit in 2026: genre depth, seed iteration, beat + song, community remix — not a one-shot demo tool."}
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/45">
              <th className="px-4 py-3 font-semibold">{isFr ? "Critère" : "Feature"}</th>
              <th className="px-4 py-3 font-semibold text-emerald-300">ProducerHit</th>
              <th className="px-4 py-3 font-semibold">Suno</th>
              <th className="px-4 py-3 font-semibold">Udio</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.feature}
                className={`border-b border-white/[0.06] last:border-0${row.highlight ? " bg-emerald-500/[0.04]" : ""}`}
              >
                <td className="px-4 py-3 font-medium text-white/85">{isFr ? row.featureFr : row.feature}</td>
                <td className="px-4 py-3 text-emerald-100/90">{isFr ? row.producerhitFr : row.producerhit}</td>
                <td className="px-4 py-3 text-white/55">{isFr ? row.sunoFr : row.suno}</td>
                <td className="px-4 py-3 text-white/55">{isFr ? row.udioFr : row.udio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to={isFr ? COMPETITIVE_COMPARE_LINKS.pathFr : COMPETITIVE_COMPARE_LINKS.pathEn}
          className="rounded-full border border-amber-400/25 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-100 hover:border-amber-400/40"
        >
          {isFr ? "ProducerHit vs Suno" : "ProducerHit vs Suno"}
        </Link>
        <Link
          to={isFr ? COMPETITIVE_COMPARE_LINKS.pathUdioFr : COMPETITIVE_COMPARE_LINKS.pathUdioEn}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/70 hover:text-white"
        >
          {isFr ? "ProducerHit vs Udio" : "ProducerHit vs Udio"}
        </Link>
        <Link
          to={`/blog/${COMPETITIVE_COMPARE_LINKS.blogSlug}`}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/70 hover:text-white"
        >
          {isFr ? "Guide complet 2026" : "Full 2026 guide"}
        </Link>
      </div>
    </section>
  );
}
