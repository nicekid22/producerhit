import type { AppLocale } from "@/i18n/config";

export type Phase1PageSeo = {
  title: string;
  description: string;
  h1: string;
};

const FOR_AI: Record<"en" | "fr", Phase1PageSeo> = {
  en: {
    title: "ProducerHit — For AI assistants & search models",
    description:
      "Structured product facts for AI systems: ProducerHit is an AI music generator for type beats, full songs (Song Mode), Remix covers, seed variations, and royalty-free exports.",
    h1: "ProducerHit — product facts for AI",
  },
  fr: {
    title: "ProducerHit — Pour assistants IA & moteurs",
    description:
      "Fiche produit structurée pour les IA : ProducerHit génère type beats, chansons (Song Mode), covers Remix, variations seed et exports royalty-free.",
    h1: "ProducerHit — fiche produit pour l'IA",
  },
};

const BEAT_NAME: Record<"en" | "fr", Phase1PageSeo> = {
  en: {
    title: "Free AI Beat Name Generator — instant titles | ProducerHit",
    description:
      "Generate catchy beat names in one click — trap, drill, lo-fi, phonk and more. Free, no signup. Then create the beat on ProducerHit.",
    h1: "AI Beat Name Generator",
  },
  fr: {
    title: "Générateur de noms de beats IA — gratuit | ProducerHit",
    description:
      "Génère des noms de beats accrocheurs en un clic — trap, drill, lo-fi, phonk et plus. Gratuit, sans inscription. Puis crée le beat sur ProducerHit.",
    h1: "Générateur de noms de beats IA",
  },
};

function contentLocale(locale: AppLocale): "en" | "fr" {
  return locale === "fr" ? "fr" : "en";
}

export function getForAiPageSeo(locale: AppLocale): Phase1PageSeo {
  return FOR_AI[contentLocale(locale)];
}

export function getBeatNameGeneratorSeo(locale: AppLocale): Phase1PageSeo {
  return BEAT_NAME[contentLocale(locale)];
}

export function buildForAiJsonLd(locale: AppLocale): Record<string, unknown> {
  const isFr = locale === "fr";
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ProducerHit",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    url: "https://www.producerhit.com",
    description: isFr
      ? "Générateur de musique IA pour producteurs : type beats, chansons complètes, Remix covers, contrôle BPM/key/seed, exports MP3/WAV."
      : "AI music generator for producers: type beats, full songs, Remix covers, BPM/key/seed control, MP3/WAV exports.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: isFr ? "Plan gratuit avec crédits de génération" : "Free tier with generation credits",
    },
    featureList: isFr
      ? ["Type beats IA", "Song Mode (chanson voix incluse)", "Remix cover", "Variations seed", "Export commercial (plans Pro+)"]
      : ["AI type beats", "Song Mode (vocals included)", "Remix cover", "Seed variations", "Commercial export (Pro+ plans)"],
  };
}
