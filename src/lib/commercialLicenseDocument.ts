import type { AppLocale } from "@/i18n/config";
import type { UserProfileRow } from "@/lib/profileBootstrap";
import { normalizePlanId, planDisplayName, type PlanId } from "@/lib/planEntitlements";

export type LicenseHolderSource = "legal" | "username" | "email" | "member";

export type TrackLicenseInput = {
  loopId: string;
  trackTitle: string;
  createdAt?: string | null;
  plan: string | null | undefined;
  profile: Pick<UserProfileRow, "legal_first_name" | "legal_last_name" | "username"> | null;
  locale: AppLocale;
  exportKind?: "beat" | "stems";
  userId?: string | null;
  email?: string | null;
};

export type TrackLicenseDocument = {
  licenseId: string;
  holderName: string;
  holderSource: LicenseHolderSource;
  trackTitle: string;
  planLabel: string;
  planId: PlanId;
  issueDateLabel: string;
  issueDateIso: string;
  exportKind: "beat" | "stems";
  bullets: string[];
  rightsParagraph: string;
  locale: AppLocale;
  /** Marketing sample — not tied to a user export */
  isExample?: boolean;
};

/** Fixed demo loop — deterministic example ID only (not a real user generation). */
export const EXAMPLE_LICENSE_LOOP_ID = "00000000-0000-4000-8000-e7a7mp001";

/** Deterministic ID — one per loop, computed client-side (no server storage / egress). */
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

export function hasLegalHolderName(
  profile: Pick<UserProfileRow, "legal_first_name" | "legal_last_name"> | null | undefined,
): boolean {
  const first = profile?.legal_first_name?.trim();
  const last = profile?.legal_last_name?.trim();
  return Boolean(first && first.length >= 2 && last && last.length >= 2);
}

export function formatLegalHolderName(
  profile: Pick<UserProfileRow, "legal_first_name" | "legal_last_name"> | null | undefined,
): string | null {
  const first = profile?.legal_first_name?.trim();
  const last = profile?.legal_last_name?.trim();
  if (first && first.length >= 2 && last && last.length >= 2) return `${first} ${last}`;
  return null;
}

/** @deprecated Use resolveLicenseHolder instead */
export function formatLicenseHolderName(
  profile: Pick<UserProfileRow, "legal_first_name" | "legal_last_name" | "username"> | null | undefined,
): string | null {
  return formatLegalHolderName(profile);
}

export function resolveLicenseHolder(
  profile: Pick<UserProfileRow, "legal_first_name" | "legal_last_name" | "username"> | null | undefined,
  opts?: { userId?: string | null; email?: string | null },
): { name: string; source: LicenseHolderSource } {
  const legal = formatLegalHolderName(profile);
  if (legal) return { name: legal, source: "legal" };

  const username = profile?.username?.trim();
  if (username && username.length >= 2) return { name: username, source: "username" };

  const email = opts?.email?.trim();
  if (email?.includes("@")) {
    const local = email.split("@")[0]?.replace(/[.+_-]+/g, " ").trim();
    if (local && local.length >= 2) return { name: local, source: "email" };
  }

  const userId = opts?.userId?.trim();
  if (userId) {
    const short = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
    return { name: `ProducerHit Member ${short}`, source: "member" };
  }

  return { name: "ProducerHit Member", source: "member" };
}

function resolveIssueDate(createdAt: string | null | undefined, locale: AppLocale): { label: string; iso: string } {
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

export function buildTrackLicenseDocument(input: TrackLicenseInput): TrackLicenseDocument | null {
  const planId = normalizePlanId(input.plan);
  if (planId === "free") return null;

  const { name: holderName, source: holderSource } = resolveLicenseHolder(input.profile, {
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
    holderSource,
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

/** Landing / marketing — illustrative certificate, not a real user export. */
export function buildExampleTrackLicenseDocument(locale: AppLocale): TrackLicenseDocument {
  const isFr = locale === "fr";
  const planId: PlanId = "pro";
  const holderName = isFr ? "Alex Martin" : "Alex Martin";
  const trackTitle = isFr ? "Midnight Drive (exemple)" : "Midnight Drive (sample)";
  const issueDateIso = "2026-06-01";
  const issueDateLabel = isFr ? "1 juin 2026" : "June 1, 2026";
  const licenseId = buildTrackLicenseId(EXAMPLE_LICENSE_LOOP_ID, planId);

  const rightsParagraph = isFr
    ? `Exemple de certificat pour « ${trackTitle} ». En production, ${holderName} recevrait une licence royalty-free personnelle liée à son export, avec un ID unique calculé depuis l'identifiant du morceau.`
    : `Sample certificate for « ${trackTitle} ». In production, ${holderName} would receive a personal royalty-free license tied to their export, with a unique ID derived from the track identifier.`;

  const bullets = isFr
    ? [
        `Exemple n° ${licenseId} — non valable juridiquement`,
        "Les vraies licences : 1 numéro unique par génération / titre",
        "Disponibles depuis le menu ⋯ de chaque titre (Pro, Studio, Plus)",
        "Nom d'artiste par défaut — nom légal optionnel dans Réglages",
      ]
    : [
        `Sample no. ${licenseId} — not legally binding`,
        "Real licenses: 1 unique ID per generation / track",
        "Available from each track ⋯ menu (Pro, Studio, Plus)",
        "Artist name by default — optional legal name in Settings",
      ];

  return {
    licenseId,
    holderName,
    holderSource: "legal",
    trackTitle,
    planLabel: planDisplayName(planId),
    planId,
    issueDateLabel,
    issueDateIso,
    exportKind: "beat",
    bullets,
    rightsParagraph,
    locale,
    isExample: true,
  };
}
