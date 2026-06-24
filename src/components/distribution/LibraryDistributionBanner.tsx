import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Circle, GraduationCap, History, Package } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import { buildLibrarySection } from "@/i18n/libraryCatalog";
import { canDistribute } from "@/lib/planEntitlements";
import { DISTRIBUTION_ACADEMY_VALUE_USD } from "@/content/academy/distribution/modules";
import type { Loop } from "@/types/loop";
import { cn } from "@/lib/utils";

type Props = {
  locale: AppLocale;
  plan: string;
  selectedLoop: Loop | null;
  onDistribute: (loop: Loop) => void;
  className?: string;
};

export function LibraryDistributionBanner({ locale, plan, selectedLoop, onDistribute, className }: Props) {
  const lb = buildLibrarySection(locale);
  const eligible = canDistribute(plan);
  const step1Done = Boolean(selectedLoop);

  return (
    <section
      className={cn(
        "pk-library-distribution-banner rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-600/20 via-violet-500/10 to-fuchsia-600/10 p-4 sm:p-5",
        className,
      )}
      aria-labelledby="library-distribution-title"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-200/90">
            <Package className="h-4 w-4 shrink-0" aria-hidden />
            {lb.distributionEyebrow}
          </div>
          <h2 id="library-distribution-title" className="text-lg font-bold text-pk-text sm:text-xl">
            {lb.distributionTitle}
          </h2>
          <p className="max-w-2xl text-sm text-pk-muted">{lb.distributionSubtitle}</p>

          <ol className="grid gap-2 text-sm sm:grid-cols-3">
            <li
              className={cn(
                "flex items-start gap-2 rounded-xl border px-3 py-2",
                step1Done
                  ? "border-emerald-400/35 bg-emerald-500/10 text-pk-text"
                  : "border-white/10 bg-white/[0.04] text-pk-muted",
              )}
            >
              {step1Done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 opacity-50" aria-hidden />
              )}
              <span>{lb.distributionStep1}</span>
            </li>
            <li className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-pk-muted">
              <Circle className="mt-0.5 h-4 w-4 shrink-0 opacity-50" aria-hidden />
              <span>{lb.distributionStep2}</span>
            </li>
            <li className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-pk-muted">
              <Circle className="mt-0.5 h-4 w-4 shrink-0 opacity-50" aria-hidden />
              <span>{lb.distributionStep3}</span>
            </li>
          </ol>

          {!eligible ? (
            <p className="text-xs text-pk-muted">
              {lb.distributionPlanHint.replace("{value}", String(DISTRIBUTION_ACADEMY_VALUE_USD))}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:min-w-[15rem]">
          {selectedLoop && eligible ? (
            <button
              type="button"
              onClick={() => onDistribute(selectedLoop)}
              className="pk-prism-btn inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              <Package className="h-4 w-4" aria-hidden />
              {lb.distributionCtaSelected}
            </button>
          ) : selectedLoop && !eligible ? (
            <Link
              to="/pricing?plan=studio"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-violet-500"
            >
              {lb.distributionUpgradeCta}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <div className="rounded-xl border border-dashed border-violet-400/35 bg-violet-500/10 px-4 py-3 text-center text-sm text-pk-muted">
              {lb.distributionPickTrack}
            </div>
          )}

          <Link
            to="/distribution"
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-pk-text hover:bg-white/10"
          >
            <History className="h-4 w-4" aria-hidden />
            {lb.distributionHistory}
          </Link>

          <Link
            to="/learn/distribute-ai-music"
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-pk-muted hover:text-pk-text"
          >
            <GraduationCap className="h-4 w-4" aria-hidden />
            {lb.distributionAcademy}
          </Link>
        </div>
      </div>
    </section>
  );
}
