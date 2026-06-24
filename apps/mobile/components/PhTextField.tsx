import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Props = TextInputProps & {
  label: string;
  error?: string | null;
};

export function PhTextField({ label, style, error, onFocus, onBlur, ...props }: Props) {
  const { colors, typography, radius } = useTheme();
  const reduced = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const glow = useRef(new Animated.Value(0)).current;
  const hasError = Boolean(error?.trim());

  useEffect(() => {
    if (reduced) return;
    Animated.timing(glow, {
      toValue: focused && !hasError ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [focused, glow, hasError, reduced]);

  const borderColor = hasError
    ? colors.danger
    : glow.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.surfaceBorder, colors.accentPrimary],
      });

  const bgColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.bgElevated, colors.pillActiveBg],
  });

  return (
    <View style={styles.wrap}>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
      <Animated.View
        style={[
          styles.shell,
          {
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: hasError ? colors.danger : borderColor,
            backgroundColor: hasError ? colors.bgElevated : bgColor,
          },
        ]}
      >
        <TextInput
          placeholderTextColor={colors.textSubtle}
          style={[typography.body, styles.input, { color: colors.text }, style]}
          autoCapitalize="none"
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
      </Animated.View>
      {hasError ? (
        <Text style={[typography.micro, { color: colors.danger, marginTop: 4 }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  shell: { overflow: "hidden" },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
