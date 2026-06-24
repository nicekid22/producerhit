import { memo, useEffect, useMemo, useState } from "react";

import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import * as Haptics from "expo-haptics";

import type { Loop } from "@producerhit/shared";

import { AnimatedWaveformStrip } from "@/components/AnimatedWaveformStrip";

import { prefetchCoverUri, isCoverLoaded, markCoverLoaded } from "@/lib/coverImageCache";
import { loopKindLabel, resolveLoopCoverUrl } from "@/lib/loopDisplay";

import { useReducedMotion } from "@/lib/useReducedMotion";

import { useI18n } from "@/stores/localeStore";

import { usePlayerStore } from "@/stores/playerStore";

import { useTheme } from "@/theme/ThemeProvider";

import { spacing } from "@/theme/tokens";



type Props = {

  loop: Loop;

  queue?: Loop[];

  label?: string;
  active?: boolean;
  playing?: boolean;
  onOpenDetails?: () => void;
  screenFocused?: boolean;
};

export const LibraryFeaturedCard = memo(function LibraryFeaturedCard({
  loop,
  queue,
  label,
  active = false,
  playing = false,
  onOpenDetails,
  screenFocused = true,
}: Props) {
  const { locale, t } = useI18n();
  const { colors, typography, radius } = useTheme();
  const reduced = useReducedMotion();

  const uri = resolveLoopCoverUrl(loop);
  const kind = loopKindLabel(loop, locale);
  const styles = useMemo(() => createStyles(colors, typography, radius), [colors, typography, radius]);
  const waveformActive = screenFocused && playing;
  const [coverReady, setCoverReady] = useState(() => !uri || isCoverLoaded(uri));

  useEffect(() => {
    if (!uri) {
      setCoverReady(true);
      return;
    }
    if (isCoverLoaded(uri)) {
      setCoverReady(true);
      return;
    }
    setCoverReady(false);
    prefetchCoverUri(uri);
  }, [uri]);

  const play = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    usePlayerStore.getState().setCurrent(loop, queue ?? [loop]);
  };



  return (

    <View style={styles.wrap}>

      <Text style={styles.sectionLabel}>{label ?? t("libraryFeatured")}</Text>

      <Pressable

        onPress={play}

        style={({ pressed }) => [styles.card, pressed && !reduced && { transform: [{ scale: 0.99 }] }]}

      >

        <View style={styles.art}>

          <View style={[styles.cover, styles.coverPlaceholder]}>
            <View style={styles.coverMark} />
          </View>

          {uri ? (
            <Image
              source={{ uri }}
              style={[styles.cover, !coverReady && styles.coverLoading]}
              resizeMode="cover"
              fadeDuration={0}
              onLoad={() => {
                markCoverLoaded(uri);
                setCoverReady(true);
              }}
            />
          ) : null}

          <View style={styles.scrim} />

          {waveformActive ? (
            <View style={styles.waveOverlay}>
              <AnimatedWaveformStrip height={28} bars={32} opacity={0.9} active />
            </View>
          ) : null}

          <View style={styles.meta}>

            <View style={styles.badge}>

              <Text style={styles.badgeText}>{kind}</Text>

            </View>

            <Text style={styles.title} numberOfLines={2}>

              {loop.name}

            </Text>

            <Text style={styles.sub}>

              {loop.genre} · {loop.bpm} BPM

              {loop.key ? ` · ${loop.key}` : ""}

            </Text>

          </View>

          <Pressable style={styles.playFab} onPress={play}>

            <Ionicons name={playing ? "pause" : "play"} size={22} color={colors.text} />

          </Pressable>

        </View>

        {onOpenDetails ? (

          <Pressable style={styles.detailsBtn} onPress={onOpenDetails} hitSlop={8}>

            <Text style={styles.detailsText}>{t("libraryHint")}</Text>

            <Ionicons name="chevron-forward" size={14} color={colors.textSubtle} />

          </Pressable>

        ) : null}

      </Pressable>

    </View>
  );
});



function createStyles(

  colors: ReturnType<typeof useTheme>["colors"],

  typography: ReturnType<typeof useTheme>["typography"],

  radius: ReturnType<typeof useTheme>["radius"],

) {

  return StyleSheet.create({

    wrap: { gap: spacing.sm },

    sectionLabel: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },

    card: {

      borderRadius: radius.lg,

      overflow: "hidden",

      borderWidth: StyleSheet.hairlineWidth,

      borderColor: colors.surfaceBorder,

      backgroundColor: colors.bgGlass,

    },

    art: { aspectRatio: 16 / 10, position: "relative" },

    cover: { ...StyleSheet.absoluteFillObject },

    coverLoading: { opacity: 0 },

    coverPlaceholder: {

      backgroundColor: colors.bgElevated,

      alignItems: "center",

      justifyContent: "center",

    },

    coverMark: {

      width: "22%",

      height: "22%",

      borderRadius: 999,

      backgroundColor: colors.pillActiveText,

      opacity: 0.35,

    },

    scrim: {

      ...StyleSheet.absoluteFillObject,

      backgroundColor: "rgba(13,8,16,0.55)",

    },

    waveOverlay: {

      position: "absolute",

      left: spacing.md,

      right: spacing.md,

      bottom: 88,

      opacity: 0.85,

    },

    meta: {

      position: "absolute",

      left: spacing.md,

      right: 72,

      bottom: spacing.md,

      gap: 4,

    },

    badge: {

      alignSelf: "flex-start",

      paddingHorizontal: 8,

      paddingVertical: 3,

      borderRadius: radius.pill,

      marginBottom: 4,

      backgroundColor: colors.pillActiveBg,

    },

    badgeText: { ...typography.micro, fontWeight: "700", fontSize: 10, color: colors.pillActiveText },

    title: { ...typography.title, color: colors.text, fontSize: 22, fontWeight: "700" },

    sub: { ...typography.caption, color: colors.textMuted },

    playFab: {

      position: "absolute",

      right: spacing.md,

      bottom: spacing.md,

      width: 48,

      height: 48,

      borderRadius: 24,

      alignItems: "center",

      justifyContent: "center",

      backgroundColor: colors.accentPrimary,

    },

    detailsBtn: {

      flexDirection: "row",

      alignItems: "center",

      justifyContent: "space-between",

      paddingHorizontal: spacing.md,

      paddingVertical: spacing.sm,

    },

    detailsText: { ...typography.micro, color: colors.textSubtle },

  });

}

