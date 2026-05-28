import {
  Disc3,
  Drum,
  Flame,
  Globe2,
  Guitar,
  Headphones,
  Mic2,
  Music2,
  Radio,
  Shuffle,
  Sparkles,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { RANDOM_GENRE_VALUE } from "@/lib/genres/genrePickMode";

const GROUP_ICON: Record<string, LucideIcon> = {
  "trap / hip-hop": Music2,
  "r&b / soul": Mic2,
  "afro / latin / island": Globe2,
  "electronic / pop": Radio,
  rock: Guitar,
  other: Headphones,
  "lab (futur)": Sparkles,
};

const VALUE_ICON: Record<string, LucideIcon> = {
  [RANDOM_GENRE_VALUE]: Shuffle,
  Jazz: Waves,
  "Drum and Bass": Drum,
  Rage: Flame,
  Hyperpop: Sparkles,
};

export function genreIconClassName(value: string, active?: boolean) {
  if (value === RANDOM_GENRE_VALUE) return active ? "h-4 w-4 text-violet-300" : "h-4 w-4 text-violet-400";
  return active ? "h-4 w-4 text-pk-accent" : "h-4 w-4 text-pk-muted";
}

export function GenreOptionIcon({ value, group, active }: { value: string; group?: string; active?: boolean }) {
  const Icon = VALUE_ICON[value] ?? GROUP_ICON[(group ?? "").toLowerCase()] ?? Disc3;
  return <Icon className={genreIconClassName(value, active)} aria-hidden />;
}
