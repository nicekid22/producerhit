import type { AppLocale } from "@/i18n/config";
import { PLAN_MONTHLY_USD } from "@/lib/planPricing";
import { PLAN_LIMITS } from "@/lib/planLimits";

export type MoneyPlay = {
  id: string;
  title: string;
  potential: string;
  steps: string[];
  plan: string;
};

export function musicMoneyPlaybook(locale: AppLocale): MoneyPlay[] {
  const isFr = locale === "fr";
  const perTrack = (PLAN_MONTHLY_USD.pro / PLAN_LIMITS.pro).toFixed(2);

  if (isFr) {
    return [
      {
        id: "beatstars",
        title: "BeatStars & Airbit",
        potential: "$25–$150 / beat",
        steps: [
          "Génère 10–20 type beats cohérents (même vibe, seed proche)",
          "Export WAV Pro + cover auto",
          "Prix $29–$49, bundle ×5 à -20%",
        ],
        plan: "Pro",
      },
      {
        id: "youtube",
        title: "Chaîne YouTube type beat",
        potential: "$500–$3k / mois AdSense",
        steps: [
          "1 vidéo/jour, titre SEO (artist type beat)",
          "WAV + visuel cover = upload rapide",
          "Monétisation dès 1k abonnés + RPM",
        ],
        plan: "Pro",
      },
      {
        id: "clients",
        title: "Prod custom (DM / Fiverr)",
        potential: "$80–$400 / client",
        steps: [
          "Maquette en 30 min avec variations seed",
          "Livraison WAV + licence commerciale PDF",
          "Upsell mastering Studio",
        ],
        plan: "Studio",
      },
      {
        id: "sync",
        title: "Synchro TikTok / Reels / pubs",
        potential: "$200–$5k / deal",
        steps: [
          "Hooks courts, export sans watermark Pro",
          "Droits commerciaux = pitch crédible",
          "Portfolio public ProducerHit",
        ],
        plan: "Pro",
      },
      {
        id: "streaming",
        title: "Release Spotify / DistroKid",
        potential: "Royalties + discovery",
        steps: [
          "Song Mode → single prêt WAV",
          "Cover + metadata, sortie hebdo",
          `Coût prod ≈ $${perTrack}/track en Pro`,
        ],
        plan: "Pro",
      },
      {
        id: "stems",
        title: "Stems & remix packs (Plus)",
        potential: "$49–$199 / pack",
        steps: [
          "Stems ZIP pour artistes & labels",
          "Bundles exclusifs Discord / email",
          "Volume 1000 gen/mois",
        ],
        plan: "Plus",
      },
    ];
  }

  return [
    {
      id: "beatstars",
      title: "BeatStars & Airbit",
      potential: "$25–$150 / beat",
      steps: [
        "Generate 10–20 cohesive type beats (same vibe, close seeds)",
        "Pro WAV export + auto cover",
        "Price $29–$49, bundle ×5 at -20%",
      ],
      plan: "Pro",
    },
    {
      id: "youtube",
      title: "YouTube type beat channel",
      potential: "$500–$3k / mo AdSense",
      steps: [
        "1 video/day, SEO title (artist type beat)",
        "WAV + cover visual = fast upload",
        "Monetize at 1k subs + RPM",
      ],
      plan: "Pro",
    },
    {
      id: "clients",
      title: "Custom production (DM / Fiverr)",
      potential: "$80–$400 / client",
      steps: [
        "Sketch in 30 min with seed variations",
        "Deliver WAV + commercial license PDF",
        "Upsell Studio mastering",
      ],
      plan: "Studio",
    },
    {
      id: "sync",
      title: "TikTok / Reels / ad sync",
      potential: "$200–$5k / deal",
      steps: [
        "Short hooks, Pro export without watermark",
        "Commercial rights = credible pitch",
        "Public ProducerHit portfolio",
      ],
      plan: "Pro",
    },
    {
      id: "streaming",
      title: "Spotify release / DistroKid",
      potential: "Royalties + discovery",
      steps: [
        "Song Mode → release-ready WAV single",
        "Cover + metadata, weekly drops",
        `Production cost ≈ $${perTrack}/track on Pro`,
      ],
      plan: "Pro",
    },
    {
      id: "stems",
      title: "Stems & remix packs (Plus)",
      potential: "$49–$199 / pack",
      steps: [
        "Stems ZIP for artists & labels",
        "Exclusive bundles via Discord / email",
        "1000 gen/month volume",
      ],
      plan: "Plus",
    },
  ];
}

export function musicMoneySectionCopy(locale: AppLocale) {
  const isFr = locale === "fr";
  return {
    eyebrow: isFr ? "Playbook producteur" : "Producer playbook",
    title: isFr ? "6 façons de monétiser — si tu es structuré" : "6 ways to monetize — if you stay structured",
    lead: isFr
      ? "La musique paie quand tu possèdes tes droits, livres vite et enchaînes. ProducerHit est fait pour ça — par des producteurs, pour des producteurs."
      : "Music pays when you own your rights, ship fast, and stay consistent. ProducerHit is built for that — by producers, for producers.",
    stepsLabel: isFr ? "Plan d'action" : "Action plan",
    potentialLabel: isFr ? "Potentiel" : "Potential",
    originLine: isFr
      ? "Conçu dans les studios, pas dans une salle de réunion."
      : "Built in studios, not boardrooms.",
  };
}
