import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Flame, Gift, Sparkles, Trophy, Zap } from "lucide-react";
import { AchievementIcon } from "@/components/growth/AchievementIcon";
import { Button } from "@/components/ui/Button";
import {
  ACHIEVEMENTS,
  canClaimDailyBonus,
  claimDailyBonus,
  getLevel,
  getLevelProgress,
  getLevelRewardCredits,
  getTotalLevelRewardCreditsUpTo,
  loadGamification,
  MAX_LEVEL,
  recordGeneration,
  recordMasteringPreview,
  recordVisit,
  type GamificationState,
} from "@/lib/gamification";
import { getNextLevelRewardCredits, syncDailyGenerationBonus, syncLevelRewards } from "@/lib/gamificationRewards";
import { useLootRevealStore } from "@/stores/lootRevealStore";
import { cn } from "@/lib/utils";

type BonusCreditsPayload = {
  levelBonus: number;
  dailyBonusMonth: number;
};

type Props = {
  locale: "en" | "fr";
  refreshKey?: number;
  syncRewards?: boolean;
  onBonusCreditsChange?: (credits: BonusCreditsPayload) => void;
};

async function syncLevelAndMaybeLoot(
  beforeXp: number,
  afterXp: number,
  locale: "en" | "fr",
  syncRewards: boolean,
  onBonusCreditsChange?: (credits: BonusCreditsPayload) => void,
) {
  const before = getLevel(beforeXp);
  const after = getLevel(afterXp);
  if (!syncRewards) return;
  const result = await syncLevelRewards(locale, { silent: true });
  if (result?.ok && onBonusCreditsChange) {
    onBonusCreditsChange({ levelBonus: result.levelBonus, dailyBonusMonth: result.dailyBonusMonth });
  }
  if (result?.ok && result.creditsGranted > 0 && after > before) {
    useLootRevealStore.getState().showLoot({
      kind: "level",
      credits: result.creditsGranted,
      level: after,
    });
  }
}

function buildXpLabel(progress: ReturnType<typeof getLevelProgress>, isFr: boolean): string {
  if (progress.isMax) {
    return isFr
      ? `${progress.xpTotal.toLocaleString()} XP · niveau ${MAX_LEVEL}`
      : `${progress.xpTotal.toLocaleString()} XP · level ${MAX_LEVEL}`;
  }
  return `${progress.current} / ${progress.next} XP`;
}

function buildLevelHint(progress: ReturnType<typeof getLevelProgress>, isFr: boolean): string {
  const rank = isFr ? progress.rank.labelFr : progress.rank.labelEn;
  if (progress.isMax) {
    return isFr
      ? `${rank} — tous les bonus débloqués (+${getTotalLevelRewardCreditsUpTo(MAX_LEVEL)} gen au total)`
      : `${rank} — all level bonuses unlocked (+${getTotalLevelRewardCreditsUpTo(MAX_LEVEL)} gen total)`;
  }
  const nextCredits = getNextLevelRewardCredits(progress.level);
  return isFr
    ? `${rank} · encore ${progress.xpToNextLevel} XP → niv. ${progress.level + 1} (+${nextCredits} gen)`
    : `${rank} · ${progress.xpToNextLevel} XP to lv. ${progress.level + 1} (+${nextCredits} gen)`;
}

function buildStreakPill(streak: number, isFr: boolean): { label: string; detail: string } {
  if (streak <= 0) {
    return isFr ? { label: "0 jour", detail: "Série" } : { label: "0 days", detail: "Streak" };
  }
  return isFr
    ? { label: `${streak} jour${streak > 1 ? "s" : ""}`, detail: "Série" }
    : { label: `${streak} day${streak > 1 ? "s" : ""}`, detail: "Streak" };
}

function buildRewardPill(progress: ReturnType<typeof getLevelProgress>, isFr: boolean): { label: string; detail: string } {
  if (progress.isMax) {
    const earned = getTotalLevelRewardCreditsUpTo(progress.level);
    return isFr
      ? { label: `+${earned} gen`, detail: "Bonus max" }
      : { label: `+${earned} gen`, detail: "Max bonus" };
  }
  const nextCredits = getLevelRewardCredits(progress.level + 1);
  const milestone = (progress.level + 1) % 5 === 0;
  return isFr
    ? {
        label: `+${nextCredits} gen`,
        detail: milestone ? `Palier niv. ${progress.level + 1}` : `Au niveau ${progress.level + 1}`,
      }
    : {
        label: `+${nextCredits} gen`,
        detail: milestone ? `Milestone lv. ${progress.level + 1}` : `At level ${progress.level + 1}`,
      };
}

