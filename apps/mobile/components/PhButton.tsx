import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { PressableScale } from "@/lib/reanimated/usePressScale";

import { irisGradientColors } from "@/theme/gradient";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "ghost" | "secondary";
  /** @deprecated Dusty Cloud uses flat rose primary — ignored */
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
  haptic = true,
  style,
}: Props) {
  const { colors, radius, typography, elevation, theme } = useTheme();

  const isDisabled = disabled || loading;

  if (variant === "ghost" || variant === "secondary") {
    return (
      <PressableScale
        onPress={onPress}
        disabled={isDisabled}
        haptic={haptic}
        style={[
          styles.ghost,
          {
            borderColor: colors.surfaceBorder,
            borderRadius: radius.md,
            backgroundColor: variant === "secondary" ? colors.bgElevated : "transparent",
          },
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.pillActiveText} />
        ) : (
          <Text style={[typography.subtitle, { color: colors.pillActiveText, fontWeight: "600" }]}>{label}</Text>
        )}
      </PressableScale>
    );
  }

  const primaryShell = [
    styles.primary,
    { borderRadius: radius.md },
    theme === "spectrum" ? null : { backgroundColor: colors.accentPrimary },
    elevation.high,
  ];

  const primaryContent = loading ? (
    <ActivityIndicator color={colors.accentOnPrimary} />
  ) : (
    <Text style={[typography.subtitle, styles.primaryText, { color: colors.accentOnPrimary }]}>{label}</Text>
  );

  return (
    <PressableScale onPress={onPress} disabled={isDisabled} haptic={haptic} style={[isDisabled && styles.disabled, style]}>
      {theme === "spectrum" ? (
        <LinearGradient
          colors={irisGradientColors(colors.accentGradient)}
          style={primaryShell}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          {primaryContent}
        </LinearGradient>
      ) : (
        <View style={primaryShell}>{primaryContent}</View>
      )}
    </PressableScale>
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
  primaryText: { fontWeight: "700" },
  ghost: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  disabled: { opacity: 0.45 },
});
