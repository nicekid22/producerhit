import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";

export function Modal({
  open,
  title,
  description,
  confirmText,
  danger,
  onConfirm,
  onClose,
  children,
  hideFooter,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
  hideFooter?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pk-modal-title"
      onClick={onClose}
    >
      <div
        className="my-auto w-full max-w-md rounded-pk border border-pk-border bg-pk-panel p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div id="pk-modal-title" className="text-sm font-semibold">
          {title}
        </div>
        {description ? <div className="mt-2 text-sm text-pk-muted">{description}</div> : null}
        {children ? <div className="mt-4 max-h-[min(70vh,520px)] overflow-y-auto">{children}</div> : null}
        {hideFooter ? null : (
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