function buildMotivationHint(progress: ReturnType<typeof getLevelProgress>, dailyReady: boolean, isFr: boolean): string {
  if (dailyReady) {
    return isFr
      ? "Ton bonus du jour est prêt — +1 génération gratuite à récupérer"
      : "Your daily bonus is ready — claim +1 free generation";
  }
  if (!progress.isMax && progress.pct >= 70) {
    const nextCredits = getNextLevelRewardCredits(progress.level);
    return isFr
      ? `Tu es proche du niveau ${progress.level + 1} — encore ${progress.xpToNextLevel} XP pour +${nextCredits} gen`
      : `Almost level ${progress.level + 1} — ${progress.xpToNextLevel} XP left for +${nextCredits} gen`;
  }
  if (progress.isMax) {
    return isFr
      ? "Niveau légendaire atteint — garde ta série et ton bonus quotidien actifs"
      : "Legendary level reached — keep your streak and daily bonus going";
  }
  if (progress.level >= 10) {
    return isFr
      ? "Ascension en cours — paliers 15 / 20 / 25 = loot bonus · 1 gen/jour toujours actif"
      : "Ascension mode — milestones 15 / 20 / 25 = bonus loot · daily +1 gen still active";
  }
  return isFr
    ? "Chaque track te fait monter · 1 bonus gratuit par jour · chaque niveau = générations en plus"
    : "Every track levels you up · 1 free daily bonus · each level = extra generations";
}

