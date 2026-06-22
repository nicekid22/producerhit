import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  ACTIVATION_STEP_IDS,
  ACTIVATION_STEP_KEYS,
  type ActivationStepId,
} from "@/lib/i18n/catalog";
import {
  completeActivationStep,
  loadActivationSteps,
  mergeServerActivationSteps,
} from "@/lib/onboardingProgress";
import { useI18n } from "@/stores/localeStore";
import { colors, radius, spacing, typography } from "@/theme/tokens";

export function ActivationChecklist() {
  const { t } = useI18n();
  const router = useRouter();
  const [done, setDone] = useState<Set<ActivationStepId>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  const refresh = useCallback(async () => {
    const local = await loadActivationSteps();
    const merged = await mergeServerActivationSteps(local);
    setDone(merged);
    if (merged.size >= ACTIVATION_STEP_IDS.length) setCollapsed(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const total = ACTIVATION_STEP_IDS.length;
  const count = ACTIVATION_STEP_IDS.filter((id) => done.has(id)).length;
  if (count >= total) return null;

  const navigateForStep = (stepId: ActivationStepId) => {
    if (stepId === "library_visit") router.push("/(tabs)/library");
    else if (stepId === "community_visit") router.push("/(tabs)/community");
    else if (stepId === "referral_share") router.push("/(tabs)/account");
  };

  return (
    <Pressable style={styles.wrap} onPress={() => setCollapsed((c) => !c)}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("checklistTitle")}</Text>
        <Text style={styles.progress}>
          {count}/{total}
        </Text>
      </View>
      {!collapsed ? (
        <View style={styles.list}>
          {ACTIVATION_STEP_IDS.map((stepId, i) => {
            const complete = done.has(stepId);
            const labelKey = ACTIVATION_STEP_KEYS[i];
            return (
              <Pressable
                key={stepId}
                style={styles.row}
                onPress={() => {
                  if (!complete) navigateForStep(stepId);
                }}
              >
                <Text style={[styles.check, complete && styles.checkDone]}>{complete ? "✓" : "○"}</Text>
                <Text style={[styles.label, complete && styles.labelDone]}>{t(labelKey)}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${(count / total) * 100}%` }]} />
        </View>
      )}
    </Pressable>
  );
}

export async function markActivationStep(stepId: ActivationStepId): Promise<void> {
  await completeActivationStep(stepId);
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { ...typography.subtitle, color: colors.text, fontSize: 15 },
  progress: { ...typography.caption, color: colors.accent },
  list: { gap: 6, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  check: { ...typography.caption, color: colors.textSubtle, width: 18 },
  checkDone: { color: colors.success },
  label: { ...typography.caption, color: colors.textMuted },
  labelDone: { color: colors.textSubtle, textDecorationLine: "line-through" },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceBorder,
    overflow: "hidden",
    marginTop: 4,
  },
  barFill: { height: "100%", backgroundColor: colors.accent },
});
