import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { LOCALE_SHORT, UI_LOCALES, type AppLocale } from "@producerhit/shared";
import { getDeviceAppLocale } from "@/lib/deviceLocale";
import { useLocaleStore } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

const OPTIONS = UI_LOCALES.map((id) => ({ id, label: LOCALE_SHORT[id] }));

export const LocaleToggle = memo(function LocaleToggle() {
  const locale = useLocaleStore((s) => s.locale);
  const userOverride = useLocaleStore((s) => s.userOverride);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const syncDeviceLocale = useLocaleStore((s) => s.syncDeviceLocale);
  const { colors, typography } = useTheme();
  const deviceLocale = getDeviceAppLocale();
  const autoActive = !userOverride;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => {
          if (autoActive) return;
          void Haptics.selectionAsync();
          syncDeviceLocale();
        }}
        style={[
          styles.pill,
          autoActive
            ? { backgroundColor: colors.pillActiveBg, borderColor: colors.pillActiveText }
            : { backgroundColor: colors.bgGlass, borderColor: colors.surfaceBorder },
        ]}
      >
        <Text
          style={[
            typography.caption,
            { fontWeight: "600", color: autoActive ? colors.pillActiveText : colors.textMuted },
          ]}
        >
          {LOCALE_SHORT[deviceLocale]} ✦
        </Text>
      </Pressable>
      {OPTIONS.map((opt) => {
        const active = userOverride && locale === opt.id;
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
              active
                ? { backgroundColor: colors.pillActiveBg, borderColor: colors.pillActiveText }
                : { backgroundColor: colors.bgGlass, borderColor: colors.surfaceBorder },
            ]}
          >
            <Text
              style={[
                typography.caption,
                { fontWeight: "600", color: active ? colors.pillActiveText : colors.textMuted },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
