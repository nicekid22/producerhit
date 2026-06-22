import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";

export type StudioMode = "song" | "beat";

type Props = {
  value: StudioMode;
  onChange: (mode: StudioMode) => void;
};

export function StudioModeToggle({ value, onChange }: Props) {
  const { t } = useI18n();
  const { colors, radius, typography, motion } = useTheme();
  const styles = useMemo(() => createStyles(colors, radius, typography), [colors, radius, typography]);

  const options: { id: StudioMode; label: string; hint: string }[] = [
    { id: "song", label: t("song"), hint: t("songHint") },
    { id: "beat", label: t("typeBeat"), hint: t("beatHint") },
  ];

  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => {
              if (opt.id === value) return;
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(opt.id);
            }}
            style={({ pressed }) => [
              styles.segment,
              active && styles.segmentActive,
              pressed && { transform: [{ scale: motion.pressScale }] },
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
            <Text style={[styles.hint, active && styles.hintActive]}>{opt.hint}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  radius: ReturnType<typeof useTheme>["radius"],
  typography: ReturnType<typeof useTheme>["typography"],
) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      gap: 8,
      padding: 4,
      borderRadius: radius.lg,
      backgroundColor: colors.bgElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder,
    },
    segment: {
      flex: 1,
      borderRadius: radius.md,
      paddingVertical: 12,
      paddingHorizontal: 10,
      alignItems: "center",
    },
    segmentActive: {
      backgroundColor: colors.pillActiveBg,
    },
    label: {
      ...typography.subtitle,
      color: colors.textMuted,
      fontSize: 15,
    },
    labelActive: {
      color: colors.pillActiveText,
      fontWeight: "700",
    },
    hint: {
      ...typography.micro,
      color: colors.textSubtle,
      marginTop: 2,
    },
    hintActive: {
      color: colors.pillActiveText,
      opacity: 0.75,
    },
  });
}
