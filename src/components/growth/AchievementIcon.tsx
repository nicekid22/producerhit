import {
  Crown,
  Flame,
  Gem,
  Gift,
  Music2,
  Sparkles,
  Star,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { AchievementId } from "@/lib/gamification";
import { cn } from "@/lib/utils";

const ICONS: Record<AchievementId, LucideIcon> = {
  first_beat: Music2,
  four_beats: Flame,
  first_master: Sparkles,
  streak_3: Zap,
  streak_7: Trophy,
  level_5: Gem,
  level_10: Star,
  level_15: Sparkles,
  level_20: Trophy,
  level_25: Crown,
  daily_claim: Gift,
};

const TONE: Partial<Record<AchievementId, string>> = {
  first_beat: "text-violet-300",
  four_beats: "text-orange-300",
  first_master: "text-amber-300",
  streak_3: "text-cyan-300",
  streak_7: "text-yellow-300",
  level_5: "text-fuchsia-300",
  level_10: "text-slate-300",
  level_15: "text-cyan-200",
  level_20: "text-violet-200",
  level_25: "text-amber-200",
  daily_claim: "text-emerald-300",
};

export function AchievementIcon({ id, className }: { id: AchievementId; className?: string }) {
  const Icon = ICONS[id];
  return <Icon className={cn("h-3.5 w-3.5 shrink-0", TONE[id] ?? "text-white/70", className)} aria-hidden />;
}
