import { cn } from "@/lib/utils";

export function DashboardMobileTabs({
  tab,
  onChange,
  createLabel,
  resultsLabel,
  resultsBadge,
}: {
  tab: "create" | "results";
  onChange: (tab: "create" | "results") => void;
  createLabel: string;
  resultsLabel: string;
  resultsBadge?: number;
}) {
  return (
    <div className="flex gap-1 rounded-full bg-white/[0.06] p-1" role="tablist" aria-label="Dashboard">
      {(
        [
          { id: "create" as const, label: createLabel },
          { id: "results" as const, label: resultsLabel, badge: resultsBadge },
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
              "relative flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
              active ? "pk-prism-pill-active shadow-[0_0_24px_rgba(157,124,255,0.18)]" : "text-white/50 hover:text-white",
            )}
          >
            {item.label}
            {"badge" in item && item.badge != null && item.badge > 0 ? (
              <span className="inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-[rgba(103,195,255,0.25)] px-1.5 py-0.5 text-[10px] font-bold text-[#67c3ff]">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
