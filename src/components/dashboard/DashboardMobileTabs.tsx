import { cn } from "@/lib/utils";
import type { MobileDashboardTab } from "@/hooks/useMobileDashboardTab";

export function DashboardMobileTabs({
  tab,
  onChange,
  createLabel,
  resultsLabel,
  masterLabel,
  resultsBadge,
}: {
  tab: MobileDashboardTab;
  onChange: (tab: MobileDashboardTab) => void;
  createLabel: string;
  resultsLabel: string;
  masterLabel: string;
  resultsBadge?: number;
}) {
  return (
    <div
      className="flex gap-0.5 rounded-2xl bg-black/20 p-1 ring-1 ring-white/[0.06]"
      role="tablist"
      aria-label="Dashboard"
    >
      {(
        [
          { id: "create" as const, label: createLabel },
          { id: "results" as const, label: resultsLabel, badge: resultsBadge },
          { id: "master" as const, label: masterLabel },
        ] as const
      ).map((item) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[11px] font-semibold tracking-wide transition-all sm:px-3 sm:text-xs",
              active
                ? "pk-prism-pill-active shadow-[0_0_20px_rgba(157,124,255,0.22)]"
                : "text-white/45 hover:bg-white/[0.04] hover:text-white/80",
            )}
          >
            {item.label}
            {"badge" in item && item.badge != null && item.badge > 0 ? (
              <span className="inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-[rgba(103,195,255,0.28)] px-1.5 py-0.5 text-[10px] font-bold text-[#8fd4ff]">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
