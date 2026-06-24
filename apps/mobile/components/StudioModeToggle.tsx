import { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { PhCard } from "@/components/PhCard";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";

export type StudioMode = "song" | "beat";

type Props = {
  value: StudioMode;
  onChange: (mode: StudioMode) => void;
  disabled?: boolean;
};

export function StudioModeToggle({ value, onChange, disabled = false }: Props) {
  const { t } = useI18n();
  const { colors, radius, typography, motion } = useTheme();
  const reduced = useReducedMotion();
  const styles = useMemo(() => createStyles(colors, radius, typography), [colors, radius, typography]);
  const [trackWidth, setTrackWidth] = useState(0);
  const slide = useSharedValue(value === "song" ? 0 : 1);

  const options: { id: StudioMode; label: string; hint: string }[] = [
    { id: "song", label: t("song"), hint: t("songHint") },
    { id: "beat", label: t("typeBeat"), hint: t("beatHint") },
  ];

  const segmentWidth = trackWidth > 0 ? (trackWidth - 8) / 2 : 0;

  useEffect(() => {
    if (reduced) {
      slide.value = value === "song" ? 0 : 1;
      return;
    }
    slide.value = withTiming(value === "song" ? 0 : 1, { duration: motion.pressDuration });
  }, [motion.pressDuration, reduced, slide, value]);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slide.value * segmentWidth }],
  }));

  return (
    <PhCard elevated={false} style={styles.card}>
      <View style={styles.wrap} onLayout={onTrackLayout}>
        {segmentWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                width: segmentWidth,
                borderRadius: radius.md,
                backgroundColor: colors.pillActiveBg,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.pillActiveText,
              },
              indicatorStyle,
            ]}
          />
        ) : null}
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <Pressable
              key={opt.id}
              disabled={disabled}
              onPress={() => {
                if (disabled || opt.id === value) return;
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(opt.id);
              }}
              style={styles.segment}
            >
              <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
              <Text style={[styles.hint, active && styles.hintActive]}>{opt.hint}</Text>
            </Pressable>
          );
        })}
      </View>
    </PhCard>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  radius: ReturnType<typeof useTheme>["radius"],
  typography: ReturnType<typeof useTheme>["typography"],
) {
  return StyleSheet.create({
    card: { padding: 0 },
    wrap: {
      flexDirection: "row",
      padding: 4,
      position: "relative",
    },
    indicator: {
      position: "absolute",
      top: 4,
      left: 4,
      bottom: 4,
    },
    segment: {
      flex: 1,
      borderRadius: radius.md,
      paddingVertical: 12,
      paddingHorizontal: 10,
      alignItems: "center",
      zIndex: 1,
    },
    label: {
      ...typography.subtitle,
      color: colors.textMuted,
      fontSize: 15,
    },
    labelActive: {
      color: colors.text,
      fontWeight: "700",
    },
    hint: {
      ...typography.micro,
      color: colors.textSubtle,
      marginTop: 2,
    },
    hintActive: {
      color: colors.textMuted,
    },
  });
}
