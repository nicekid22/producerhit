import { ReactNode, useEffect } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { PhCard } from "@/components/PhCard";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

/** Fixed input height — placeholder rotation must not resize the field. */
const INPUT_HEIGHT = 108;
const INPUT_PADDING_H = 14;
const INPUT_PADDING_TOP = 14;
const INPUT_PADDING_BOTTOM = 8;
/** ~3 lines at typography.body lineHeight 24 inside the padded area. */
const PLACEHOLDER_MAX_LINES = 3;

type Props = {
  label: string;
  hint?: string;
  required?: boolean;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  toolbar?: ReactNode;
  inputProps: TextInputProps;
};

export function PromptConsole({
  label,
  hint,
  required,
  focused,
  onFocus,
  onBlur,
  toolbar,
  inputProps,
}: Props) {
  const { colors, typography } = useTheme();
  const reduced = useReducedMotion();
  const focus = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      focus.value = focused ? 1 : 0;
      return;
    }
    focus.value = withTiming(focused ? 1 : 0, { duration: 180 });
  }, [focus, focused, reduced]);

  const shellStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.value, [0, 1], [colors.surfaceBorder, `${colors.accentPrimary}80`]),
  }));

  const { placeholder, value, style: inputStyle, ...restInputProps } = inputProps;
  const hasValue = typeof value === "string" ? value.length > 0 : Boolean(value);
  const showPlaceholderOverlay = !hasValue && Boolean(placeholder);

  return (
    <View style={styles.block}>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>
        {label}
        {required ? <Text style={{ color: colors.accentPrimary }}> *</Text> : null}
      </Text>
      {hint ? (
        <Text style={[typography.micro, { color: colors.textSubtle, marginTop: -4, marginBottom: spacing.sm, lineHeight: 16 }]}>
          {hint}
        </Text>
      ) : null}
      <PhCard
        elevated={focused}
        style={[
          styles.card,
          focused ? { borderColor: `${colors.accentPrimary}80` } : undefined,
        ]}
      >
        <Animated.View style={[styles.shell, shellStyle]}>
          <View style={styles.inputWrap}>
            {showPlaceholderOverlay ? (
              <Text
                pointerEvents="none"
                numberOfLines={PLACEHOLDER_MAX_LINES}
                style={[
                  typography.body,
                  styles.placeholderOverlay,
                  { color: colors.textSubtle },
                ]}
              >
                {placeholder}
              </Text>
            ) : null}
            <TextInput
              {...restInputProps}
              value={value}
              placeholder=""
              scrollEnabled
              onFocus={(e) => {
                onFocus();
                inputProps.onFocus?.(e);
              }}
              onBlur={(e) => {
                onBlur();
                inputProps.onBlur?.(e);
              }}
              style={[typography.body, styles.input, { color: colors.text }, inputStyle]}
              multiline
              textAlignVertical="top"
            />
          </View>
          {toolbar ? <View style={styles.toolbar}>{toolbar}</View> : null}
        </Animated.View>
      </PhCard>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {},
  card: { padding: 0 },
  shell: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  inputWrap: {
    height: INPUT_HEIGHT,
    position: "relative",
  },
  input: {
    height: INPUT_HEIGHT,
    paddingHorizontal: INPUT_PADDING_H,
    paddingTop: INPUT_PADDING_TOP,
    paddingBottom: INPUT_PADDING_BOTTOM,
  },
  placeholderOverlay: {
    position: "absolute",
    top: INPUT_PADDING_TOP,
    left: INPUT_PADDING_H,
    right: INPUT_PADDING_H,
    zIndex: 1,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
});
