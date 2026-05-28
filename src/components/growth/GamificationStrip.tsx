import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  loadGamification,
  MAX_LEVEL_REWARD_CREDITS,
  recordGeneration,
  recordMasteringPreview,
  recordVisit,
  type GamificationState,
} from "@/lib/gamification";
import { syncDailyGenerationBonus, syncLevelRewards } from "@/lib/gamificationRewards";
import { useLootRevealStore } from "@/stores/lootRevealStore";

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

export function GamificationStrip({ locale, refreshKey = 0, syncRewards = false, onBonusCreditsChange }: Props) {
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

  const onClaimDaily = () => {
    const beforeXp = state.xp;
    const result = claimDailyBonus();
    setState(result.state);
    if (result.alreadyClaimed) {
      toast(isFr ? "Déjà ouvert aujourd'hui — reviens demain" : "Already opened today — see you tomorrow", {
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

  const recentBadges = state.achievements
    .slice(-5)
    .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
    .filter(Boolean);

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500/[0.08] via-white/[0.03] to-cyan-500/[0.06] p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-sm font-bold text-violet-200 ring-1 ring-violet-400/30">
            {progress.level}
          </div>
          <div className="min-w-[120px]">
            <div className="text-xs font-semibold text-white">
              {isFr ? "Niveau" : "Level"} {progress.level}
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-400 transition-all" style={{ width: `${progress.pct}%` }} />
            </div>
            <div className="mt-0.5 text-[10px] text-white/40">
              {progress.current}/{progress.next} XP
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
          <Zap className="h-3.5 w-3.5" />
          {progress.level >= 10
            ? isFr
              ? `Boost+ ${MAX_LEVEL_REWARD_CREDITS} gen`
              : `Boost+ ${MAX_LEVEL_REWARD_CREDITS} gen`
            : isFr
              ? `Niv. ${progress.level + 1} → loot`
              : `Lv. ${progress.level + 1} → loot`}
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-100">
          <Flame className="h-3.5 w-3.5" />
          {state.streak} {isFr ? "j" : "d"}
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60">
          <Trophy className="h-3.5 w-3.5 text-amber-300" />
          {state.achievements.length} {isFr ? "badges" : "badges"}
          {recentBadges.length ? (
            <span className="ml-1 flex gap-1" aria-hidden>
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

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={dailyReady ? "primary" : "secondary"}
            size="sm"
            className={dailyReady ? "pk-loot-cta-pulse" : ""}
            onClick={onClaimDaily}
            disabled={!dailyReady}
          >
            <Gift className="h-4 w-4" />
            {dailyReady ? (isFr ? "Ouvrir le loot" : "Open loot") : isFr ? "Demain" : "Tomorrow"}
          </Button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1 text-[10px] text-white/35">
        <Sparkles className="h-3 w-3" />
        {isFr
          ? `Stop le reel (~1s) · daily +1 · niveaux = loot`
          : `Stop the reel (~1s) · daily +1 · level-ups = loot`}
      </div>
    </div>
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
