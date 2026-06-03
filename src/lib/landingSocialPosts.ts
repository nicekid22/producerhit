import type { SocialPlatform } from "@/lib/socialLinks";
import { LANDING_GALLERY_FEATURED } from "@/lib/landingContent";

export type LandingSocialPost = {
  id: string;
  platform: SocialPlatform;
  image: string;
  captionEn: string;
  captionFr: string;
  tagEn: string;
  tagFr: string;
};

const imgs = LANDING_GALLERY_FEATURED;

export const LANDING_SOCIAL_POSTS: LandingSocialPost[] = [
  {
    id: "ig-1",
    platform: "instagram",
    image: imgs[0]!,
    captionEn: "Type beat in 30s — seed locked, vibe on point 🔒",
    captionFr: "Type beat en 30 s — seed verrouillé, vibe au carré 🔒",
    tagEn: "Studio drop",
    tagFr: "Drop studio",
  },
  {
    id: "tt-1",
    platform: "tiktok",
    image: imgs[1]!,
    captionEn: "POV: you found the AI beat generator that actually slaps",
    captionFr: "POV : tu as trouvé le générateur de beats IA qui claque",
    tagEn: "For you",
    tagFr: "Pour toi",
  },
  {
    id: "ig-2",
    platform: "instagram",
    image: imgs[2]!,
    captionEn: "Song Mode + cover art = release-ready in one tab",
    captionFr: "Song Mode + cover = prêt à sortir dans un seul onglet",
    tagEn: "Producer workflow",
    tagFr: "Workflow producteur",
  },
  {
    id: "tt-2",
    platform: "tiktok",
    image: imgs[3]!,
    captionEn: "Versions ×2 → pick the bounce → Variation. That’s the loop.",
    captionFr: "Versions ×2 → choisis le bounce → Variation. C’est la boucle.",
    tagEn: "Tutorial",
    tagFr: "Tuto",
  },
  {
    id: "ig-3",
    platform: "instagram",
    image: imgs[4]!,
    captionEn: "Lo-fi study bed from one prompt — no stems hunt",
    captionFr: "Fond lo-fi étude depuis un prompt — pas de chasse aux stems",
    tagEn: "Chill",
    tagFr: "Chill",
  },
  {
    id: "tt-3",
    platform: "tiktok",
    image: imgs[5]!,
    captionEn: "Remix a public loop from the community rail 🎧",
    captionFr: "Remix une loop publique du rail communauté 🎧",
    tagEn: "Community",
    tagFr: "Communauté",
  },
  {
    id: "ig-4",
    platform: "instagram",
    image: imgs[6]!,
    captionEn: "Trap dark 140 — two versions, one winner",
    captionFr: "Trap dark 140 — deux versions, une gagnante",
    tagEn: "Type beat",
    tagFr: "Type beat",
  },
  {
    id: "tt-4",
    platform: "tiktok",
    image: imgs[7]!,
    captionEn: "Free tier still exports MP3 — link in bio",
    captionFr: "Le plan free exporte en MP3 — lien en bio",
    tagEn: "Free music AI",
    tagFr: "Musique IA gratuit",
  },
];
