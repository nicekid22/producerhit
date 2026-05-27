/** Assets & copy landing — remplace les partenaires par de vrais logos SVG quand disponibles. */

export const LANDING_PARTNER_NAMES = [
  "Spotify",
  "YouTube",
  "TikTok",
  "BeatStars",
  "SoundCloud",
  "Apple Music",
  "Instagram",
  "DistroKid",
] as const;

/** 8 images max — assez pour le carousel, moins de bande passante au first load. */
export const LANDING_GALLERY_IMAGES = [
  "/img/img/589adb309bb96f455bd05430c31ff1b6.jpg",
  "/img/img/7f1e7639e563e7157cf3f4a5f7ba7505.jpg",
  "/img/img/c5746d545d33c80edb247a432dccec07.jpg",
  "/img/img/953d6a018b1f86e86c27b7761c604c6a.jpg",
  "/img/img/666af1ce36bf5abd9eec9cbd5f7c19be.jpg",
  "/img/img/5a6bd346269d206d05575add2b7f3d98.jpg",
  "/img/img/d907425cc582fac61f208cc7d76ed91a.jpg",
  "/img/img/fe3efb70b1b529c4f7843147bfb623c0.jpg",
] as const;

export function landingSectionClass(extra?: string): string {
  return ["pk-landing-section mx-auto max-w-6xl px-4 py-12 sm:py-14 md:py-20 lg:py-24", extra].filter(Boolean).join(" ");
}

type Locale = "en" | "fr";

export function landingCopy(locale: Locale) {
  const isFr = locale === "fr";
  return {
    heroBadge: isFr
      ? "Chansons IA + type beats · Libre de droits · ~20 s"
      : "AI songs + type beats · Royalty-free · ~20s",
    heroLead: isFr
      ? "Décris le vibe — chanson complète avec voix ou type beat niveau studio. Génère, écoute, remixe et exporte en quelques clics."
      : "Describe the vibe — full songs with vocals or studio-grade type beats. Generate, listen, remix, and export in a few clicks.",
    heroTagline: isFr
      ? "Song Mode · Type Beat · Covers IA · Remix communauté"
      : "Song Mode · Type Beat · AI covers · Community remix",
    featuresTitle: isFr ? "Pensé pour aller vite." : "Built to move fast.",
    featuresLead: isFr
      ? "De l’idée au bounce release-ready — sans quitter le navigateur."
      : "From idea to release-ready bounce — without leaving the browser.",
    communityTitle: isFr ? "Écoute la communauté en direct" : "Hear the community live",
    communityLead: isFr
      ? "Tracks publics avec covers métalliques uniques — même signature visuelle, qualité studio."
      : "Public tracks with unique metallic covers — same visual signature, studio-grade output.",
    galleryTitle: isFr ? "L’énergie du studio, partout." : "Studio energy, anywhere.",
    galleryLead: isFr
      ? "Producteurs, artistes et créateurs utilisent ProducerHit pour sortir des idées concrètes, pas des demos floues."
      : "Producers, artists, and creators use ProducerHit to ship concrete ideas — not fuzzy demos.",
    partnersLabel: isFr ? "Les créateurs publient sur" : "Creators publish on",
    testimonialsTitle: isFr ? "Ils créent avec ProducerHit" : "Creators on ProducerHit",
    testimonialsLead: isFr
      ? "Des workflows réels — génération rapide, variations seed, export direct."
      : "Real workflows — fast generation, seed variations, direct export.",
    ctaTitle: isFr ? "Ton prochain hit commence ici." : "Your next hit starts here.",
    ctaLead: isFr
      ? "Gratuit pour commencer. Pas de carte. 10 générations offertes chaque mois."
      : "Free to start. No credit card. 10 free generations every month.",
  };
}
