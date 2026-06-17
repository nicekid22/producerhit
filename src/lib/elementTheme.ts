import type { ElementKind } from "@/components/icons/ElementIcons";
import type { CloudAccent } from "@/stores/cloudAccentStore";

/** Accent Cloud ↔ élément (mood de création) */
export const CLOUD_ACCENT_ELEMENT: Record<CloudAccent, ElementKind> = {
  transparent: "air",
  green: "earth",
  red: "fire",
  blue: "water",
};

export const CLOUD_ELEMENT_ACCENTS: CloudAccent[] = ["transparent", "green", "red", "blue"];

/** Loaders / page — indépendant du picker mood sidebar */
export const NAV_ELEMENT_MAP: Record<string, ElementKind> = {
  "/dashboard": "fire",
  "/library": "earth",
  "/community": "air",
  "/settings": "water",
  "/voice-studio": "air",
  "/sample-lab": "fire",
};

export function elementFromPath(pathname: string): ElementKind {
  if (pathname.startsWith("/library")) return "earth";
  if (pathname.startsWith("/settings")) return "water";
  if (pathname.startsWith("/community") || pathname.startsWith("/explore") || pathname.startsWith("/loop/")) {
    return "air";
  }
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/auth") || pathname.startsWith("/voice-studio")) {
    return "fire";
  }
  return "air";
}

export function cloudAccentToElement(accent: string | undefined): ElementKind {
  if (accent === "green") return "earth";
  if (accent === "red") return "fire";
  if (accent === "blue") return "water";
  return "air";
}

export function cloudAccentFromElement(element: ElementKind): CloudAccent {
  switch (element) {
    case "earth":
      return "green";
    case "fire":
      return "red";
    case "water":
      return "blue";
    case "air":
    default:
      return "transparent";
  }
}
