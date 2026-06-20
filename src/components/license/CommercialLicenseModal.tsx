import { useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Download, Printer, ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { CommercialLicenseCertificate } from "@/components/license/CommercialLicenseCertificate";
import { buildTrackLicenseDocument } from "@/lib/commercialLicenseDocument";
import { useAuthStore } from "@/stores/authStore";
import { useCommercialLicenseStore } from "@/stores/commercialLicenseStore";
import { useLocaleStore } from "@/stores/localeStore";
import { buildCommercialLicenseModalCopy } from "@/i18n/commercialLicenseModalCatalog";

export function CommercialLicenseModal() {
  const locale = useLocaleStore((s) => s.locale);
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const { open, ctx, closeLicense } = useCommercialLicenseStore();
  const copy = useMemo(() => buildCommercialLicenseModalCopy(locale), [locale]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const doc = useMemo(() => {
    if (!ctx) return null;
    return buildTrackLicenseDocument({
      loopId: ctx.loopId,
      trackTitle: ctx.trackTitle,
      createdAt: ctx.createdAt,
      plan: profile?.plan,
      profile,
      locale,
      exportKind: ctx.exportKind,
      userId: user?.id,
      email: user?.email,
    });
  }, [ctx, profile, locale, user?.id, user?.email]);

  const printCert = useCallback(() => {
    window.print();
  }, []);

  if (!open || !ctx || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pk-license-modal-backdrop fixed inset-0 z-[120] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pk-license-modal-title"
      onClick={closeLicense}
    >
      <div
        className="pk-license-modal relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#08080c] shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/8 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/35 bg-amber-400/10 text-amber-200">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 id="pk-license-modal-title" className="text-base font-bold text-white">
                {copy.title}
              </h2>
              <p className="mt-0.5 text-xs text-white/50">
                {copy.subtitle(ctx.trackTitle, ctx.exportKind)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeLicense}
            className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label={copy.close}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
          {doc ? (
            <>
              <p className="mb-4 text-center text-xs text-white/45">{copy.certificateHint}</p>
              <CommercialLicenseCertificate doc={doc} printTarget />
              {doc.holderSource !== "legal" ? (
                <p className="mt-4 text-center text-[11px] leading-relaxed text-white/40">
                  {copy.optionalLegalName}{" "}
                  <Link to="/settings#pk-settings-profile" className="text-violet-300 hover:underline" onClick={closeLicense}>
                    {copy.settingsLink}
                  </Link>
                </p>
              ) : null}
            </>
          ) : (
            <p className="mx-auto max-w-md text-center text-sm text-white/60">{copy.upgradeRequired}</p>
          )}
        </div>

        {doc ? (
          <footer className="flex shrink-0 flex-wrap gap-2 border-t border-white/8 px-5 py-4">
            <Button variant="primary" className="flex-1 sm:flex-none" onClick={printCert}>
              <Printer className="h-4 w-4" />
              {copy.printPdf}
            </Button>
            <Button variant="secondary" onClick={closeLicense}>
              {copy.close}
            </Button>
            <p className="w-full text-center text-[11px] text-white/35">
              <Download className="mr-1 inline h-3 w-3" aria-hidden />
              {copy.printTip}
            </p>
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
