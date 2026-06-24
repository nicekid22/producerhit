import type { AppLocale } from "./config";
import { getMessages } from "./locales";
import { getBeatNameGeneratorSeo, getAlbumCoverGeneratorSeo, getForAiPageSeo } from "@/lib/marketing/phase1PagesSeo";
import { getGenreStatsPageSeo } from "@/lib/marketing/phase2PagesSeo";

export type SeoSlugKey =
  | "home"
  | "blog"
  | "blog-post"
  | "explore"
  | "trending"
  | "loop"
  | "pricing"
  | "auth"
  | "dashboard"
  | "library"
  | "sample-lab"
  | "voice-studio"
  | "settings"
  | "ai-beat-generator"
  | "ai-music-generator"
  | "type-beat-generator-ai"
  | "generate-beats-online-free"
  | "for-ai"
  | "beat-name-generator"
  | "album-cover-generator"
  | "genre-stats"
  | "legal"
  | "distribution-academy"
  | "other";

export function getPageSeo(locale: AppLocale, slugKey: SeoSlugKey): { title: string; description: string } {
  const s = getMessages(locale).seo;

  switch (slugKey) {
    case "home":
      return { title: s.homeTitle, description: s.homeDescription };
    case "blog":
    case "blog-post":
      return { title: s.blogTitle, description: s.blogDescription };
    case "explore":
      return { title: s.exploreTitle, description: s.exploreDescription };
    case "trending":
      return { title: s.trendingTitle, description: s.trendingDescription };
    case "loop":
      return { title: s.loopTitle, description: s.loopDescription };
    case "pricing":
      return { title: s.pricingTitle, description: s.pricingDescription };
    case "auth":
      return { title: s.authTitle, description: s.defaultDescription };
    case "dashboard":
      return { title: s.dashboardTitle, description: s.defaultDescription };
    case "library":
      return { title: s.libraryTitle, description: s.defaultDescription };
    case "sample-lab":
      return { title: s.sampleLabTitle, description: s.defaultDescription };
    case "voice-studio":
      return { title: s.voiceStudioTitle, description: s.defaultDescription };
    case "settings":
      return { title: s.settingsTitle, description: s.defaultDescription };
    case "ai-beat-generator":
      return { title: s.aiBeatGeneratorTitle, description: s.aiBeatGeneratorDescription };
    case "ai-music-generator":
      return { title: s.aiMusicGeneratorTitle, description: s.aiMusicGeneratorDescription };
    case "type-beat-generator-ai":
      return { title: s.typeBeatGeneratorTitle, description: s.typeBeatGeneratorDescription };
    case "generate-beats-online-free":
      return { title: s.generateBeatsFreeTitle, description: s.generateBeatsFreeDescription };
    case "for-ai": {
      const page = getForAiPageSeo(locale);
      return { title: page.title, description: page.description };
    }
    case "beat-name-generator": {
      const page = getBeatNameGeneratorSeo(locale);
      return { title: page.title, description: page.description };
    }
    case "album-cover-generator": {
      const page = getAlbumCoverGeneratorSeo(locale);
      return { title: page.title, description: page.description };
    }
    case "genre-stats": {
      const page = getGenreStatsPageSeo(locale);
      return { title: page.title, description: page.description };
    }
    case "legal":
      return { title: s.legalTitle, description: s.defaultDescription };
    case "distribution-academy":
      return locale === "fr"
        ? {
            title: "Distribuer musique IA — Formation gratuite (module 1) | ProducerHit",
            description:
              "Formation complète pour sortir ta musique IA sur Spotify : droits, cover IA, pack ZIP et upload DistroKid. Module 1 gratuit — Academy incluse Studio & Plus (497 $).",
          }
        : {
            title: "Distribute AI Music — Free Course (Module 1) | ProducerHit",
            description:
              "Complete course to release AI music on Spotify: rights, AI cover art, ZIP pack, DistroKid upload. Free module 1 — Academy included with Studio & Plus ($497 value).",
          };
    default:
      return { title: s.defaultTitle, description: s.defaultDescription };
  }
}
