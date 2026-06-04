import { hashString } from "@/lib/utils";

/** Dégradé stable pour placeholder cover quand aucune image HTTP. */
export function genreCoverGradient(seed: string) {
  const h = hashString(seed || "beat") % 360;
  const h2 = (h + 48) % 360;
  return `linear-gradient(145deg, hsl(${h} 52% 28%) 0%, hsl(${h2} 58% 18%) 55%, hsl(${(h + 120) % 360} 40% 12%) 100%)`;
}

export function genreCoverInitial(seed: string) {
  const t = seed.trim();
  if (!t) return "♪";
  return t.charAt(0).toUpperCase();
}
