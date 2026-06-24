import { memo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Props = {
  open: boolean;
  onToggle: () => void;
  summary?: string;
  children: ReactNode;
};

export const StudioAdvancedSection = memo(function StudioAdvancedSection({
  open,
  onToggle,
  summary,
  children,
}: Props) {
  const { t } = useI18n();
  const { colors, typography, radius } = useTheme();

  return (
    <View style={[styles.wrap, { borderTopColor: colors.surfaceBorder }]}>
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        style={[
          styles.toggle,
          {
            backgroundColor: open ? colors.pillActiveBg : colors.bgGlass,
            borderRadius: radius.lg,
            borderColor: open ? colors.accentPrimary : colors.surfaceBorder,
            borderWidth: StyleSheet.hairlineWidth,
          },
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={t("studioAdvanced")}
      >
        <View style={styles.toggleMain}>
          <Ionicons name="options-outline" size={18} color={colors.accentPrimary} />
          <View style={styles.toggleCopy}>
            <Text style={[typography.caption, { color: colors.text, fontWeight: "600" }]}>{t("studioAdvanced")}</Text>
            {!open && summary ? (
              <Text style={[typography.micro, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={2}>
                {summary}
              </Text>
            ) : (
              <Text style={[typography.micro, { color: colors.textSubtle, marginTop: 2 }]}>{t("studioAdvancedHint")}</Text>
            )}
          </View>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={20} color={colors.textMuted} />
      </Pressable>

      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  toggleMain: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  toggleCopy: { flex: 1, minWidth: 0 },
  body: { gap: spacing.lg },
});
