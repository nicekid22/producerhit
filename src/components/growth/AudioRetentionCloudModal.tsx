import { useEffect, useState } from "react";
import { Check, Cloud, HardDrive, Lock, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { buildAuthNextUrl, runCheckoutWithAuth } from "@/lib/billing";
import { planPriceLabel } from "@/lib/planPricing";
import { trackClientEvent } from "@/lib/supabaseClient";
import { buildAudioRetentionModalCopy } from "@/i18n/audioRetentionModalCatalog";
import type { AppLocale } from "@/i18n/config";
import { useAuthStore } from "@/stores/authStore";
import { useAudioRetentionModalStore } from "@/stores/audioRetentionModalStore";
import { useVisualThemeStore } from "@/stores/visualThemeStore";
import { cn } from "@/lib/utils";
import "@/styles/paywall-modal.css";

type Props = {
  locale: AppLocale;
};

export function AudioRetentionCloudModal({ locale }: Props) {
  const user = useAuthStore((s) => s.user);
  const { open, payload, closeModal } = useAudioRetentionModalStore();
  const visualTheme = useVisualThemeStore((s) => s.theme);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !payload) return;
    trackClientEvent("audio_retention_modal_shown", {
      source: payload.source,
      plan: payload.plan,
      expired_count: payload.expiredCount,
    });
  }, [open, payload]);

  if (!open || !payload || typeof document === "undefined") return null;

  const copy = buildAudioRetentionModalCopy(locale, payload.expiredCount, payload.plan);

  const trackDismiss = () => {
    trackClientEvent("audio_retention_modal_dismissed", {
      source: payload.source,
      plan: payload.plan,
      expired_count: payload.expiredCount,
    });
    closeModal();
  };

  const startPlusCheckout = async () => {
    trackClientEvent("upgrade_click", {
      source: payload.source,
      reason: "audio_retention_modal",
      location: "audio_retention_cloud_modal",
      plan: "plus",
    });

    if (!user) {
      closeModal();
      window.location.href = buildAuthNextUrl("plus");
      return;
    }

    setBusy(true);
    try {
      await runCheckoutWithAuth({
        plan: "plus",
        location: "audio_retention_modal",
        locale,
      });
      closeModal();
    } finally {
      setBusy(false);
    }
  };

  const openLibrary = () => {
    trackClientEvent("audio_retention_modal_library", {
      source: payload.source,
      plan: payload.plan,
    });
    closeModal();
    navigate("/library");
  };

  return createPortal(
    <div
      className="pk-paywall-backdrop pk-growth-modal-backdrop fixed inset-0 z-[205] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pk-audio-retention-title"
      onClick={trackDismiss}
    >
      <div
        className={cn(
          "pk-growth-modal pk-audio-retention-modal pk-veil-modal-panel relative w-full max-w-md overflow-hidden rounded-t-[1.5rem] sm:rounded-[1.5rem]",
          `pk-growth-modal--theme-${visualTheme}`,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pk-paywall__glow" aria-hidden />
        <div className="pk-audio-retention-modal__header-band" aria-hidden />

        <button
          type="button"
          className="pk-paywall__close absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full transition"
          aria-label={copy.close}
          onClick={trackDismiss}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="relative px-6 pb-6 pt-8 sm:px-7 sm:pb-7">
          <div className="flex items-start gap-4">
            <div className="pk-audio-retention-modal__icon-stack relative shrink-0">
              <div className="pk-audio-retention-modal__icon pk-paywall__icon pk-paywall__icon--urgent flex h-14 w-14 items-center justify-center rounded-2xl">
                <Cloud className="h-6 w-6" aria-hidden />
              </div>
              <div className="pk-audio-retention-modal__icon-badge absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full">
                <HardDrive className="h-3.5 w-3.5" aria-hidden />
              </div>
            </div>
            <div className="min-w-0 pt-1">
              <p className="pk-paywall__eyebrow text-[11px] font-semibold uppercase tracking-[0.16em]">
                {copy.eyebrow}
              </p>
              <p className="pk-paywall__price mt-1 text-sm font-bold tabular-nums">
                {planPriceLabel("plus", locale, { suffix: true })}
              </p>
            </div>
          </div>

          <h2
            id="pk-audio-retention-title"
            className="pk-paywall__title pk-audio-retention-modal__title mt-5 text-balance text-xl font-bold leading-snug tracking-tight sm:text-[1.35rem]"
          >
            {copy.title}
          </h2>

          <p className="pk-paywall__desc pk-audio-retention-modal__lead mt-3 text-sm leading-relaxed">
            {copy.lead}
          </p>

          <ul className="mt-5 space-y-2.5">
            {copy.bullets.map((line) => (
              <li key={line} className="pk-paywall__bullet flex items-start gap-2.5 text-sm">
                <span className="pk-paywall__check mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                  <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-2.5">
            <Button
              variant="primary"
              size="md"
              className="pk-audio-retention-modal__cta-primary h-12 w-full rounded-full text-sm font-bold"
              disabled={busy}
              onClick={() => void startPlusCheckout()}
            >
              {busy ? copy.openingCheckout : copy.ctaPlus}
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="h-11 w-full rounded-full text-sm font-semibold"
              disabled={busy}
              onClick={openLibrary}
            >
              {copy.ctaLibrary}
            </Button>
            <button
              type="button"
              className="pk-paywall__secondary w-full py-2 text-center text-xs font-semibold transition"
              disabled={busy}
              onClick={trackDismiss}
            >
              {copy.dismiss}
            </button>
          </div>

          <p className="pk-paywall__footer mt-4 flex items-center justify-center gap-1.5 text-[11px]">
            <Lock className="h-3 w-3 shrink-0" aria-hidden />
            {copy.stripeFooter}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
