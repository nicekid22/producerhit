import { memo, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";

type Genre = { group: string; value: string; label: string };

type Props = {
  genres: readonly Genre[];
  value: string;
  onChange: (genre: string) => void;
};

type ChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
};

const GenreChip = memo(function GenreChip({ label, active, onPress, styles }: ChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={[
        styles.chip,
        active
          ? { backgroundColor: colors.pillActiveBg, borderColor: colors.pillActiveText }
          : { backgroundColor: colors.bgGlass, borderColor: colors.surfaceBorder },
      ]}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextIdle]}>{label}</Text>
    </Pressable>
  );
});

export const GenreChips = memo(function GenreChips({ genres, value, onChange }: Props) {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  const displayGenres = useMemo(() => {
    if (genres.some((g) => g.value === value)) return genres;
    return [{ group: "Selected", value, label: value }, ...genres];
  }, [genres, value]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
      keyboardShouldPersistTaps="handled"
    >
      {displayGenres.map((g) => (
        <GenreChip
          key={g.value}
          label={g.label}
          active={value === g.value}
          onPress={() => onChange(g.value)}
          styles={styles}
        />
      ))}
    </ScrollView>
  );
});

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  typography: ReturnType<typeof useTheme>["typography"],
) {
  return StyleSheet.create({
    chips: { gap: 8, paddingVertical: 2 },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 100,
      borderWidth: StyleSheet.hairlineWidth,
    },
    chipText: { ...typography.caption, fontWeight: "600" },
    chipTextActive: { color: colors.pillActiveText },
    chipTextIdle: { color: colors.textMuted },
  });
}
