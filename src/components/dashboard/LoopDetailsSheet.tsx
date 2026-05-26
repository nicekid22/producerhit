import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LoopDetailsSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/65" onClick={onClose} aria-label="Close" />
      <div className="absolute inset-x-0 bottom-0 max-h-[min(92svh,calc(100svh-var(--pk-mobile-dock)))] overflow-y-auto rounded-t-2xl border border-white/10 bg-[#050508] shadow-[0_-24px_80px_rgba(0,0,0,0.55)]">
        <div className="sticky top-0 z-10 flex justify-center border-b border-white/10 bg-[#050508]/95 py-2 backdrop-blur">
          <div className="h-1 w-10 rounded-full bg-white/20" aria-hidden />
        </div>
        <div className="pb-[calc(var(--pk-mobile-dock)+0.75rem)]">{children}</div>
      </div>
    </div>
  );
}

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
