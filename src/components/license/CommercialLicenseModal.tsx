import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Printer, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CommercialLicenseCertificate } from "@/components/license/CommercialLicenseCertificate";
import {
  buildTrackLicenseDocument,
  hasLegalHolderName,
} from "@/lib/commercialLicenseDocument";
import { saveLegalName, validateLegalName } from "@/lib/saveLegalName";
import { useAuthStore } from "@/stores/authStore";
import { useCommercialLicenseStore } from "@/stores/commercialLicenseStore";
import { useLocaleStore } from "@/stores/localeStore";
import toast from "react-hot-toast";
import { buildCommercialLicenseModalCopy } from "@/i18n/commercialLicenseModalCatalog";

export function CommercialLicenseModal() {
  const locale = useLocaleStore((s) => s.locale);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const { open, ctx, closeLicense } = useCommercialLicenseStore();
  const copy = useMemo(() => buildCommercialLicenseModalCopy(locale), [locale]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (!open) return;
    setFirstName(profile?.legal_first_name?.trim() ?? "");
    setLastName(profile?.legal_last_name?.trim() ?? "");
  }, [open, profile?.legal_first_name, profile?.legal_last_name]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const needsLegalName = !hasLegalHolderName(localProfile);

  const doc = useMemo(() => {
    if (!ctx || needsLegalName) return null;
    return buildTrackLicenseDocument({
      loopId: ctx.loopId,
      trackTitle: ctx.trackTitle,
      createdAt: ctx.createdAt,
      plan: localProfile?.plan,
      profile: localProfile,
      locale,
      exportKind: ctx.exportKind,
    });
  }, [ctx, needsLegalName, localProfile, locale]);

  const printCert = useCallback(() => {
    window.print();
  }, []);

  const handleSaveLegalName = async () => {
    const firstErr = validateLegalName(firstName, locale);
    const lastErr = validateLegalName(lastName, locale);
    if (firstErr || lastErr) {
      toast.error(firstErr ?? lastErr ?? copy.invalidName);
      return;
    }
    setSaving(true);
    try {
      const result = await saveLegalName(firstName, lastName);
      if (result.ok === false) {
        const errCode = result.error;
        toast.error(
          errCode === "legal_name_invalid" ? copy.invalidFirstLast : copy.saveFailed,
        );
        return;
      }
      const refreshed = await refreshProfile();
      setLocalProfile(refreshed);
      toast.success(copy.nameSaved);
    } finally {
      setSaving(false);
    }
  };

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
          {needsLegalName ? (
            <div className="mx-auto max-w-md">
              <p className="text-sm leading-relaxed text-white/65">{copy.legalNameIntro}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-white/45">{copy.firstName}</span>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
                    autoComplete="given-name"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-white/45">{copy.lastName}</span>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
                    autoComplete="family-name"
                  />
                </label>
              </div>
              <Button variant="primary" className="mt-5 w-full" disabled={saving} onClick={() => void handleSaveLegalName()}>
                {saving ? copy.saving : copy.continueToLicense}
              </Button>
            </div>
          ) : doc ? (
            <>
              <p className="mb-4 text-center text-xs text-white/45">{copy.downloadHint}</p>
              <CommercialLicenseCertificate doc={doc} printTarget />
            </>
          ) : null}
        </div>

        {!needsLegalName && doc ? (
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
