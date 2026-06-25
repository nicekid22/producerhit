import { memo, useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { GenerationJobStatus } from "@producerhit/shared";
import { AudioReactiveOrb } from "@/components/AudioOrb";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { PhCard } from "@/components/PhCard";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Props = {
  progress: number;
  label?: string;
  done?: boolean;
  finishing?: boolean;
  status?: GenerationJobStatus;
  /** Show vocal timing hint after a song finishes generating. */
  showVocalHint?: boolean;
  /** Pause orb when Create tab is not focused. */
  screenFocused?: boolean;
};

const ORB_SIZE = 200;

type PhaseId = "queue" | "compose" | "mix" | "ready";

export const GenerationProgress = memo(function GenerationProgress({
  progress,
  label,
  done,
  finishing,
  status,
  showVocalHint = false,
  screenFocused = true,
}: Props) {
  const { t } = useI18n();
  const { colors, typography } = useTheme();
  const hapticFired = useRef(false);
  const display = useSharedValue(0);
  const displayPct = Math.max(0, Math.min(100, Math.round(progress)));

  useEffect(() => {
    display.value = withTiming(progress, {
      duration: 160,
      easing: Easing.out(Easing.quad),
    });
  }, [display, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(100, display.value))}%`,
  }));

  const phases = useMemo(
    (): { id: PhaseId; label: string }[] => [
      { id: "queue", label: t("genInQueue") },
      { id: "compose", label: t("genAiCompose") },
      { id: "mix", label: t("composing") },
      { id: "ready", label: t("statusReady") },
    ],
    [t],
  );

  const activePhase: PhaseId = done && !finishing
    ? "ready"
    : status === "pending"
      ? "queue"
      : status === "running" || finishing
        ? progress < 55
          ? "compose"
          : "mix"
        : status === "failed"
          ? "compose"
          : "mix";

  useEffect(() => {
    if (done && !finishing && !hapticFired.current) {
      hapticFired.current = true;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [done, finishing]);

  const displayLabel = done && !finishing ? t("statusReady") : (label ?? t("generating"));

  return (
    <PhCard elevated={false} style={styles.wrap}>
      <View style={styles.orbWrap}>
        <SectionErrorBoundary
          label="generation-orb"
          fallbackTitle={t("sectionErrorOrbTitle")}
          fallbackBody={t("sectionErrorOrbBody")}
          retryLabel={t("retry")}
        >
          <AudioReactiveOrb
            size={ORB_SIZE}
            active={screenFocused}
            energy={done && !finishing ? "idle" : "active"}
            enabled={(!done || finishing) && screenFocused}
            glPriority={screenFocused ? "critical" : "low"}
          >
            <View style={styles.orbCenter} pointerEvents="none">
              {done && !finishing ? (
                <Text style={[typography.title, { color: colors.success, fontWeight: "700", fontSize: 32 }]}>✓</Text>
              ) : (
                <Text style={[typography.title, { color: colors.text, fontWeight: "700", fontSize: 22 }]}>
                  {displayPct}%
                </Text>
              )}
            </View>
          </AudioReactiveOrb>
        </SectionErrorBoundary>
      </View>

      <View style={[styles.track, { backgroundColor: colors.seekTrack }]}>
        <Animated.View style={[styles.fill, { backgroundColor: colors.accentPrimary }, barStyle]} />
      </View>

      <Text style={[typography.subtitle, { color: colors.text, fontWeight: "600", textAlign: "center" }]}>
        {displayLabel}
      </Text>

      <View style={styles.phaseRow}>
        {phases.map((phase, i) => {
          const idx = phases.findIndex((p) => p.id === activePhase);
          const state = done ? "done" : i < idx ? "done" : i === idx ? "active" : "idle";
          return (
            <View key={phase.id} style={styles.phaseItem}>
              <View
                style={[
                  styles.phaseDot,
                  {
                    backgroundColor:
                      state === "done"
                        ? colors.success
                        : state === "active"
                          ? colors.accentPrimary
                          : colors.seekTrack,
                  },
                ]}
              />
              <Text
                style={[
                  typography.micro,
                  {
                    color: state === "idle" ? colors.textSubtle : colors.textMuted,
                    fontWeight: state === "active" ? "600" : "400",
                  },
                ]}
                numberOfLines={1}
              >
                {phase.label}
              </Text>
              {i < phases.length - 1 ? (
                <View style={[styles.phaseLine, { backgroundColor: i < idx ? colors.success : colors.seekTrack }]} />
              ) : null}
            </View>
          );
        })}
      </View>

      {status === "failed" && !done ? (
        <Text style={[typography.caption, { color: colors.danger }]}>{t("genError")}</Text>
      ) : null}

      {showVocalHint && done && !finishing ? (
        <Text style={[typography.caption, { color: colors.textMuted, textAlign: "center", lineHeight: 18 }]}>
          {t("genVocalRegenerateHint")}
        </Text>
      ) : null}
    </PhCard>
  );
});

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    alignSelf: "center",
    width: "100%",
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  orbWrap: {
    width: ORB_SIZE + 40,
    height: ORB_SIZE + 40,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  orbCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  track: {
    width: "100%",
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
  phaseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    width: "100%",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  phaseItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    position: "relative",
  },
  phaseDot: { width: 8, height: 8, borderRadius: 4 },
  phaseLine: {
    position: "absolute",
    top: 3,
    left: "55%",
    width: "90%",
    height: 2,
    borderRadius: 1,
  },
});
