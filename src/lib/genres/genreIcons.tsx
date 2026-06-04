import {
  FlaskConical,
  Globe2,
  Guitar,
  Headphones,
  Mic2,
  Music2,
  Radio,
  Shuffle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { RANDOM_GENRE_VALUE } from "@/lib/genres/genrePickMode";

/** Une icône par catégorie — évite la confusion entre genres voisins. */
const GROUP_ICON: Record<string, LucideIcon> = {
  "genres principaux": Music2,
  "popular genres": Music2,
  "trap / hip-hop": Music2,
  "trap / modern": Music2,
  "drill / uk": Music2,
  "soundcloud / underground": Music2,
  "old school / classic": Music2,
  "hip-hop / boom bap": Music2,
  "hip-hop / soul": Mic2,
  "r&b / soul": Mic2,
  "afro / latin / island": Globe2,
  "electronic / pop": Radio,
  "electronic / club": Radio,
  "dnb / breaks": Radio,
  rock: Guitar,
  other: Headphones,
  "lab (futur)": FlaskConical,
  "underground artist 2026": Sparkles,
};

export function genreIconClassName(value: string, active?: boolean) {
  if (value === RANDOM_GENRE_VALUE) {
    return active ? "pk-menu-icon-accent h-4 w-4" : "pk-menu-icon-accent h-4 w-4 opacity-90";
  }
  return active ? "h-4 w-4 text-pk-accent" : "h-4 w-4 text-pk-muted";
}

export function GenreOptionIcon({ value, group, active }: { value: string; group?: string; active?: boolean }) {
  const Icon =
    value === RANDOM_GENRE_VALUE ? Shuffle : (GROUP_ICON[(group ?? "").toLowerCase()] ?? Music2);
  return <Icon className={genreIconClassName(value, active)} aria-hidden />;
}
