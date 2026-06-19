import type { AppLocale } from "@/i18n/config";
import { billingIntervalCopy, type BillingInterval } from "@/lib/billingInterval";
import { cn } from "@/lib/utils";

type Props = {
  locale: AppLocale;
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  className?: string;
};

export function BillingIntervalToggle({ locale, value, onChange, className }: Props) {
  const copy = billingIntervalCopy(locale);

  return (
    <div className={cn("flex flex-col items-center gap-2 sm:flex-row sm:justify-center", className)}>
      <div
        className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1"
        role="tablist"
        aria-label={copy.monthly}
      >
        <button
          type="button"
          role="tab"
          aria-selected={value === "month"}
          onClick={() => onChange("month")}
          className={cn(
            "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
            value === "month" ? "bg-white/12 text-white" : "text-white/55 hover:text-white/80",
          )}
        >
          {copy.monthly}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={value === "year"}
          onClick={() => onChange("year")}
          className={cn(
            "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
            value === "year" ? "bg-white/12 text-white" : "text-white/55 hover:text-white/80",
          )}
        >
          {copy.annual}
        </button>
      </div>
      <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
        {copy.saveBadge}
      </span>
    </div>
  );
}
