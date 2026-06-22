import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  chips: readonly string[];
  value: string;
  onChange: (next: string) => void;
  title?: string;
};

export function InspirationChipRow({ chips, value, onChange, title }: Props) {
  const { colors, typography } = useTheme();
  const visible = useMemo(() => chips.slice(0, 8), [chips]);

  if (!visible.length) return null;

  return (
    <View style={styles.wrap}>
      {title ? (
        <Text
          style={[
            typography.micro,
            { color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 0.8 },
          ]}
        >
          {title}
        </Text>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {visible.map((chip) => {
          const active = value.includes(chip);
          return (
            <Pressable
              key={chip}
              onPress={() => {
                void Haptics.selectionAsync();
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
              style={[
                styles.chip,
                { borderColor: colors.surfaceBorder, backgroundColor: colors.surface },
                active && { borderColor: colors.accent, backgroundColor: colors.pillActiveBg },
              ]}
            >
              <Text
                style={[
                  typography.micro,
                  { color: colors.textMuted, fontWeight: "500" },
                  active && { color: colors.text, fontWeight: "600" },
                ]}
              >
                {chip}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginTop: 4 },
  row: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
});
