import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { Loop } from "@producerhit/shared";
import { LoopCover } from "@/components/LoopCover";
import { loopKindLabel } from "@/lib/loopDisplay";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useI18n } from "@/stores/localeStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useTheme } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/tokens";

type Props = {
  loop: Loop;
  queue?: Loop[];
  onLongPress?: () => void;
  onOpenDetails?: () => void;
};

export function LoopCard({ loop, queue, onLongPress, onOpenDetails }: Props) {
  const { locale, t } = useI18n();
  const { colors, motion } = useTheme();
  const reducedMotion = useReducedMotion();
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setCurrent = usePlayerStore((s) => s.setCurrent);
  const active = current?.id === loop.id;
  const playing = active && isPlaying;
  const kind = loopKindLabel(loop, locale);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const play = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrent(loop, queue ?? [loop]);
  };

  return (
    <Pressable
      onPress={play}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.wrap,
        pressed && !reducedMotion && { transform: [{ scale: motion.pressScale }] },
        active && styles.active,
      ]}
    >
      <LoopCover loop={loop} size={72} rounded={radius.lg} playing={playing} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>
            {loop.name}
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.pillActiveBg }]}>
            <Text style={styles.badgeText}>{kind}</Text>
          </View>
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {loop.genre} · {loop.bpm} BPM
          {loop.key ? ` · ${loop.key}` : ""}
        </Text>
        {loop.isPublic ? <Text style={styles.publicTag}>{t("publicOnWeb")}</Text> : null}
      </View>
      <View style={styles.actions}>
        {onOpenDetails ? (
          <Pressable style={styles.moreBtn} onPress={onOpenDetails} hitSlop={8}>
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
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    name: { ...typography.subtitle, color: colors.text, flex: 1 },
    meta: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
    publicTag: { ...typography.micro, color: colors.accent, marginTop: 4 },
    actions: { flexDirection: "row", alignItems: "center", gap: 6 },
    moreBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    moreIcon: { color: colors.textMuted, fontSize: 20, lineHeight: 22 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
    badgeText: { ...typography.micro, color: colors.text, fontSize: 10 },
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
