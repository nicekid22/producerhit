import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePlayerStore } from "@/stores/playerStore";
import { cn } from "@/lib/utils";

export function LoopDetailsSheet({
  open,
  onClose,
  title,
  subtitle,
  closeLabel = "Close",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  closeLabel?: string;
  children: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasPlayer = usePlayerStore((s) => !!s.current);
  const dockBottom = hasPlayer ? "var(--pk-mobile-dock-player)" : "var(--pk-mobile-dock)";

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo(0, 0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, title]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[125] md:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} aria-label={closeLabel} />
      <div
        className={cn(
          "pk-loop-details-sheet absolute inset-x-0 flex flex-col overflow-hidden rounded-t-[1.25rem] border border-white/10 bg-[#050508]",
          "shadow-[0_-24px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)]",
        )}
        style={{
          bottom: dockBottom,
          maxHeight: `calc(100dvh - ${dockBottom} - 0.75rem)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pk-loop-details-sheet-header relative flex shrink-0 items-center border-b border-white/10 bg-[rgba(5,5,8,0.98)] px-4 pb-3 pt-2 backdrop-blur-md">
          <div className="flex w-full flex-col items-center gap-1.5 pr-11">
            <div className="h-1 w-10 rounded-full bg-white/25" aria-hidden />
            {title ? (
              <div className="w-full min-w-0 text-center">
                <div className="truncate text-sm font-semibold text-pk-text">{title}</div>
                {subtitle ? <div className="mt-0.5 truncate text-xs text-pk-muted">{subtitle}</div> : null}
              </div>
            ) : null}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            aria-label={closeLabel}
            className="absolute right-3 top-2.5 h-10 w-10 shrink-0 rounded-xl p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-5"
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Header for inline desktop detail panel (not the mobile sheet). */
export function LoopDetailsSheetHeader({
  title,
  subtitle,
  onClose,
  closeLabel,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  closeLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-2">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-pk-text">{title}</div>
        {subtitle ? <div className="mt-1 text-xs text-pk-muted">{subtitle}</div> : null}
      </div>
      <Button variant="secondary" size="sm" onClick={onClose} aria-label={closeLabel}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
