import { memo, useMemo, useState } from "react";
import { ActivityIndicator, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { CommunityLoop } from "@/lib/publicLoopsApi";
import { LoopCover } from "@/components/LoopCover";
import { loopKindLabel } from "@/lib/loopDisplay";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
type Props = {
  loop: CommunityLoop;
  active?: boolean;
  playing?: boolean;
  busy?: boolean;
  onPress: () => void;
  onOpen?: () => void;
  positionMs?: number;
};

export const CommunityGridCard = memo(function CommunityGridCard({
  loop,
  active,
  playing,
  busy,
  onPress,
  onOpen,
  positionMs = 0,
}: Props) {
  const { locale, t } = useI18n();
  const { colors, typography, radius } = useTheme();
  const reduced = useReducedMotion();
  const [coverSize, setCoverSize] = useState(0);
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
        styles.card,
        active && styles.cardActive,
        pressed && !reduced && { transform: [{ scale: 0.99 }] },
      ]}
    >
      <View
        style={[styles.coverWrap, active && { borderColor: colors.pillActiveText }]}
        onLayout={(e: LayoutChangeEvent) => {
          const w = Math.floor(e.nativeEvent.layout.width);
          if (w > 0 && w !== coverSize) setCoverSize(w);
        }}
      >
        {coverSize > 0 ? (
          <LoopCover
            loop={loop}
            size={coverSize}
            rounded={radius.cover}
            playing={playing}
            positionMs={positionMs}
          />
        ) : null}
        <View style={styles.kindBadge}>
          <Text style={[styles.kindText, { color: colors.pillActiveText }]}>{kind}</Text>
        </View>
        <View style={[styles.playChip, playing && { backgroundColor: colors.accentPrimary }]}>
          {busy ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name={playing ? "pause" : "play"} size={14} color="#fff" />
          )}
        </View>
        {onOpen ? (
          <Pressable style={styles.infoChip} onPress={onOpen} hitSlop={6}>
            <Ionicons name="information-circle-outline" size={16} color="#fff" />
          </Pressable>
        ) : null}
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

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  typography: ReturnType<typeof useTheme>["typography"],
  radius: ReturnType<typeof useTheme>["radius"],
) {
  return StyleSheet.create({
    card: {
      gap: 6,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder,
      backgroundColor: colors.bgGlass,
      padding: 10,
    },
    cardActive: {
      borderColor: colors.pillActiveText,
      backgroundColor: colors.pillActiveBg,
    },
    coverWrap: {
      aspectRatio: 1,
      borderRadius: radius.cover,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder,
      position: "relative",
    },
    cover: { width: "100%", height: "100%" },
    kindBadge: {
      position: "absolute",
      left: 8,
      top: 8,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: radius.pill,
      backgroundColor: "rgba(139,111,168,0.22)",
    },
    kindText: { ...typography.micro, fontWeight: "700", fontSize: 9 },
    playChip: {
      position: "absolute",
      right: 8,
      bottom: 8,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
    },
    infoChip: {
      position: "absolute",
      right: 8,
      top: 8,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(0,0,0,0.4)",
      alignItems: "center",
      justifyContent: "center",
    },
    name: { ...typography.subtitle, color: colors.text, fontSize: 14, lineHeight: 18 },
    meta: { ...typography.micro, color: colors.textMuted },
  });
}
