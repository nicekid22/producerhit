import { Image, StyleSheet, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";

import * as Haptics from "expo-haptics";

import { AnimatedWaveformStrip } from "@/components/AnimatedWaveformStrip";

import { PressableScale } from "@/lib/reanimated/usePressScale";

import type { Loop } from "@producerhit/shared";

import { useTheme } from "@/theme/ThemeProvider";

import { spacing } from "@/theme/tokens";



type LoopLike = Pick<Loop, "id" | "name" | "genre" | "bpm"> & {

  coverUrl?: string | null;

  stemsUrl?: Loop["stemsUrl"];

};



type Props = {

  loop: LoopLike;

  coverUri?: string | null;

  kindLabel: string;

  subtitle?: string;

  playing?: boolean;

  busy?: boolean;

  onPlay?: () => void;

};



export function SheetHeroArt({ loop, coverUri, kindLabel, subtitle, playing, busy, onPlay }: Props) {

  const { colors, typography, radius } = useTheme();



  const handlePlay = () => {

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    onPlay?.();

  };



  return (

    <View style={[styles.wrap, { borderColor: colors.surfaceBorder, borderRadius: radius.lg }]}>

      {coverUri ? (

        <Image source={{ uri: coverUri }} style={[styles.cover, { borderRadius: radius.lg }]} resizeMode="cover" />

      ) : (

        <View style={[styles.cover, styles.coverFallback, { borderRadius: radius.lg, backgroundColor: colors.bgElevated }]}>

          <View style={[styles.coverMark, { backgroundColor: colors.pillActiveText }]} />

        </View>

      )}

      <LinearGradient colors={["transparent", "rgba(13,8,16,0.82)"]} style={StyleSheet.absoluteFill} />

      {playing ? (

        <View style={styles.wave}>

          <AnimatedWaveformStrip height={24} bars={30} opacity={0.9} active />

        </View>

      ) : null}

      <View style={styles.meta}>

        <View style={[styles.kindPill, { backgroundColor: colors.pillActiveBg, borderRadius: radius.pill }]}>

          <Text style={[typography.micro, { color: colors.pillActiveText, fontWeight: "700" }]}>{kindLabel}</Text>

        </View>

        <Text style={[typography.title, styles.title, { color: colors.text }]} numberOfLines={2}>

          {loop.name}

        </Text>

        <Text style={[typography.caption, styles.sub, { color: colors.textMuted }]} numberOfLines={1}>

          {subtitle ?? `${loop.genre} · ${loop.bpm} BPM`}

        </Text>

      </View>

      {onPlay ? (

        <PressableScale

          style={[styles.fab, { backgroundColor: colors.accentPrimary }]}

          onPress={handlePlay}

          disabled={busy}

        >

          <Ionicons name={busy ? "hourglass-outline" : playing ? "pause" : "play"} size={22} color={colors.text} />

        </PressableScale>

      ) : null}

    </View>

  );

}



const styles = StyleSheet.create({

  wrap: {

    aspectRatio: 16 / 10,

    overflow: "hidden",

    marginBottom: spacing.sm,

    position: "relative",

    borderWidth: StyleSheet.hairlineWidth,

  },

  cover: { width: "100%", height: "100%" },

  coverFallback: { alignItems: "center", justifyContent: "center" },

  coverMark: { width: 64, height: 64, borderRadius: 32, opacity: 0.35 },

  wave: { position: "absolute", left: spacing.md, right: spacing.md, bottom: 72 },

  meta: { position: "absolute", left: spacing.md, right: 64, bottom: spacing.md, gap: 4 },

  kindPill: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3 },

  title: { fontSize: 20, fontWeight: "700", marginTop: 2 },

  sub: {},

  fab: {

    position: "absolute",

    right: spacing.md,

    bottom: spacing.md,

    width: 48,

    height: 48,

    borderRadius: 24,

    alignItems: "center",

    justifyContent: "center",

  },

});

