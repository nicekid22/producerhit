import { forwardRef, useImperativeHandle, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCollapsiblePanel } from "@/components/dashboard/useCollapsiblePanel";
import { cn } from "@/lib/utils";

import type { AppLocale } from "@/i18n/config";
export type DashboardGamingPanelHandle = {
  expand: () => void;
};

type Props = {
  locale: AppLocale;
  title: string;
  subtitle?: string;
  storageKey: string;
  defaultOpen?: boolean;
  collapsedPreview?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
};

export const DashboardGamingPanelShell = forwardRef<DashboardGamingPanelHandle, Props>(function DashboardGamingPanelShell(
  {
    locale,
    title,
    subtitle,
    storageKey,
    defaultOpen = true,
    collapsedPreview,
    children,
    className,
    id,
  },
  ref,
) {
  const isFr = locale === "fr";
  const { open, toggle, expand } = useCollapsiblePanel(storageKey, defaultOpen);

  useImperativeHandle(ref, () => ({ expand }), [expand]);

  return (
    <div
      id={id}
      className={cn(
        "pk-gaming-panel-shell relative overflow-hidden rounded-2xl border border-white/10 bg-black/50 p-[1px] shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      <div className="pk-gaming-panel-shell__glow pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/[0.12] via-transparent to-rose-500/[0.08]" />
      <div className="pk-gaming-panel-shell__body relative rounded-[15px] bg-[#0a0a0f]/90">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-3 py-2.5 sm:px-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white">{title}</div>
            {subtitle ? <div className="truncate text-[10px] text-white/40">{subtitle}</div> : null}
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/55 transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-white/80"
          >
            {open ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                {isFr ? "Réduire" : "Collapse"}
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                {isFr ? "Ouvrir" : "Expand"}
              </>
            )}
          </button>
        </div>

        {open ? (
          <div className="px-3 py-3 sm:px-4 sm:py-4">{children}</div>
        ) : (
          <button
            type="button"
            onClick={toggle}
            className="flex w-full items-center px-3 py-2.5 text-left sm:px-4"
          >
            {collapsedPreview ?? (
              <span className="text-[11px] text-white/45">
                {isFr ? "Cliquer pour afficher" : "Click to expand"}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
});
