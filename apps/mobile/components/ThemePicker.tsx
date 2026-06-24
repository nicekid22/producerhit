import { memo, useCallback, useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { THEME_LABELS, type VisualTheme } from "@/theme/types";
import { useVisualThemeStore } from "@/stores/visualThemeStore";
import { getThemeTokens } from "@/theme";
import { gradientPair } from "@/theme/gradient";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import { SPECTRUM_PALETTE } from "@/theme/spectrumPalette";

const THEMES: VisualTheme[] = ["bloom", "dusty", "light", "warm", "pastel", "noir", "spectrum"];

const ITEM_WIDTH = 108;
const ITEM_GAP = spacing.sm;

const ThemePreview = memo(function ThemePreview({ theme, large }: { theme: VisualTheme; large?: boolean }) {
  const tokens = getThemeTokens(theme);
  const gradient = gradientPair(tokens.background.gradient);
  const wrapStyle = large ? previewStyles.wrapLarge : previewStyles.wrap;

  if (theme === "spectrum") {
    const barWarm = SPECTRUM_PALETTE.yellow;
    const barCool = SPECTRUM_PALETTE.violet;
    return (
      <View style={[wrapStyle, previewStyles.spectrumWrap]}>
        <View style={[previewStyles.spectrumIcon, large && previewStyles.spectrumIconLarge]}>
          <LinearGradient
            colors={[SPECTRUM_PALETTE.bg, SPECTRUM_PALETTE.bgDeep]}
            style={previewStyles.spectrumIconBg}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.85, y: 1 }}
          />
          {[0.18, 0.32, 0.46, 0.6, 0.74].map((left, i) => {
            const heights = large ? [16, 24, 30, 24, 16] : [14, 22, 28, 22, 14];
            const h = heights[i] ?? 18;
            const top = i <= 2 ? barWarm : SPECTRUM_PALETTE.yellowSoft;
            const bottom = i >= 2 ? barCool : SPECTRUM_PALETTE.violetLight;
            return (
              <LinearGradient
                key={left}
                colors={[top, bottom]}
                style={[
                  previewStyles.spectrumBar,
                  large && previewStyles.spectrumBarLarge,
                  {
                    left: `${left * 100}%`,
                    height: h,
                    bottom: large ? 12 : 10,
                    marginLeft: -4,
                  },
                ]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              />
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={wrapStyle}>
      <LinearGradient colors={gradient} style={previewStyles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={[previewStyles.orb, { backgroundColor: tokens.iris.rose }]} />
      <View style={[previewStyles.orbSmall, { backgroundColor: tokens.iris.sky }]} />
      <View style={[previewStyles.bar, { backgroundColor: tokens.colors.surfaceBorder }]} />
      <View style={[previewStyles.accent, { backgroundColor: tokens.colors.accentPrimary }]} />
    </View>
  );
});

type ThemeOptionProps = {
  theme: VisualTheme;
  active: boolean;
  label: string;
  onSelect: (theme: VisualTheme) => void;
};

const ThemeOption = memo(function ThemeOption({ theme, active, label, onSelect }: ThemeOptionProps) {
  const { colors, typography, radius } = useTheme();

  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onSelect(theme);
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    >
      <View
        style={[
          styles.previewFrame,
          {
            borderRadius: radius.md,
            borderColor: active ? colors.accentPrimary : colors.surfaceBorder,
            borderWidth: active ? 2 : StyleSheet.hairlineWidth,
            backgroundColor: colors.bgElevated,
          },
        ]}
      >
        <ThemePreview theme={theme} large />
        {active ? (
          <View style={[styles.checkBadge, { backgroundColor: colors.accentPrimary }]}>
            <Ionicons name="checkmark" size={12} color={colors.accentOnPrimary} />
          </View>
        ) : null}
      </View>
      <Text
        style={[
          typography.caption,
          styles.itemLabel,
          { color: active ? colors.text : colors.textMuted, fontWeight: active ? "700" : "500" },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
});

export const ThemePicker = memo(function ThemePicker() {
  const { locale } = useI18n();
  const current = useVisualThemeStore((s) => s.theme);
  const setTheme = useVisualThemeStore((s) => s.setTheme);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToTheme = useCallback((theme: VisualTheme, animated: boolean) => {
    const index = THEMES.indexOf(theme);
    if (index < 0) return;
    scrollRef.current?.scrollTo({
      x: Math.max(0, index * (ITEM_WIDTH + ITEM_GAP) - ITEM_GAP),
      animated,
    });
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => scrollToTheme(current, false));
    return () => cancelAnimationFrame(id);
  }, [current, scrollToTheme]);

  const onSelect = useCallback(
    (theme: VisualTheme) => {
      setTheme(theme);
      scrollToTheme(theme, true);
    },
    [scrollToTheme, setTheme],
  );

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={ITEM_WIDTH + ITEM_GAP}
      snapToAlignment="start"
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {THEMES.map((theme) => {
        const active = current === theme;
        const label = locale === "fr" ? THEME_LABELS[theme].fr : THEME_LABELS[theme].en;
        return (
          <ThemeOption key={theme} theme={theme} active={active} label={label} onSelect={onSelect} />
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollContent: {
    gap: ITEM_GAP,
    paddingVertical: spacing.xs,
    paddingRight: spacing.xs,
  },
  item: {
    width: ITEM_WIDTH,
    alignItems: "center",
    gap: spacing.xs,
  },
  itemPressed: {
    opacity: 0.88,
  },
  previewFrame: {
    width: ITEM_WIDTH,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemLabel: {
    textAlign: "center",
    fontSize: 12,
  },
});

const previewStyles = StyleSheet.create({
  wrap: {
    width: 72,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  wrapLarge: {
    width: 80,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  gradient: { ...StyleSheet.absoluteFillObject },
  orb: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    opacity: 0.85,
  },
  orbSmall: {
    position: "absolute",
    top: 22,
    right: 22,
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.7,
  },
  bar: {
    position: "absolute",
    left: 10,
    bottom: 14,
    height: 4,
    width: 28,
    borderRadius: 2,
    opacity: 0.5,
  },
  accent: {
    position: "absolute",
    left: 10,
    bottom: 8,
    height: 3,
    width: 18,
    borderRadius: 2,
  },
  spectrumBar: {
    position: "absolute",
    width: 7,
    borderRadius: 4,
    opacity: 0.95,
  },
  spectrumBarLarge: {
    width: 8,
  },
  spectrumWrap: {
    backgroundColor: SPECTRUM_PALETTE.bg,
    borderColor: "rgba(168,148,200,0.35)",
  },
  spectrumIcon: {
    position: "absolute",
    left: 10,
    top: 8,
    width: 52,
    height: 40,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#C8B8E0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  spectrumIconLarge: {
    left: 12,
    top: 10,
    width: 56,
    height: 44,
  },
  spectrumIconBg: {
    ...StyleSheet.absoluteFillObject,
  },
});
