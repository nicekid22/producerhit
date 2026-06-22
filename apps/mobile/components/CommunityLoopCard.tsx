import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { CommunityLoop } from "@/lib/publicLoopsApi";
import { LoopCover } from "@/components/LoopCover";
import { loopKindLabel } from "@/lib/loopDisplay";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/tokens";

type Props = {
  loop: CommunityLoop;
  active?: boolean;
  playing?: boolean;
  onPress: () => void;
  onOpen?: () => void;
};

export function CommunityLoopCard({ loop, active, playing, onPress, onOpen }: Props) {
  const { locale, t } = useI18n();
  const { colors, motion } = useTheme();
  const reducedMotion = useReducedMotion();
  const kind = loopKindLabel(loop, locale);
  const author = loop.authorUsername ? `@${loop.authorUsername}` : t("communityCreator");
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.wrap,
        pressed && !reducedMotion && { transform: [{ scale: motion.pressScale }] },
        active && styles.active,
      ]}
    >
      <LoopCover loop={loop} size={72} rounded={radius.lg} playing={playing} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {loop.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {loop.genre} · {loop.bpm} BPM · {author}
        </Text>
        <View style={styles.row}>
          <View style={[styles.badge, { backgroundColor: colors.pillActiveBg }]}>
            <Text style={styles.badgeText}>{kind}</Text>
          </View>
          <Text style={styles.communityTag}>{t("communityTag")}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {onOpen ? (
          <Pressable
            style={styles.moreBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              onOpen();
            }}
            hitSlop={8}
          >
            <Text style={styles.moreIcon}>⋯</Text>
          </Pressable>
        ) : null}
        <View style={[styles.playBtn, playing && styles.playBtnActive]}>
          <Ionicons name={playing ? "pause" : "play"} size={16} color="#fff" />
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.bgGlass,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    active: { borderColor: colors.accent },
    body: { flex: 1, minWidth: 0 },
    name: { ...typography.subtitle, color: colors.text },
    meta: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
    row: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
    badgeText: { ...typography.micro, color: colors.text, fontSize: 10 },
    communityTag: { ...typography.micro, color: colors.accent },
    actions: { flexDirection: "row", alignItems: "center", gap: 6 },
    moreBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    moreIcon: { color: colors.textMuted, fontSize: 20, lineHeight: 22 },
    playBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    playBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  });
}
