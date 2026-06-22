import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";

type Genre = { group: string; value: string; label: string };

type Props = {
  genres: Genre[];
  value: string;
  onChange: (genre: string) => void;
};

export function GenreChips({ genres, value, onChange }: Props) {
  const { colors, typography, motion } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {genres.map((g) => {
        const active = value === g.value;
        return (
          <Pressable
            key={g.value}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(g.value);
            }}
            style={({ pressed }) => [
              styles.chip,
              active ? styles.chipActive : styles.chipIdle,
              pressed && { transform: [{ scale: motion.pressScale }] },
            ]}
          >
            <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextIdle]}>
              {g.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  typography: ReturnType<typeof useTheme>["typography"],
) {
  return StyleSheet.create({
    chips: { gap: 8, paddingVertical: 2 },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
    },
    chipActive: {
      backgroundColor: colors.pillActiveBg,
    },
    chipIdle: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder,
      backgroundColor: colors.surface,
    },
    chipText: { ...typography.caption, fontWeight: "600" },
    chipTextActive: { color: colors.pillActiveText },
    chipTextIdle: { color: colors.textMuted },
  });
}
