import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "ghost" | "secondary";
  /** Gradient CTA — use sparingly (Create generate only) */
  gradient?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
};

export function PhButton({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
  gradient = false,
  haptic = true,
  style,
}: Props) {
  const { colors, radius, typography, motion } = useTheme();
  const reducedMotion = useReducedMotion();
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  if (variant === "ghost" || variant === "secondary") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.ghost,
          {
            borderColor: colors.surfaceBorder,
            borderRadius: radius.pill,
            backgroundColor: variant === "secondary" ? colors.surface : "transparent",
          },
          pressed && !reducedMotion && { transform: [{ scale: motion.pressScale }], opacity: 0.9 },
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <Text style={[typography.subtitle, { color: colors.accent, fontWeight: "600" }]}>{label}</Text>
        )}
      </Pressable>
    );
  }

  const inner = loading ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text style={[typography.subtitle, styles.primaryText]}>{label}</Text>
  );

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        pressed && !reducedMotion && { transform: [{ scale: motion.pressScale }] },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {gradient ? (
        <LinearGradient
          colors={[...colors.accentGradient]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.primary, { borderRadius: radius.pill }]}
        >
          {inner}
        </LinearGradient>
      ) : (
        <View style={[styles.primary, { borderRadius: radius.pill, backgroundColor: colors.accentSolid }]}>
          {inner}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  ghost: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  disabled: { opacity: 0.45 },
});
