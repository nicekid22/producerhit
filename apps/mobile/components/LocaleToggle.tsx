import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { LOCALE_SHORT, UI_LOCALES, type AppLocale } from "@producerhit/shared";
import { useLocaleStore } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";

const OPTIONS = UI_LOCALES.map((id) => ({ id, label: LOCALE_SHORT[id] }));

export function LocaleToggle() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const { colors, typography, radius } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {OPTIONS.map((opt) => {
        const active = locale === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => {
              if (active) return;
              void Haptics.selectionAsync();
              void setLocale(opt.id as AppLocale);
            }}
            style={[
              styles.pill,
              {
                borderRadius: radius.pill,
                borderColor: colors.surfaceBorder,
                backgroundColor: colors.surface,
              },
              active && { borderColor: colors.accent, backgroundColor: colors.pillActiveBg },
            ]}
          >
            <Text
              style={[
                typography.caption,
                { color: colors.textMuted, fontWeight: "600" },
                active && { color: colors.text },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, paddingRight: 4 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
});
