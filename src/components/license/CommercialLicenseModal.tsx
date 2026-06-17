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

export function CommercialLicenseModal() {
  const locale = useLocaleStore((s) => s.locale);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const { open, ctx, closeLicense } = useCommercialLicenseStore();
  const isFr = locale === "fr";

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
    const firstErr = validateLegalName(firstName, isFr);
    const lastErr = validateLegalName(lastName, isFr);
    if (firstErr || lastErr) {
      toast.error(firstErr ?? lastErr ?? (isFr ? "Nom invalide" : "Invalid name"));
      return;
    }
    setSaving(true);
    try {
      const result = await saveLegalName(firstName, lastName);
      if (result.ok === false) {
        const errCode = result.error;
        toast.error(
          errCode === "legal_name_invalid"
            ? isFr
              ? "Prénom ou nom invalide"
              : "Invalid first or last name"
            : isFr
              ? "Échec de l'enregistrement"
              : "Could not save",
        );
        return;
      }
      const refreshed = await refreshProfile();
      setLocalProfile(refreshed);
      toast.success(isFr ? "Nom enregistré — ta licence est prête" : "Name saved — your license is ready");
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
                {isFr ? "Ta licence commerciale" : "Your commercial license"}
              </h2>
              <p className="mt-0.5 text-xs text-white/50">
                {ctx.exportKind === "stems"
                  ? isFr
                    ? `Licence unique pour les stems de « ${ctx.trackTitle} »`
                    : `Unique license for stems of « ${ctx.trackTitle} »`
                  : isFr
                    ? `Licence unique pour « ${ctx.trackTitle} »`
                    : `Unique license for « ${ctx.trackTitle} »`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeLicense}
            className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label={isFr ? "Fermer" : "Close"}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
          {needsLegalName ? (
            <div className="mx-auto max-w-md">
              <p className="text-sm leading-relaxed text-white/65">
                {isFr
                  ? "Pour générer une licence personnelle et unique par titre, indique ton prénom et nom légaux (comme sur un contrat). Ces infos restent privées."
                  : "To generate a personal, unique license per track, enter your legal first and last name (as on a contract). This stays private."}
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-white/45">{isFr ? "Prénom" : "First name"}</span>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
                    autoComplete="given-name"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-white/45">{isFr ? "Nom" : "Last name"}</span>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
                    autoComplete="family-name"
                  />
                </label>
              </div>
              <Button variant="primary" className="mt-5 w-full" disabled={saving} onClick={() => void handleSaveLegalName()}>
                {saving ? (isFr ? "Enregistrement…" : "Saving…") : isFr ? "Continuer vers la licence" : "Continue to license"}
              </Button>
            </div>
          ) : doc ? (
            <>
              <p className="mb-4 text-center text-xs text-white/45">
                {isFr
                  ? "Téléchargement réussi — enregistre ou imprime ce certificat pour ce titre."
                  : "Download complete — save or print this certificate for this track."}
              </p>
              <CommercialLicenseCertificate doc={doc} printTarget />
            </>
          ) : null}
        </div>

        {!needsLegalName && doc ? (
          <footer className="flex shrink-0 flex-wrap gap-2 border-t border-white/8 px-5 py-4">
            <Button variant="primary" className="flex-1 sm:flex-none" onClick={printCert}>
              <Printer className="h-4 w-4" />
              {isFr ? "Imprimer / PDF" : "Print / Save PDF"}
            </Button>
            <Button variant="secondary" onClick={closeLicense}>
              {isFr ? "Fermer" : "Close"}
            </Button>
            <p className="w-full text-center text-[11px] text-white/35">
              <Download className="mr-1 inline h-3 w-3" aria-hidden />
              {isFr
                ? "Imprimer → « Enregistrer au format PDF » pour envoyer à un client."
                : "Print → « Save as PDF » to send to a client."}
            </p>
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
