import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Printer, Sparkles } from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Navbar } from "@/components/Navbar";
import { CommercialLicenseCertificate } from "@/components/license/CommercialLicenseCertificate";
import { buildExampleTrackLicenseDocument } from "@/lib/commercialLicenseDocument";
import { useLocaleStore } from "@/stores/localeStore";

export default function CommercialLicenseExamplePage() {
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const doc = useMemo(() => buildExampleTrackLicenseDocument(locale), [locale]);

  const printCert = useCallback(() => {
    window.print();
  }, []);

  return (
    <MarketingPageShell contentClassName="pk-license-page">
      <Navbar variant="marketing" />

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-white/45 transition hover:text-white/70"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {isFr ? "Retour landing" : "Back to landing"}
        </Link>

        <header className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            {isFr ? "Exemple uniquement" : "Sample only"}
          </p>
          <h1 className="mt-3 text-balance text-[clamp(1.5rem,3.5vw,2.15rem)] font-bold tracking-tight text-white">
            {isFr ? "Aperçu certificat licence commerciale" : "Commercial license certificate preview"}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/52">
            {isFr
              ? "Les vraies licences sont émises à chaque téléchargement Pro+ — un numéro unique par morceau, avec ton nom légal. Rien n'est stocké côté serveur."
              : "Real licenses are issued on each Pro+ download — one unique ID per track, with your legal name. Nothing is stored server-side."}
          </p>
        </header>

        <div className="mt-10">
          <CommercialLicenseCertificate doc={doc} printTarget />
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3 print:hidden">
          <button
            type="button"
            onClick={printCert}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10"
          >
            <Printer className="h-4 w-4" aria-hidden />
            {isFr ? "Imprimer / PDF" : "Print / PDF"}
          </button>
          <Link
            to="/pricing?plan=pro"
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-500"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {isFr ? "Débloquer les vraies licences" : "Unlock real licenses"}
          </Link>
          <Link
            to="/commercial-license"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-white/75 hover:text-white"
          >
            {isFr ? "Comment ça marche" : "How it works"}
          </Link>
        </div>
      </main>
    </MarketingPageShell>
  );
}
