import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
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
    <div
      className={cn(
        "pk-loop-details-sheet-root fixed inset-0 z-[125] flex items-end justify-center md:hidden",
        hasPlayer ? "pk-loop-details-sheet-root--with-player" : "pk-loop-details-sheet-root--dock",
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="pk-loop-details-sheet-backdrop absolute inset-0"
        onClick={onClose}
        aria-label={closeLabel}
      />
      <div
        className={cn(
          "pk-loop-details-sheet relative flex w-full flex-col overflow-hidden rounded-pk border border-pk-border bg-pk-panel",
          hasPlayer && "pk-loop-details-sheet--with-player",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative z-[1] flex shrink-0 items-center justify-end px-3 pb-1 pt-2.5">
          <div className="pk-loop-details-sheet-grabber pointer-events-none absolute left-1/2 top-2.5 h-[5px] w-9 -translate-x-1/2 rounded-full" aria-hidden />
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="flex h-7 w-7 items-center justify-center rounded-pk text-pk-muted transition-colors hover:bg-white/5 hover:text-pk-text"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div
          ref={scrollRef}
          className="pk-loop-details-sheet-scroll relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 [-webkit-overflow-scrolling:touch]"
        >
          {children}
        </div>
        {(title || subtitle) && (
          <span className="sr-only">
            {title}
            {subtitle ? ` — ${subtitle}` : ""}
          </span>
        )}
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
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pk text-pk-muted transition-colors hover:bg-white/5 hover:text-pk-text"
      >
        <X className="h-[1.125rem] w-[1.125rem]" strokeWidth={2.25} />
      </button>
    </div>
  );
}