export function GamificationStrip({
  locale,
  refreshKey = 0,
  syncRewards = false,
  onBonusCreditsChange,
}: Props) {
  const isFr = locale === "fr";
  const [state, setState] = useState<GamificationState>(() => loadGamification());
  const showLoot = useLootRevealStore((s) => s.showLoot);

  const reload = useCallback(() => setState(loadGamification()), []);

  useEffect(() => {
    if (!syncRewards) return;
    void syncLevelRewards(locale, { silent: true }).then((result) => {
      if (result?.ok && onBonusCreditsChange) {
        onBonusCreditsChange({ levelBonus: result.levelBonus, dailyBonusMonth: result.dailyBonusMonth });
      }
    });
  }, [locale, onBonusCreditsChange, syncRewards]);

  useEffect(() => {
    const before = loadGamification();
    const visit = recordVisit();
    setState(visit.state);
    void syncLevelAndMaybeLoot(before.xp, visit.state.xp, locale, syncRewards, onBonusCreditsChange);
  }, [locale, onBonusCreditsChange, syncRewards]);

  useEffect(() => {
    reload();
    if (!syncRewards) return;
    void syncLevelRewards(locale, { silent: true }).then((result) => {
      if (result?.ok && onBonusCreditsChange) {
        onBonusCreditsChange({ levelBonus: result.levelBonus, dailyBonusMonth: result.dailyBonusMonth });
      }
    });
  }, [locale, onBonusCreditsChange, refreshKey, reload, syncRewards]);

  const progress = getLevelProgress(state.xp);
  const dailyReady = canClaimDailyBonus(state);
  const xpLabel = buildXpLabel(progress, isFr);
  const levelHint = buildLevelHint(progress, isFr);
  const rewardPill = buildRewardPill(progress, isFr);
  const streakPill = buildStreakPill(state.streak, isFr);
  const motivationHint = buildMotivationHint(progress, dailyReady, isFr);

  const recentBadges = useMemo(
    () =>
      state.achievements
        .slice(-4)
        .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
        .filter(Boolean),
    [state.achievements],
  );

  const onClaimDaily = () => {
    const beforeXp = state.xp;
    const result = claimDailyBonus();
    setState(result.state);
    if (result.alreadyClaimed) {
      toast(isFr ? "Bonus déjà récupéré — reviens demain" : "Bonus already claimed — see you tomorrow", {
        duration: 2500,
      });
      return;
    }

    void (async () => {
      let credits = 1;
      if (syncRewards) {
        const daily = await syncDailyGenerationBonus(locale, { silent: true });
        const levelResult = await syncLevelRewards(locale, { silent: true });
        if (daily?.creditsGranted) credits = daily.creditsGranted;
        if (onBonusCreditsChange && (daily?.ok || levelResult?.ok)) {
          onBonusCreditsChange({
            levelBonus: levelResult?.levelBonus ?? 0,
            dailyBonusMonth: daily?.dailyBonusMonth ?? 0,
          });
        }

        const beforeLevel = getLevel(beforeXp);
        const afterLevel = getLevel(result.state.xp);
        showLoot({
          kind: "daily",
          credits,
          xp: result.xpGained,
        });
        if (levelResult?.ok && levelResult.creditsGranted > 0 && afterLevel > beforeLevel) {
          showLoot({
            kind: "level",
            credits: levelResult.creditsGranted,
            level: afterLevel,
          });
        }
        return;
      }

      showLoot({
        kind: "daily",
        credits,
        xp: result.xpGained,
      });
    })();
  };

  return (
    <>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/25 to-cyan-500/15 text-base font-bold text-white ring-1 ring-white/15">
              <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-400/20 to-cyan-400/10 blur-md" aria-hidden />
              <span className="relative">{progress.level}</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <div className="text-sm font-semibold text-white">
                  {isFr ? "Niveau" : "Level"} {progress.level}
                  <span className="ml-2 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/55">
                    {isFr ? progress.rank.labelFr : progress.rank.labelEn}
                  </span>
                  {progress.isMax ? (
                    <span className="ml-1.5 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200/90">
                      {isFr ? "Max" : "Max"}
                    </span>
                  ) : null}
                </div>
                <div className="text-[11px] font-medium text-white/45">{xpLabel}</div>
              </div>

              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/[0.04]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    progress.isMax
                      ? "bg-gradient-to-r from-violet-300 via-cyan-300 to-violet-300"
                      : "bg-gradient-to-r from-violet-400 to-cyan-400",
                  )}
                  style={{ width: `${progress.pct}%` }}
                />
              </div>

              <p className="mt-1.5 text-[11px] leading-snug text-white/42">{levelHint}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <div className="flex items-center gap-2 rounded-xl border border-cyan-400/15 bg-cyan-500/[0.07] px-3 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-200">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-cyan-200/55">{rewardPill.detail}</div>
                <div className="text-xs font-semibold text-cyan-50">{rewardPill.label}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-orange-400/15 bg-orange-500/[0.07] px-3 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/15 text-orange-200">
                <Flame className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-orange-200/55">{streakPill.detail}</div>
                <div className="text-xs font-semibold text-orange-50">{streakPill.label}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-200">
                <Trophy className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-white/40">{isFr ? "Trophées" : "Trophies"}</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white/85">
                    {state.achievements.length}
                  </span>
                  {recentBadges.length ? (
                    <span className="flex gap-1" aria-hidden>
                      {recentBadges.map((b) => (
                        <span
                          key={b!.id}
                          title={isFr ? b!.titleFr : b!.titleEn}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.06] ring-1 ring-white/10"
                        >
                          <AchievementIcon id={b!.id} />
                        </span>
                      ))}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <Button
              variant={dailyReady ? "primary" : "secondary"}
              size="sm"
              className={cn("shrink-0", dailyReady ? "pk-loot-cta-pulse" : "")}
              onClick={onClaimDaily}
              disabled={!dailyReady}
            >
              <Gift className="h-4 w-4" />
              {dailyReady
                ? isFr
                  ? "Bonus du jour"
                  : "Daily bonus"
                : isFr
                  ? "Demain"
                  : "Tomorrow"}
            </Button>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 border-t border-white/[0.06] pt-3">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300/70" />
          <p className="text-[11px] leading-relaxed text-white/45">{motivationHint}</p>
        </div>
    </>
  );
}

type NotifyOptions = {
  syncRewards?: boolean;
  onBonusCreditsChange?: (credits: BonusCreditsPayload) => void;
};

export function notifyGamificationGeneration(locale: "en" | "fr", options: NotifyOptions = {}) {
  const before = loadGamification();
  const result = recordGeneration();
  void syncLevelAndMaybeLoot(before.xp, result.state.xp, locale, Boolean(options.syncRewards), options.onBonusCreditsChange);
  return result;
}

export function notifyGamificationMasteringPreview(locale: "en" | "fr", options: NotifyOptions = {}) {
  const before = loadGamification();
  const result = recordMasteringPreview();
  void syncLevelAndMaybeLoot(before.xp, result.state.xp, locale, Boolean(options.syncRewards), options.onBonusCreditsChange);
  return result;
}
