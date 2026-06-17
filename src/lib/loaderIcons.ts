import type { LucideIcon } from "lucide-react";
import {
  AudioWaveform,
  CreditCard,
  Grid3X3,
  Mic,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

export type PkLoaderIcon =
  | "generator"
  | "library"
  | "community"
  | "settings"
  | "voice"
  | "growth"
  | "pricing"
  | "default";

export function loaderCopyFromIcon(icon: PkLoaderIcon, isFr: boolean): { label: string; sublabel: string } {
  const copy: Record<PkLoaderIcon, { fr: [string, string]; en: [string, string] }> = {
    generator: {
      fr: ["Studio…", "On prépare ton espace"],
      en: ["Studio…", "Setting up your studio"],
    },
    library: {
      fr: ["Bibliothèque…", "On charge tes sons"],
      en: ["Library…", "Loading your tracks"],
    },
    community: {
      fr: ["Communauté…", "On ouvre le feed"],
      en: ["Community…", "Opening the feed"],
    },
    settings: {
      fr: ["Réglages…", "Un instant"],
      en: ["Settings…", "Just a moment"],
    },
    voice: {
      fr: ["Voice Studio…", "On branche le micro"],
      en: ["Voice Studio…", "Warming up the mic"],
    },
    growth: {
      fr: ["Growth…", "On charge les stats"],
      en: ["Growth…", "Loading insights"],
    },
    pricing: {
      fr: ["Tarifs…", "Presque prêt"],
      en: ["Pricing…", "Almost there"],
    },
    default: {
      fr: ["Chargement…", "Un instant"],
      en: ["Loading…", "Just a moment"],
    },
  };
  const [label, sublabel] = isFr ? copy[icon].fr : copy[icon].en;
  return { label, sublabel };
}

export function loaderIconFromPath(pathname: string): PkLoaderIcon {
  if (pathname.startsWith("/dashboard")) return "generator";
  if (pathname.startsWith("/library")) return "library";
  if (pathname.startsWith("/sample-lab")) return "library";
  if (pathname.startsWith("/voice-studio")) return "voice";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/admin/growth")) return "growth";
  if (pathname.startsWith("/community") || pathname.startsWith("/explore") || pathname.startsWith("/loop/")) {
    return "community";
  }
  if (pathname.startsWith("/pricing")) return "pricing";
  if (pathname.startsWith("/auth")) return "generator";
  return "generator";
}

/** Icône nav Lucide (alignée sur Sidebar) — pas les symboles élément Cloud. */
export function loaderNavIconFromIcon(icon: PkLoaderIcon): LucideIcon {
  switch (icon) {
    case "library":
      return Grid3X3;
    case "community":
      return Users;
    case "settings":
      return Settings;
    case "voice":
      return Mic;
    case "growth":
      return TrendingUp;
    case "pricing":
      return CreditCard;
    case "generator":
    case "default":
    default:
      return AudioWaveform;
  }
}

/** Couleur d’accent du ring loader (mood Cloud) — indépendant de l’icône affichée. */
export function loaderElementFromIcon(icon: PkLoaderIcon): import("@/components/icons/ElementIcons").ElementKind {
  switch (icon) {
    case "library":
      return "earth";
    case "settings":
      return "water";
    case "community":
      return "air";
    case "voice":
      return "air";
    case "generator":
    case "growth":
    case "pricing":
    case "default":
    default:
      return "fire";
  }
}
