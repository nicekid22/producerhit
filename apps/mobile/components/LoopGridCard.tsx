import { memo, useMemo, useState } from "react";

import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import * as Haptics from "expo-haptics";

import type { Loop } from "@producerhit/shared";

import { LoopCover } from "@/components/LoopCover";
import { loopKindLabel } from "@/lib/loopDisplay";

import { useReducedMotion } from "@/lib/useReducedMotion";
import { useI18n } from "@/stores/localeStore";
import { usePlayerStore } from "@/stores/playerStore";

import { useTheme } from "@/theme/ThemeProvider";



type Props = {
  loop: Loop;
  queue?: Loop[];
  active?: boolean;
  playing?: boolean;
  onLongPress?: () => void;
  onOpenDetails?: () => void;
  positionMs?: number;
};

export const LoopGridCard = memo(function LoopGridCard({
  loop,
  queue,
  active = false,
  playing = false,
  onLongPress,
  onOpenDetails,
  positionMs = 0,
}: Props) {
  const { locale } = useI18n();
  const { colors, typography, radius } = useTheme();
  const reduced = useReducedMotion();
  const [coverSize, setCoverSize] = useState(0);

  const kind = loopKindLabel(loop, locale);
  const styles = useMemo(() => createStyles(colors, typography, radius), [colors, typography, radius]);

  const onCoverLayout = (e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w > 0 && w !== coverSize) setCoverSize(w);
  };

  const play = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    usePlayerStore.getState().setCurrent(loop, queue ?? [loop]);
  };



  return (

    <Pressable

      onPress={play}

      onLongPress={onLongPress}

      style={({ pressed }) => [

        styles.card,

        active && styles.cardActive,

        pressed && !reduced && { transform: [{ scale: 0.99 }] },

      ]}

    >

      <View
        style={[styles.coverWrap, active && { borderColor: colors.pillActiveText }]}
        onLayout={onCoverLayout}
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

        <Pressable

          style={[styles.playChip, playing && { backgroundColor: colors.accentPrimary }]}

          onPress={play}

          hitSlop={6}

        >

          <Ionicons name={playing ? "pause" : "play"} size={14} color={colors.text} />

        </Pressable>

        {onOpenDetails ? (

          <Pressable style={styles.moreChip} onPress={onOpenDetails} hitSlop={6}>

            <Ionicons name="ellipsis-horizontal" size={16} color={colors.text} />

          </Pressable>

        ) : null}

      </View>

      <Text style={styles.name} numberOfLines={2}>

        {loop.name}

      </Text>

      <Text style={styles.meta} numberOfLines={1}>

        {loop.genre} · {loop.bpm}

      </Text>

      <View style={styles.kindPill}>

        <Text style={styles.kindText}>{kind}</Text>

      </View>

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

    coverPlaceholder: {

      backgroundColor: colors.bgElevated,

      alignItems: "center",

      justifyContent: "center",

    },

    coverMark: {

      width: "30%",

      height: "30%",

      borderRadius: 999,

      backgroundColor: colors.pillActiveText,

      opacity: 0.35,

    },

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

    moreChip: {

      position: "absolute",

      left: 8,

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

    kindPill: {

      alignSelf: "flex-start",

      paddingHorizontal: 7,

      paddingVertical: 2,

      borderRadius: radius.pill,

      backgroundColor: "rgba(139,111,168,0.18)",

    },

    kindText: { ...typography.micro, color: colors.pillActiveText, fontSize: 9 },

  });

}

