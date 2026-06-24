/** Cover carré pour upload manuel (DistroKid / TuneCore acceptent souvent 1400–3000). */
export const DISTRIBUTION_COVER_SIZE = 1400;

export type DistributionPackMetadata = {
  title: string;
  artist: string;
  featuring: string[];
  genre: string;
  language: string;
  explicit: boolean;
  releaseDate: string | null;
  bpm: number | null;
  durationSec: number | null;
  keyScale: string | null;
  lyrics: string | null;
  loopId: string;
  producerHitUrl: string;
  exportedAt: string;
  coverSize: number;
  notes: string;
};

export function buildDistributionReadme(locale: "fr" | "en" = "fr"): string {
  if (locale === "fr") {
    return `PACK DISTRIBUTION PRODUCERHIT
================================

Contenu du ZIP :
- audio/          Fichier audio du morceau
- cover.jpg       Pochette ${DISTRIBUTION_COVER_SIZE}x${DISTRIBUTION_COVER_SIZE} px (JPEG)
- metadata.json   Métadonnées pour copier-coller
- license.txt     Certificat de licence commerciale ProducerHit
- README.txt      Ce fichier

Étapes :
1. Ouvre ton distributeur (DistroKid, TuneCore, CD Baby, iMusician, etc.)
2. Crée une nouvelle release « Single »
3. Importe l'audio et cover.jpg
4. Renseigne titre, artiste, genre, date — voir metadata.json
5. Joins license.txt si le distributeur le permet (preuve de droits)
6. Soumets — délai review habituel : 3 à 14 jours selon la plateforme

Plateformes cibles : Spotify, Apple Music, Deezer, YouTube Music, TikTok Music

Important :
- Tu es responsable du respect des règles de chaque plateforme de streaming (contenu IA, samples, etc.)
- Certaines plateformes exigent une cover plus grande (jusqu'à 3000x3000) : upscale si besoin
- Ce pack ne publie pas automatiquement : upload manuel uniquement
`;
  }
  return `PRODUCERHIT DISTRIBUTION PACK
==============================

ZIP contents:
- audio/          Track audio file
- cover.jpg       ${DISTRIBUTION_COVER_SIZE}x${DISTRIBUTION_COVER_SIZE} px artwork (JPEG)
- metadata.json   Metadata for copy/paste
- license.txt     ProducerHit commercial license certificate
- README.txt      This file

Steps:
1. Open your distributor (DistroKid, TuneCore, CD Baby, iMusician, etc.)
2. Create a new « Single » release
3. Upload audio and cover.jpg
4. Fill title, artist, genre, date — see metadata.json
5. Attach license.txt if your distributor allows rights proof
6. Submit — review usually takes 3–14 days depending on platform

Target platforms: Spotify, Apple Music, Deezer, YouTube Music, TikTok Music

Important:
- You are responsible for each streaming platform's rules (AI content, samples, etc.)
- Some platforms require larger artwork (up to 3000x3000): upscale if needed
- This pack does not auto-publish — manual upload only
`;
}

export function suggestDistributionGenre(producerHitGenre: string): string {
  const trimmed = producerHitGenre.trim();
  return trimmed || "Electronic";
}
