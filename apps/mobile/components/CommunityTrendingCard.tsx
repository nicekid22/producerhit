import { memo, useMemo } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { CommunityLoop } from "@/lib/publicLoopsApi";
import { loopKindLabel, resolveLoopCoverUrl } from "@/lib/loopDisplay";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Props = {
  loop: CommunityLoop;
  active?: boolean;
  playing?: boolean;
  busy?: boolean;
  onPress: () => void;
  onOpen?: () => void;
};

const CARD_WIDTH = 156;

export const CommunityTrendingCard = memo(function CommunityTrendingCard({
  loop,
  active,
  playing,
  busy,
  onPress,
  onOpen,
}: Props) {
  const { locale, t } = useI18n();
  const { colors, typography, radius, motion } = useTheme();
  const reduced = useReducedMotion();
  const uri = resolveLoopCoverUrl(loop);
  const kind = loopKindLabel(loop, locale);
  const author = loop.authorUsername ? `@${loop.authorUsername}` : t("communityCreator");
  const styles = useMemo(() => createStyles(colors, typography, radius), [colors, typography, radius]);

  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.wrap,
        active && styles.active,
        pressed && !reduced && { transform: [{ scale: motion.pressScale }] },
      ]}
    >
      <View style={styles.coverWrap}>
        {uri ? (
          <Image source={{ uri }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, { backgroundColor: colors.pillActiveBg }]} />
        )}
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.65)"]} style={styles.gradient} />
        <View style={styles.playRow}>
          {busy ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={[styles.playBtn, playing && styles.playBtnActive]}>
              <Ionicons name={playing ? "pause" : "play"} size={16} color="#fff" />
            </View>
          )}
          {onOpen ? (
            <Pressable style={styles.infoBtn} onPress={onOpen} hitSlop={6}>
              <Ionicons name="information-circle-outline" size={18} color="#fff" />
            </Pressable>
          ) : null}
        </View>
        <View style={[styles.kindBadge, { backgroundColor: colors.accentPrimary }]}>
          <Text style={styles.kindText}>{kind}</Text>
        </View>
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {loop.name}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {loop.genre} · {author}
      </Text>
    </Pressable>
  );
});

export const COMMUNITY_TRENDING_CARD_WIDTH = CARD_WIDTH;

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  typography: ReturnType<typeof useTheme>["typography"],
  radius: ReturnType<typeof useTheme>["radius"],
) {
  return StyleSheet.create({
    wrap: { width: CARD_WIDTH, gap: 6 },
    active: {},
    coverWrap: {
      width: CARD_WIDTH,
      height: CARD_WIDTH,
      borderRadius: radius.lg,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder,
    },
    cover: { width: "100%", height: "100%" },
    gradient: { ...StyleSheet.absoluteFillObject },
    playRow: {
      position: "absolute",
      right: 8,
      bottom: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    playBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.25)",
    },
    playBtnActive: { backgroundColor: colors.accentPrimary, borderColor: colors.accentPrimary },
    infoBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(0,0,0,0.35)",
      alignItems: "center",
      justifyContent: "center",
    },
    kindBadge: {
      position: "absolute",
      left: 8,
      top: 8,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    kindText: { ...typography.micro, color: "#fff", fontWeight: "700", fontSize: 9 },
    name: { ...typography.subtitle, color: colors.text, fontSize: 14, lineHeight: 18 },
    meta: { ...typography.micro, color: colors.textMuted },
  });
}
