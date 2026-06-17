import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import type { TrackLicenseDocument } from "@/lib/commercialLicenseDocument";
import { cn } from "@/lib/utils";

import "@/styles/commercial-license-certificate.css";

type Props = {
  doc: TrackLicenseDocument;
  className?: string;
  printTarget?: boolean;
};

export function CommercialLicenseCertificate({ doc, className, printTarget = false }: Props) {
  const isFr = doc.locale === "fr";

  return (
    <article
      className={cn("pk-license-cert", printTarget && "pk-license-cert--print-target", className)}
      aria-label={
        doc.isExample
          ? isFr
            ? "Exemple de certificat de licence commerciale"
            : "Sample commercial license certificate"
          : isFr
            ? "Certificat de licence commerciale"
            : "Commercial license certificate"
      }
    >
      <div className="pk-license-cert__frame">
        {doc.isExample ? (
          <span className="pk-license-cert__example-badge">
            {isFr ? "EXEMPLE" : "SAMPLE"}
          </span>
        ) : null}
        <div className="pk-license-cert__ornament pk-license-cert__ornament--tl" aria-hidden />
        <div className="pk-license-cert__ornament pk-license-cert__ornament--br" aria-hidden />
        <div className="pk-license-cert__holo" aria-hidden />

        <header className="pk-license-cert__header">
          <div className="pk-license-cert__seal">
            <ShieldCheck className="h-8 w-8" aria-hidden />
          </div>
          <div>
            <p className="pk-license-cert__brand">ProducerHit</p>
            <p className="pk-license-cert__doc-type">
              {isFr ? "Certificat de licence commerciale" : "Commercial use license certificate"}
            </p>
          </div>
        </header>

        <div className="pk-license-cert__divider" aria-hidden />

        <section className="pk-license-cert__body">
          <p className="pk-license-cert__grant">
            {isFr ? "Délivré à" : "Issued to"}{" "}
            <strong className="pk-license-cert__holder">{doc.holderName}</strong>
          </p>
          <p className="pk-license-cert__plan">
            {isFr ? "Plan actif" : "Active plan"}: <strong>{doc.planLabel.toUpperCase()}</strong>
          </p>
          <p className="pk-license-cert__track">
            {isFr ? "Titre" : "Track"}: <strong>{doc.trackTitle}</strong>
          </p>

          <p className="pk-license-cert__rights">{doc.rightsParagraph}</p>

          <ul className="pk-license-cert__bullets">
            {doc.bullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <footer className="pk-license-cert__footer">
          <div>
            <p className="pk-license-cert__meta-label">{isFr ? "Date d'émission" : "Issue date"}</p>
            <p className="pk-license-cert__meta-value">{doc.issueDateLabel}</p>
          </div>
          <div className="text-right">
            <p className="pk-license-cert__meta-label">ID</p>
            <p className="pk-license-cert__meta-value pk-license-cert__id">{doc.licenseId}</p>
          </div>
        </footer>

        <p className="pk-license-cert__legal">
          {doc.isExample
            ? isFr
              ? "Document d'illustration — ne constitue pas une licence valide. Les vraies licences sont générées à chaque export Pro+."
              : "Illustration only — not a valid license. Real licenses are generated on each Pro+ export."
            : isFr
              ? "Document illustratif de droits — ne remplace pas les CGU complètes. Détails :"
              : "Illustrative rights document — does not replace full Terms. Details:"}{" "}
          {!doc.isExample ? (
            <Link to="/legal#commercial-license" className="text-[var(--prism-cyan)] hover:underline">
              /legal#commercial-license
            </Link>
          ) : null}
        </p>
      </div>
    </article>
  );
}
