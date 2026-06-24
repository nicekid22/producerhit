import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { findGenreOption, PRIMARY_GENRE_VALUES } from "@producerhit/shared";
import { StudioModeToggle, type StudioMode } from "@/components/StudioModeToggle";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

const PICKER_GENRES = PRIMARY_GENRE_VALUES.slice(0, 12);

type Props = {
  mode: StudioMode;
  genre: string;
  onModeChange: (mode: StudioMode) => void;
  onGenreChange: (genre: string) => void;
};

export const OnboardingPersonalizePanel = memo(function OnboardingPersonalizePanel({
  mode,
  genre,
  onModeChange,
  onGenreChange,
}: Props) {
  const { colors, typography, radius } = useTheme();
  return (
    <View style={styles.root}>
      <StudioModeToggle value={mode} onChange={onModeChange} />

      <View style={styles.grid}>
        {PICKER_GENRES.map((value) => {
          const opt = findGenreOption(value);
          const label = opt?.label ?? value;
          const active = genre === value;
          return (
            <Pressable
              key={value}
              onPress={() => {
                void Haptics.selectionAsync();
                onGenreChange(value);
              }}
              style={({ pressed }) => [
                styles.chip,
                {
                  borderRadius: radius.pill,
                  borderColor: active ? colors.pillActiveText : colors.surfaceBorder,
                  backgroundColor: pressed
                    ? colors.bgGlass
                    : active
                      ? colors.pillActiveBg
                      : colors.bgElevated,
                },
              ]}
            >
              <Text
                style={[
                  typography.micro,
                  {
                    color: active ? colors.pillActiveText : colors.textMuted,
                    fontWeight: active ? "700" : "500",
                    textAlign: "center",
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: "30%",
    maxWidth: "48%",
    flexGrow: 1,
  },
});
