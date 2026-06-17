import type { AppLocale } from "@/i18n/config";
import { croLandingFaqs } from "@/lib/croTrustCopy";
import { hostedAudioRetentionSummary } from "@/lib/loopAudioRetention";
import { COMMERCIAL_RIGHTS_FAQ } from "@/lib/planPricing";

/** FAQ alignées sur la landing — utilisées pour JSON-LD home / pricing. */
export function getHomeFaqsForJsonLd(locale: AppLocale): { q: string; a: string }[] {
  const isFr = locale === "fr";
  const base = isFr
    ? [
        {
          q: "ProducerHit est-il un générateur de chansons IA royalty-free ?",
          a: "Oui — crée, écoute et exporte pour tes projets perso en Free. Pour monétiser (Spotify, YouTube, clients), passe Pro, Studio ou Plus.",
        },
        {
          q: "Usage commercial & propriété ?",
          a: COMMERCIAL_RIGHTS_FAQ.fr.a,
        },
        {
          q: "Puis-je exporter en WAV ?",
          a: "Oui — l'export WAV est disponible sur les offres Pro, Studio et Plus.",
        },
        {
          q: "Les liens audio expirent-ils ?",
          a: hostedAudioRetentionSummary("fr"),
        },
      ]
    : [
        {
          q: "Is ProducerHit a royalty-free AI song creator?",
          a: "Yes — create, preview, and export tracks for personal projects on Free. Commercial monetization requires Pro, Studio, or Plus.",
        },
        {
          q: "Commercial use & ownership?",
          a: COMMERCIAL_RIGHTS_FAQ.en.a,
        },
        {
          q: "Can I download WAV?",
          a: "Yes — WAV export is available on Pro, Studio, and Plus plans.",
        },
        {
          q: "Do hosted audio links expire?",
          a: hostedAudioRetentionSummary("en"),
        },
      ];
  return [...base, ...croLandingFaqs(locale)];
}
