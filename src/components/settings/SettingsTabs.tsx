import { cn } from "@/lib/utils";

type Tab = {
  id: string;
  label: string;
};

type Props = {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
};

/**
 * Segmented tab control used at the top of the Settings page.
 * Pattern reused from BillingIntervalToggle — utility classes, no custom CSS.
 */
export function SettingsTabs({ tabs, active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Settings sections"
      className="inline-flex flex-wrap gap-0.5 rounded-full border border-white/10 bg-white/[0.04] p-1"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              isActive
                ? "bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                : "text-white/55 hover:text-white/80",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
