import { memo, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Props = {
  chips: readonly string[];
  value: string;
  onChange: (next: string) => void;
  title?: string;
};

type ChipProps = {
  chip: string;
  active: boolean;
  onToggle: () => void;
  styles: ReturnType<typeof createStyles>;
  textStyle: ReturnType<typeof useTheme>["typography"]["caption"];
  activeColor: string;
  idleColor: string;
};

const InspirationChip = memo(function InspirationChip({
  chip,
  active,
  onToggle,
  styles,
  textStyle,
  activeColor,
  idleColor,
}: ChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onToggle();
      }}
      style={[
        styles.chip,
        active
          ? { backgroundColor: colors.pillActiveBg, borderColor: colors.pillActiveText }
          : { backgroundColor: colors.bgGlass, borderColor: colors.surfaceBorder },
      ]}
    >
      <Text style={[textStyle, { fontWeight: "600", color: active ? activeColor : idleColor }]}>{chip}</Text>
    </Pressable>
  );
});

export const InspirationChipRow = memo(function InspirationChipRow({ chips, value, onChange, title }: Props) {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(), []);
  const visible = useMemo(() => chips.slice(0, 8), [chips]);

  if (!visible.length) return null;

  return (
    <View style={styles.wrap}>
      {title ? (
        <Text style={[typography.micro, { color: colors.textSubtle, letterSpacing: 0.4 }]}>{title}</Text>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {visible.map((chip) => {
          const active = value.includes(chip);
          return (
            <InspirationChip
              key={chip}
              chip={chip}
              active={active}
              onToggle={() => {
                const trimmed = value.trim();
                const on = trimmed.includes(chip);
                const next = on
                  ? trimmed
                      .split(",")
                      .map((s) => s.trim())
                      .filter((s) => s !== chip)
                      .join(", ")
                  : trimmed
                    ? `${trimmed}, ${chip}`
                    : chip;
                onChange(next);
              }}
              styles={styles}
              textStyle={typography.caption}
              activeColor={colors.pillActiveText}
              idleColor={colors.textMuted}
            />
          );
        })}
      </ScrollView>
    </View>
  );
});

function createStyles() {
  return StyleSheet.create({
    wrap: { gap: spacing.sm, marginTop: 4 },
    row: { gap: spacing.sm, paddingVertical: 2 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 100,
      borderWidth: StyleSheet.hairlineWidth,
    },
  });
}
