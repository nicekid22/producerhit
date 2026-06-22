import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";

type Option = { value: string; label: string };

type Props = {
  value: string;
  options: readonly Option[];
  onChange: (value: string) => void;
};

export function PhPill({ value, options, onChange }: Props) {
  const { colors, radius, typography, motion } = useTheme();
  const styles = useMemo(() => createStyles(colors, radius, typography), [colors, radius, typography]);

  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(opt.value);
            }}
            style={({ pressed }) => [
              styles.pill,
              active ? styles.pillActive : styles.pillIdle,
              pressed && { transform: [{ scale: motion.pressScale }] },
            ]}
          >
            <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextIdle]}>
              {opt.label}
            </Text>
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
    row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    pill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.pill,
    },
    pillActive: {
      backgroundColor: colors.pillActiveBg,
    },
    pillIdle: {
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder,
    },
    pillText: { ...typography.micro, fontWeight: "600" },
    pillTextActive: { color: colors.pillActiveText },
    pillTextIdle: { color: colors.textMuted },
  });
}
