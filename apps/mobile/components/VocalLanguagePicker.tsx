import { memo, useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { VOCAL_LANGUAGES, vocalLanguageLabel } from "@producerhit/shared";
import { PhBottomSheet } from "@/components/PhBottomSheet";
import { PhCard } from "@/components/PhCard";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type LangOption = { value: string; label: string };

type Props = {
  /** `auto` or ACE vocal language code. */
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  style?: StyleProp<ViewStyle>;
};

export const VocalLanguagePicker = memo(function VocalLanguagePicker({ value, onChange, hint, style }: Props) {
  const { locale, t } = useI18n();
  const { colors, typography, radius } = useTheme();
  const [open, setOpen] = useState(false);

  const options = useMemo<LangOption[]>(
    () => [
      { value: "auto", label: t("genLangAuto") },
      ...VOCAL_LANGUAGES.map((l) => ({
        value: l.value,
        label: vocalLanguageLabel(l.value, locale),
      })),
    ],
    [locale, t],
  );

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? value,
    [options, value],
  );

  const select = useCallback(
    (next: string) => {
      void Haptics.selectionAsync();
      onChange(next);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <>
      <View style={style}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={t("language")}
        >
          <PhCard elevated={false} style={[styles.trigger, { borderRadius: radius.lg }]}>
            <View style={styles.triggerRow}>
              <View style={[styles.iconWrap, { backgroundColor: colors.bgGlass }]}>
                <Ionicons name="language-outline" size={18} color={colors.accentPrimary} />
              </View>
              <View style={styles.triggerText}>
                <Text style={[typography.caption, { color: colors.textMuted }]}>{t("language")}</Text>
                <Text style={[typography.body, { color: colors.text, fontWeight: "600" }]} numberOfLines={1}>
                  {selectedLabel}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSubtle} />
            </View>
          </PhCard>
        </Pressable>
      </View>

      {hint ? (
        <Text style={[typography.micro, { color: colors.textSubtle, marginTop: spacing.xs, lineHeight: 16 }]}>
          {hint}
        </Text>
      ) : null}

      <PhBottomSheet visible={open} onClose={() => setOpen(false)} scrollable={false} maxHeight="72%">
        <View style={styles.sheetBody}>
          <Text style={[typography.title, { color: colors.text, marginBottom: spacing.sm }]}>{t("language")}</Text>
          <Text style={[typography.micro, { color: colors.textSubtle, marginBottom: spacing.md, lineHeight: 16 }]}>
            {t("languageHint")}
          </Text>

          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const active = item.value === value;
              return (
                <Pressable
                  onPress={() => select(item.value)}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: pressed ? colors.bgGlass : active ? colors.pillActiveBg : "transparent",
                      borderColor: active ? colors.pillActiveText : colors.surfaceBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.value === "auto" ? "sparkles-outline" : "globe-outline"}
                    size={16}
                    color={active ? colors.pillActiveText : colors.textMuted}
                    style={styles.rowIcon}
                  />
                  <Text
                    style={[
                      typography.body,
                      {
                        color: active ? colors.pillActiveText : colors.text,
                        fontWeight: active ? "700" : "500",
                        flex: 1,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                  {active ? <Ionicons name="checkmark" size={18} color={colors.pillActiveText} /> : null}
                </Pressable>
              );
            }}
          />
        </View>
      </PhBottomSheet>
    </>
  );
});

const styles = StyleSheet.create({
  trigger: { padding: 0 },
  triggerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  triggerText: { flex: 1, gap: 2 },
  sheetBody: { flex: 1, minHeight: 0 },
  list: { flex: 1, minHeight: 0 },
  listContent: { paddingBottom: spacing.xl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },
  rowIcon: { marginRight: spacing.sm },
});
