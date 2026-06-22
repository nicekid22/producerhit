import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import * as Haptics from "expo-haptics";
import type { PromptMode } from "@producerhit/shared";
import { pickMobileDiceRoll } from "@producerhit/shared";
import type { AppLocale } from "@/lib/i18n/catalog";
import { colors, radius, typography } from "@/theme/tokens";

type Props = {
  locale: AppLocale;
  mode: PromptMode;
  genre: string;
  genres: readonly { value: string; label: string }[];
  accessibilityLabel?: string;
  onPick: (displayPrompt: string) => void;
  onPickAce: (acePrompt: string) => void;
  onPickGenre?: (genre: string) => void;
};

export function PromptDiceButton({
  locale,
  mode,
  genre,
  genres,
  accessibilityLabel,
  onPick,
  onPickAce,
  onPickGenre,
}: Props) {
  const [rolling, setRolling] = useState(false);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = pickMobileDiceRoll(locale, mode, genre, genres);
    onPick(result.displayPrompt);
    onPickAce(result.acePrompt);
    if (result.genre && onPickGenre) onPickGenre(result.genre);
    setTimeout(() => setRolling(false), 500);
  };

  return (
    <Pressable
      onPress={roll}
      style={[styles.btn, rolling && styles.rolling]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.icon}>🎲</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  rolling: { opacity: 0.6, transform: [{ rotate: "12deg" }] },
  icon: { fontSize: 18 },
});
