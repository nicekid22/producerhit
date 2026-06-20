import { useCallback } from "react";
import { Download, Printer, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Navbar } from "@/components/Navbar";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import { hasCommercialUseRights } from "@/lib/planEntitlements";

export default function CommercialLicensePage() {
  const locale = useLocaleStore((s) => s.locale);
  const profile = useAuthStore((s) => s.profile);
  const isFr = locale === "fr";
  const entitled = hasCommercialUseRights(profile?.plan);

  return (
    <MarketingPageShell contentClassName="pk-license-page">
      <Navbar variant="marketing" />

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <header className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--prism-cyan)]">
            {isFr ? "Droits & confiance" : "Rights & trust"}
          </p>
          <h1 className="mt-3 text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight text-white">
            {isFr ? "Licence commerciale par titre" : "Per-track commercial license"}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
            {isFr
              ? "Chaque titre Pro+ a un certificat unique — numéro, titre et ton pseudo artiste. Rien n'est stocké côté serveur : tout se fait dans ton navigateur."
              : "Every Pro+ track has a unique certificate — ID, track title, and your artist username. Nothing is stored server-side: it's all in your browser."}
          </p>
        </header>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-amber-400/35 bg-amber-400/10 text-amber-200">
              <ShieldCheck className="h-6 w-6" aria-hidden />
            </div>
            <div className="text-sm leading-relaxed text-white/65">
              <p className="font-semibold text-white">
                {isFr ? "Comment ça marche" : "How it works"}
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-4">
                {(isFr
                  ? [
                      "Abonne-toi Pro, Studio ou Plus",
                      "Télécharge un beat depuis la bibliothèque — sans popup",
                      "Certificat disponible dans le menu ⋯ → « Certificat de licence »",
                      "Nom légal optionnel dans Réglages pour un PDF contractuel",
                    ]
                  : [
                      "Subscribe to Pro, Studio, or Plus",
                      "Download a beat from your library — no popup",
                      "Certificate available in ⋯ menu → « License certificate »",
                      "Optional legal name in Settings for contract-ready PDFs",
                    ]
                ).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {entitled ? (
            <Link
              to="/library"
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-500"
            >
              <Download className="h-4 w-4" aria-hidden />
              {isFr ? "Aller à la bibliothèque" : "Go to library"}
            </Link>
          ) : (
            <Link
              to="/pricing?plan=pro"
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-500"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              {isFr ? "Débloquer Pro" : "Unlock Pro"}
            </Link>
          )}
          <Link
            to="/settings#pk-settings-profile"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10"
          >
            <Printer className="h-4 w-4" aria-hidden />
            {isFr ? "Nom légal (optionnel)" : "Legal name (optional)"}
          </Link>
        </div>

        <p className="mt-10 text-center text-xs text-white/40">
          {isFr ? "Détails juridiques :" : "Legal details:"}{" "}
          <Link to="/legal#commercial-license" className="text-[var(--prism-cyan)] hover:underline">
            /legal#commercial-license
          </Link>
        </p>
      </main>
    </MarketingPageShell>
  );
}
