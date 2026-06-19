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
import type { AppLocale } from "@/i18n/config";
import { loaderCopyFromIcon as loaderCopyFromIconI18n } from "@/i18n/loaderCatalog";
export type PkLoaderIcon =
  | "generator"
  | "library"
  | "community"
  | "settings"
  | "voice"
  | "growth"
  | "pricing"
  | "default";

export function loaderCopyFromIcon(icon: PkLoaderIcon, locale: AppLocale): { label: string; sublabel: string } {
  return loaderCopyFromIconI18n(icon, locale);
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
