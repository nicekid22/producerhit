import type { TrackLicenseDocument } from "@/lib/commercialLicenseDocument";

export function formatTrackLicenseAsText(doc: TrackLicenseDocument): string {
  const lines = [
    "PRODUCERHIT — COMMERCIAL LICENSE CERTIFICATE",
    "==========================================",
    "",
    `License ID: ${doc.licenseId}`,
    `Track: ${doc.trackTitle}`,
    `Holder: ${doc.holderName}`,
    `Plan: ${doc.planLabel}`,
    `Issue date: ${doc.issueDateLabel} (${doc.issueDateIso})`,
    `Export kind: ${doc.exportKind}`,
    "",
    doc.rightsParagraph,
    "",
    "Rights summary:",
    ...doc.bullets.map((b) => `• ${b}`),
    "",
    "This certificate is included in your ProducerHit distribution pack as proof of commercial rights for this track export.",
    "ProducerHit — https://www.producerhit.com",
  ];
  return lines.join("\n");
}
