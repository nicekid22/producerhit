import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, SectionList, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  buildPrecisionGenreOptions,
  findGenreOption,
  FROM_IDEA_GENRE_VALUE,
  GENRE_CATALOG_COUNT,
  isFromIdeaGenreSelection,
  isRandomGenreSelection,
  RANDOM_GENRE_VALUE,
  type GenreDropdownOption,
} from "@producerhit/shared";
import { PhBottomSheet } from "@/components/PhBottomSheet";
import { PhCard } from "@/components/PhCard";
import { SearchGlassField } from "@/components/SearchGlassField";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Props = {
  value: string;
  onChange: (genre: string) => void;
  hint?: string;
  /** Hide Auto / Random rows (e.g. library filter). */
  catalogOnly?: boolean;
  /** Library filter: show « All genres » row with this value. */
  filterAllValue?: string;
  filterAllLabel?: string;
  style?: StyleProp<ViewStyle>;
};

type Section = { title: string; data: GenreDropdownOption[] };

function resolvePickerValue(value: string): string {
  if (isRandomGenreSelection(value)) return RANDOM_GENRE_VALUE;
  if (isFromIdeaGenreSelection(value)) return FROM_IDEA_GENRE_VALUE;
  return value;
}

function genreIcon(value: string): keyof typeof Ionicons.glyphMap {
  if (value === FROM_IDEA_GENRE_VALUE) return "bulb-outline";
  if (value === RANDOM_GENRE_VALUE) return "shuffle-outline";
  return "musical-notes-outline";
}

export const GenrePicker = memo(function GenrePicker({
  value,
  onChange,
  hint,
  catalogOnly = false,
  filterAllValue,
  filterAllLabel,
  style,
}: Props) {
  const { locale, t } = useI18n();
  const { colors, typography, radius } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const allOptions = useMemo(() => buildPrecisionGenreOptions(locale), [locale]);
  const options = useMemo(
    () =>
      catalogOnly
        ? allOptions.filter((o) => o.value !== FROM_IDEA_GENRE_VALUE && o.value !== RANDOM_GENRE_VALUE)
        : allOptions,
    [allOptions, catalogOnly],
  );

  const pickerValue = resolvePickerValue(value);
  const selectedLabel = useMemo(() => {
    if (filterAllValue && value === filterAllValue) {
      return filterAllLabel ?? value;
    }
    const fromMenu = options.find((o) => o.value === pickerValue);
    if (fromMenu) return fromMenu.label;
    const catalog = findGenreOption(pickerValue);
    return catalog?.label ?? value;
  }, [filterAllLabel, filterAllValue, options, pickerValue, value]);

  const sections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? options.filter(
          (o) => o.label.toLowerCase().includes(needle) || o.value.toLowerCase().includes(needle),
        )
      : options;

    const byGroup = new Map<string, GenreDropdownOption[]>();
    for (const opt of filtered) {
      const list = byGroup.get(opt.group) ?? [];
      list.push(opt);
      byGroup.set(opt.group, list);
    }

    const out: Section[] = [];
    if (filterAllValue && filterAllLabel && !needle) {
      out.push({
        title: locale === "fr" ? "Filtre" : "Filter",
        data: [{ value: filterAllValue, label: filterAllLabel, group: "Filter" }],
      });
    }
    for (const [title, data] of byGroup) {
      if (data.length > 0) out.push({ title, data });
    }
    return out;
  }, [filterAllLabel, filterAllValue, locale, options, query]);

  const select = useCallback(
    (next: string) => {
      void Haptics.selectionAsync();
      onChange(next);
      setOpen(false);
      setQuery("");
    },
    [onChange],
  );

  const placeholder =
    locale === "fr" ? `Rechercher parmi ${GENRE_CATALOG_COUNT}+ styles…` : `Search ${GENRE_CATALOG_COUNT}+ styles…`;

  return (
    <>
      <View style={style}>
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={t("genre")}
      >
        <PhCard elevated={false} style={[styles.trigger, { borderRadius: radius.lg }]}>
          <View style={styles.triggerRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.bgGlass }]}>
              <Ionicons name={genreIcon(pickerValue)} size={18} color={colors.accentPrimary} />
            </View>
            <View style={styles.triggerText}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>{t("genre")}</Text>
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
        <Text style={[typography.micro, { color: colors.textSubtle, marginTop: spacing.sm, lineHeight: 16 }]}>
          {hint}
        </Text>
      ) : null}

      <PhBottomSheet visible={open} onClose={() => setOpen(false)} scrollable={false} maxHeight="86%">
        <View style={styles.sheetBody}>
          <Text style={[typography.title, { color: colors.text, marginBottom: spacing.sm }]}>{t("genre")}</Text>
          <SearchGlassField
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder}
            autoCorrect={false}
            autoCapitalize="none"
          />

          <SectionList<GenreDropdownOption, Section>
            sections={sections}
            keyExtractor={(item) => item.value}
            stickySectionHeadersEnabled
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={[typography.body, { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl }]}>
              {locale === "fr" ? "Aucun style trouvé." : "No styles found."}
            </Text>
          }
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHead, { backgroundColor: colors.bgElevated }]}>
              <Text style={[typography.micro, styles.sectionTitle, { color: colors.textSubtle }]}>
                {section.title.toUpperCase()}
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const active = item.value === value || item.value === pickerValue;
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
                  name={genreIcon(item.value)}
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
    paddingVertical: spacing.md,
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
  list: { flex: 1, minHeight: 0, marginTop: spacing.sm },
  listContent: { paddingBottom: spacing.xxl },
  sectionHead: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: { letterSpacing: 1.1, fontWeight: "700" },
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
