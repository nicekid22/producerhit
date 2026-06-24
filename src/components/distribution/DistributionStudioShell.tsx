import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DistributionStudioCopy } from "@/i18n/distributionStudioCatalog";

export type DistributionStudioStep = 1 | 2 | 3;

const STEP_META: { id: DistributionStudioStep; key: keyof DistributionStudioCopy }[] = [
  { id: 1, key: "stepOverview" },
  { id: 2, key: "stepCover" },
  { id: 3, key: "stepExport" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  copy: DistributionStudioCopy;
  step: DistributionStudioStep;
  onStepChange: (step: DistributionStudioStep) => void;
  trackName: string;
  trackMeta?: string;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  nextBusy?: boolean;
  canBack?: boolean;
  sidebarExtra?: ReactNode;
  children: ReactNode;
  scrollClassName?: string;
};

export function DistributionStudioShell({
  open,
  onClose,
  copy,
  step,
  onStepChange,
  trackName,
  trackMeta,
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  nextBusy,
  canBack = true,
  sidebarExtra,
  children,
  scrollClassName,
}: Props) {
  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="pk-distribution-studio-root" role="dialog" aria-modal="true" aria-label={copy.studioTitle}>
      <button type="button" className="pk-distribution-studio-backdrop" onClick={onClose} aria-label={copy.close} />
      <div className="pk-distribution-studio" onClick={(e) => e.stopPropagation()}>
        <header className="pk-distribution-studio__toolbar">
          <div className="pk-distribution-studio__toolbar-start">
            <button type="button" className="pk-distribution-studio__icon-btn" onClick={onClose} aria-label={copy.close}>
              <X className="h-4 w-4" />
            </button>
            <div className="pk-distribution-studio__toolbar-titles">
              <p className="pk-distribution-studio__eyebrow">{copy.studioTitle}</p>
              <h2 className="pk-distribution-studio__track-title">{trackName}</h2>
              {trackMeta ? <p className="pk-distribution-studio__track-meta">{trackMeta}</p> : null}
            </div>
          </div>
          <div className="pk-distribution-studio__step-pills md:hidden" aria-hidden>
            {STEP_META.map((s) => (
              <span
                key={s.id}
                className={cn("pk-distribution-studio__pill", step === s.id && "pk-distribution-studio__pill--active")}
              />
            ))}
          </div>
        </header>

        <div className="pk-distribution-studio__body">
          <aside className="pk-distribution-studio__sidebar" aria-label={copy.studioTitle}>
            <nav className="pk-distribution-studio__nav">
              {STEP_META.map((s) => {
                const done = s.id < step;
                const active = s.id === step;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={cn(
                      "pk-distribution-studio__nav-item",
                      active && "pk-distribution-studio__nav-item--active",
                      done && "pk-distribution-studio__nav-item--done",
                    )}
                    onClick={() => {
                      if (s.id <= step) onStepChange(s.id);
                    }}
                    disabled={s.id > step}
                  >
                    <span className="pk-distribution-studio__nav-index">
                      {done ? <Check className="h-3.5 w-3.5" /> : s.id}
                    </span>
                    <span>{copy[s.key]}</span>
                  </button>
                );
              })}
            </nav>
            {sidebarExtra ? <div className="pk-distribution-studio__sidebar-extra">{sidebarExtra}</div> : null}
          </aside>

          <main className="pk-distribution-studio__main">
            <div className={cn("pk-distribution-studio__scroll", scrollClassName)}>{children}</div>
          </main>
        </div>

        <footer className="pk-distribution-studio__footer">
          <button
            type="button"
            className="pk-distribution-studio__footer-btn pk-distribution-studio__footer-btn--ghost"
            onClick={onBack}
            disabled={!canBack}
          >
            <ChevronLeft className="h-4 w-4" />
            {copy.back}
          </button>
          <button
            type="button"
            className="pk-distribution-studio__footer-btn pk-distribution-studio__footer-btn--primary"
            onClick={onNext}
            disabled={nextDisabled || nextBusy}
          >
            {nextBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {nextLabel}
            {!nextBusy && step < 3 ? <ChevronRight className="h-4 w-4" /> : null}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
