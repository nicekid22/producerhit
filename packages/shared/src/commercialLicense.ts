export type PlanId = "free" | "pro" | "studio" | "plus";

function normalizePlanId(plan: string | null | undefined): PlanId {
  if (plan === "pro" || plan === "studio" || plan === "plus") return plan;
  return "free";
}

export type LicenseLocale = "fr" | "en";

export type LicenseProfile = {
  legalFirstName?: string | null;
  legalLastName?: string | null;
  username?: string | null;
};

export type TrackLicenseDocument = {
  licenseId: string;
  holderName: string;
  trackTitle: string;
  planLabel: string;
  planId: PlanId;
  issueDateLabel: string;
  issueDateIso: string;
  exportKind: "beat" | "stems";
  bullets: string[];
  rightsParagraph: string;
  locale: LicenseLocale;
};

export function planDisplayName(plan: PlanId): string {
  if (plan === "plus") return "Plus";
  if (plan === "studio") return "Studio";
  if (plan === "pro") return "Pro";
  return "Free";
}

export function buildTrackLicenseId(loopId: string, plan: PlanId): string {
  const compact = loopId.replace(/-/g, "").toUpperCase();
  const short = compact.slice(0, 8);
  let hash = 0;
  for (let i = 0; i < loopId.length; i += 1) {
    hash = (hash * 31 + loopId.charCodeAt(i)) >>> 0;
  }
  const suffix = (hash % 10000).toString().padStart(4, "0");
  return `PH-${plan.toUpperCase()}-${short}-${suffix}`;
}

function resolveLicenseHolder(
  profile: LicenseProfile | null | undefined,
  opts?: { userId?: string | null; email?: string | null },
): string {
  const first = profile?.legalFirstName?.trim();
  const last = profile?.legalLastName?.trim();
  if (first && first.length >= 2 && last && last.length >= 2) return `${first} ${last}`;

  const username = profile?.username?.trim();
  if (username && username.length >= 2) return username;

  const email = opts?.email?.trim();
  if (email?.includes("@")) {
    const local = email.split("@")[0]?.replace(/[.+_-]+/g, " ").trim();
    if (local && local.length >= 2) return local;
  }

  const userId = opts?.userId?.trim();
  if (userId) {
    const short = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
    return `ProducerHit Member ${short}`;
  }

  return "ProducerHit Member";
}

function resolveIssueDate(createdAt: string | null | undefined, locale: LicenseLocale): { label: string; iso: string } {
  const parsed = createdAt ? new Date(createdAt) : new Date();
  const safe = Number.isFinite(parsed.getTime()) ? parsed : new Date();
  return {
    iso: safe.toISOString().slice(0, 10),
    label: safe.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
}

export type BuildTrackLicenseInput = {
  loopId: string;
  trackTitle: string;
  createdAt?: string | null;
  plan: string | null | undefined;
  profile: LicenseProfile | null;
  locale: LicenseLocale;
  exportKind?: "beat" | "stems";
  userId?: string | null;
  email?: string | null;
};

export function buildTrackLicenseDocument(input: BuildTrackLicenseInput): TrackLicenseDocument | null {
  const planId = normalizePlanId(input.plan);
  if (planId === "free") return null;

  const holderName = resolveLicenseHolder(input.profile, {
    userId: input.userId,
    email: input.email,
  });

  const isFr = input.locale === "fr";
  const { label: issueDateLabel, iso: issueDateIso } = resolveIssueDate(input.createdAt, input.locale);
  const exportKind = input.exportKind ?? "beat";
  const trackTitle = input.trackTitle.trim() || (isFr ? "Sans titre" : "Untitled");

  const rightsParagraph =
    exportKind === "stems"
      ? isFr
        ? `Ce certificat atteste que ${holderName} bénéficie d'une licence royalty-free, personnelle et liée au morceau « ${trackTitle} » (ID ${input.loopId}), pour exploiter commercialement cet export stems pendant la durée de l'abonnement actif ${planDisplayName(planId)}.`
        : `This certificate confirms that ${holderName} holds a royalty-free, personal license tied to the track « ${trackTitle} » (ID ${input.loopId}) to commercially exploit this stems export while the active ${planDisplayName(planId)} subscription remains in effect.`
      : isFr
        ? `Ce certificat atteste que ${holderName} bénéficie d'une licence royalty-free, personnelle et liée au morceau « ${trackTitle} » (ID ${input.loopId}), pour exploiter commercialement cet export audio sur Spotify, YouTube, BeatStars, TikTok, projets clients et synchros, pendant la durée de l'abonnement actif ${planDisplayName(planId)}.`
        : `This certificate confirms that ${holderName} holds a royalty-free, personal license tied to the track « ${trackTitle} » (ID ${input.loopId}) to commercially exploit this audio export on Spotify, YouTube, BeatStars, TikTok, client work, and sync placements while the active ${planDisplayName(planId)} subscription remains in effect.`;

  const bullets = isFr
    ? [
        `Licence unique n° ${buildTrackLicenseId(input.loopId, planId)} — valable pour ce titre uniquement`,
        "Usage commercial autorisé sur l'export du plan payant",
        "Pas de redevance supplémentaire ProducerHit sur cet export",
        "Titulaire responsable des prompts et conformité plateformes",
      ]
    : [
        `Unique license no. ${buildTrackLicenseId(input.loopId, planId)} — valid for this track only`,
        "Commercial use authorized on this paid-plan export",
        "No additional ProducerHit royalty on this export",
        "Holder responsible for prompts and platform compliance",
      ];

  return {
    licenseId: buildTrackLicenseId(input.loopId, planId),
    holderName,
    trackTitle,
    planLabel: planDisplayName(planId),
    planId,
    issueDateLabel,
    issueDateIso,
    exportKind,
    bullets,
    rightsParagraph,
    locale: input.locale,
  };
}

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
