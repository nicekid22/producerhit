import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Option = { value: string; label: string };

type Props = {
  value: string;
  options: readonly Option[];
  onChange: (value: string) => void;
};

type PillProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
};

const PhPillItem = memo(function PhPillItem({ label, active, onPress, styles }: PillProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={[
        styles.pill,
        active
          ? { backgroundColor: colors.pillActiveBg, borderColor: colors.pillActiveText }
          : { backgroundColor: colors.bgGlass, borderColor: colors.surfaceBorder },
      ]}
    >
      <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextIdle]}>{label}</Text>
    </Pressable>
  );
});

export const PhPill = memo(function PhPill({ value, options, onChange }: Props) {
  const { colors, radius, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, radius, typography), [colors, radius, typography]);

  return (
    <View style={styles.row}>
      {options.map((opt) => (
        <PhPillItem
          key={opt.value}
          label={opt.label}
          active={value === opt.value}
          onPress={() => onChange(opt.value)}
          styles={styles}
        />
      ))}
    </View>
  );
});

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  radius: ReturnType<typeof useTheme>["radius"],
  typography: ReturnType<typeof useTheme>["typography"],
) {
  return StyleSheet.create({
    row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    pill: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
    },
    pillText: { ...typography.caption, fontWeight: "600" },
    pillTextActive: { color: colors.pillActiveText },
    pillTextIdle: { color: colors.textMuted },
  });
}
