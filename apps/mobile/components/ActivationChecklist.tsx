import { memo, useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { PhCard } from "@/components/PhCard";
import {
  ACTIVATION_STEP_IDS,
  ACTIVATION_STEP_KEYS,
  type ActivationStepId,
} from "@/lib/i18n/catalog";
import {
  completeActivationStep,
  loadActivationSteps,
  mergeServerActivationSteps,
  subscribeActivationProgress,
} from "@/lib/onboardingProgress";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

export const ActivationChecklist = memo(function ActivationChecklist() {
  const { t } = useI18n();
  const { colors, typography, radius } = useTheme();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState<Set<ActivationStepId>>(new Set());

  const refresh = useCallback(async () => {
    const local = await loadActivationSteps();
    const merged = await mergeServerActivationSteps(local);
    setDone(merged);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
    return subscribeActivationProgress(() => {
      void refresh();
    });
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const total = ACTIVATION_STEP_IDS.length;
  const count = ACTIVATION_STEP_IDS.filter((id) => done.has(id)).length;
  const ratio = total > 0 ? count / total : 0;

  if (!ready || count >= total) return null;

  const navigateForStep = (stepId: ActivationStepId) => {
    if (stepId === "library_visit") router.push("/(tabs)/library");
    else if (stepId === "community_visit") router.push("/(tabs)/community");
    else if (stepId === "referral_share") router.push("/(tabs)/account");
  };

  return (
    <PhCard elevated={false} style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[typography.subtitle, { color: colors.text, fontSize: 15 }]}>{t("checklistTitle")}</Text>
        <Text style={[typography.caption, { color: colors.accentPrimary, fontWeight: "700" }]}>
          {count}/{total}
        </Text>
      </View>

      <View style={[styles.barTrack, { backgroundColor: colors.seekTrack, borderRadius: radius.pill }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.max(ratio * 100, ratio > 0 ? 4 : 0)}%`,
              borderRadius: radius.pill,
              backgroundColor: colors.accentPrimary,
            },
          ]}
        />
      </View>

      <View style={styles.list}>
        {ACTIVATION_STEP_IDS.map((stepId, i) => {
          const complete = done.has(stepId);
          const labelKey = ACTIVATION_STEP_KEYS[i];
          return (
            <Pressable
              key={stepId}
              style={styles.row}
              disabled={complete}
              onPress={() => navigateForStep(stepId)}
            >
              <Ionicons
                name={complete ? "checkmark-circle" : "ellipse-outline"}
                size={18}
                color={complete ? colors.success : colors.textSubtle}
              />
              <Text
                style={[
                  typography.caption,
                  { color: complete ? colors.textSubtle : colors.textMuted },
                  complete && styles.labelDone,
                ]}
              >
                {t(labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </PhCard>
  );
});

export async function markActivationStep(stepId: ActivationStepId): Promise<void> {
  await completeActivationStep(stepId);
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  list: { gap: 6, marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  labelDone: { textDecorationLine: "line-through" },
  barTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: { height: "100%" },
});
