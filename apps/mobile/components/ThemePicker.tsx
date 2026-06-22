import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { THEME_LABELS, type VisualTheme } from "@/theme/types";
import { useVisualThemeStore } from "@/stores/visualThemeStore";
import { getThemeTokens } from "@/theme";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";

const THEMES: VisualTheme[] = ["prism", "air", "warm"];

function ThemePreview({ theme }: { theme: VisualTheme }) {
  const tokens = getThemeTokens(theme);
  const { material } = tokens;

  if (material === "studio") {
    return (
      <View style={[previewStyles.box, { backgroundColor: tokens.colors.bg }]}>
        <View style={[previewStyles.bar, { backgroundColor: tokens.colors.accent, opacity: 0.5 }]} />
        <View style={[previewStyles.barShort, { backgroundColor: tokens.colors.surface }]} />
      </View>
    );
  }
  if (material === "paper") {
    return (
      <View style={[previewStyles.box, { backgroundColor: tokens.colors.bg, borderColor: tokens.colors.surfaceBorder }]}>
        <Text style={[previewStyles.serif, { color: tokens.colors.accent, fontFamily: tokens.typography.displayFontFamily }]}>
          Aa
        </Text>
      </View>
    );
  }
  return (
    <View style={[previewStyles.box, { backgroundColor: tokens.colors.bg, borderColor: tokens.colors.surfaceBorder }]}>
      <View style={[previewStyles.airLine, { backgroundColor: tokens.colors.accent }]} />
      <View style={[previewStyles.airDot, { backgroundColor: tokens.colors.textSubtle }]} />
    </View>
  );
}

export function ThemePicker() {
  const { locale, t } = useI18n();
  const current = useVisualThemeStore((s) => s.theme);
  const setTheme = useVisualThemeStore((s) => s.setTheme);
  const { colors, typography } = useTheme();

  return (
    <View style={styles.row}>
      {THEMES.map((theme) => {
        const active = current === theme;
        const label = locale === "fr" ? THEME_LABELS[theme].fr : THEME_LABELS[theme].en;
        const tagline = locale === "fr" ? THEME_LABELS[theme].tagline.fr : THEME_LABELS[theme].tagline.en;
        return (
          <Pressable
            key={theme}
            onPress={() => {
              void Haptics.selectionAsync();
              setTheme(theme);
            }}
            style={[
              styles.card,
              {
                borderColor: active ? colors.accent : colors.surfaceBorder,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <ThemePreview theme={theme} />
            <View style={styles.meta}>
              <Text style={[typography.subtitle, { color: active ? colors.text : colors.textMuted }]}>{label}</Text>
              <Text style={[typography.micro, { color: colors.textSubtle }]}>{tagline}</Text>
            </View>
          </Pressable>
        );
      })}
      <Text style={[typography.micro, { color: colors.textSubtle, marginTop: 4 }]}>{t("themeHint")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  meta: { flex: 1, gap: 2 },
});

const previewStyles = StyleSheet.create({
  box: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 8,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  bar: { height: 3, borderRadius: 2, width: "80%" },
  barShort: { height: 3, borderRadius: 2, width: "45%", marginTop: 4 },
  serif: { fontSize: 22, lineHeight: 28 },
  airLine: { height: 2, width: "70%", borderRadius: 1 },
  airDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
});
