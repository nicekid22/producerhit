import { memo, useMemo } from "react";

import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import * as Haptics from "expo-haptics";

import type { Loop } from "@producerhit/shared";

import { PlayerCoverArt } from "@/components/PlayerCoverArt";

import { PressableScale } from "@/lib/reanimated/usePressScale";

import { formatDurationMs, loopKindLabel } from "@/lib/loopDisplay";

import { togglePlayback, usePlayerStore } from "@/stores/playerStore";

import { useI18n } from "@/stores/localeStore";

import { useTheme } from "@/theme/ThemeProvider";

import { spacing } from "@/theme/tokens";



const COVER_SIZE = 36;

const PLAY_SIZE = 44;

const SHELL_HEIGHT = 72;



type Props = {

  tabBarOffset: number;

};



const MiniPlayerProgress = memo(function MiniPlayerProgress() {

  const { colors } = useTheme();

  const positionMs = usePlayerStore((s) => s.positionMs);

  const durationMs = usePlayerStore((s) => s.durationMs);

  const progress = durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;



  return (

    <View style={[progressStyles.track, { backgroundColor: colors.seekTrack }]}>

      <View

        style={[

          progressStyles.fill,

          { width: `${Math.max(progress * 100, progress > 0 ? 2 : 0)}%`, backgroundColor: colors.accentPrimary },

        ]}

      />

    </View>

  );

});



const MiniPlayerCover = memo(function MiniPlayerCover({
  loop,
  playing,
}: {
  loop: Loop;
  playing: boolean;
}) {
  return <PlayerCoverArt loop={loop} size={COVER_SIZE} borderRadius={10} playing={playing} />;
});



const MiniPlayerTime = memo(function MiniPlayerTime({ isLoading }: { isLoading: boolean }) {

  const positionMs = usePlayerStore((s) => s.positionMs);

  const durationMs = usePlayerStore((s) => s.durationMs);

  const { colors } = useTheme();



  if (durationMs <= 0) {

    return isLoading ? <Text style={[timeStyles.time, { color: colors.textSubtle }]}>…</Text> : null;

  }



  return (

    <Text style={[timeStyles.time, { color: colors.textSubtle }]} numberOfLines={1}>

      {`${formatDurationMs(positionMs)} / ${formatDurationMs(durationMs)}`}

    </Text>

  );

});



export function MiniPlayer({ tabBarOffset }: Props) {

  const { locale } = useI18n();

  const { colors, typography, elevation } = useTheme();

  const current = usePlayerStore((s) => s.current);

  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const isLoading = usePlayerStore((s) => s.isLoading);

  const setExpanded = usePlayerStore((s) => s.setExpanded);



  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);



  if (!current) return null;



  const kind = loopKindLabel(current, locale);

  const orbPlaying = isPlaying && !isLoading;



  const openFull = () => {

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setExpanded(true);

  };



  return (

    <View style={[styles.dock, { bottom: tabBarOffset }]} pointerEvents="box-none">

      <View style={[styles.shell, elevation.low]}>

        <MiniPlayerProgress />

        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBarBg }]} />

        <View style={styles.body}>

          <PressableScale style={styles.main} onPress={openFull} haptic={false}>

            <MiniPlayerCover loop={current} playing={orbPlaying} />

            <View style={styles.meta}>

              <View style={styles.titleRow}>

                <Text style={styles.title} numberOfLines={1}>

                  {current.name}

                </Text>

                <Ionicons name="chevron-up" size={14} color={colors.textSubtle} />

              </View>

              <View style={styles.subRow}>

                <View style={styles.kindPill}>

                  <Text style={[typography.micro, { color: colors.pillActiveText, fontWeight: "600" }]}>{kind}</Text>

                </View>

                <Text style={styles.sub} numberOfLines={1}>

                  {current.genre} · {current.bpm} BPM

                </Text>

              </View>

              <MiniPlayerTime isLoading={isLoading} />

            </View>

          </PressableScale>



          <PressableScale

            onPress={() => {

              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

              void togglePlayback();

            }}

            disabled={isLoading}

            haptic={false}

            style={[styles.playBtn, elevation.high]}

          >

            {isLoading ? (

              <ActivityIndicator size="small" color={colors.text} />

            ) : (

              <Ionicons

                name={isPlaying ? "pause" : "play"}

                size={22}

                color={colors.text}

                style={!isPlaying ? styles.playIconOffset : undefined}

              />

            )}

          </PressableScale>

        </View>

      </View>

    </View>

  );

}



const progressStyles = StyleSheet.create({

  track: { height: 1, width: "100%" },

  fill: { height: "100%" },

});



const timeStyles = StyleSheet.create({

  time: {

    fontSize: 11,

    fontWeight: "600",

    fontVariant: ["tabular-nums"],

    marginTop: 1,

  },

});



function createStyles(

  colors: ReturnType<typeof useTheme>["colors"],

  typography: ReturnType<typeof useTheme>["typography"],

) {

  return StyleSheet.create({

    dock: {

      position: "absolute",

      left: spacing.screen,

      right: spacing.screen,

      zIndex: 40,

    },

    shell: {

      minHeight: SHELL_HEIGHT,

      borderRadius: 16,

      overflow: "hidden",

      borderWidth: StyleSheet.hairlineWidth,

      borderColor: colors.surfaceBorder,

    },

    body: {

      flexDirection: "row",

      alignItems: "center",

      paddingLeft: spacing.sm,

      paddingRight: spacing.sm,

      paddingTop: spacing.sm,

      paddingBottom: spacing.sm,

      gap: spacing.sm,

    },

    main: {

      flex: 1,

      flexDirection: "row",

      alignItems: "center",

      gap: spacing.md,

      minWidth: 0,

    },

    meta: {

      flex: 1,

      minWidth: 0,

      justifyContent: "center",

      gap: 3,

    },

    titleRow: {

      flexDirection: "row",

      alignItems: "center",

      gap: 4,

    },

    title: {

      ...typography.subtitle,

      color: colors.text,

      fontSize: 15,

      fontWeight: "600",

      flex: 1,

    },

    subRow: {

      flexDirection: "row",

      alignItems: "center",

      gap: 6,

      minWidth: 0,

    },

    kindPill: {

      paddingHorizontal: 6,

      paddingVertical: 2,

      borderRadius: 6,

      backgroundColor: colors.pillActiveBg,

    },

    sub: {

      ...typography.micro,

      color: colors.textMuted,

      flex: 1,

    },

    waveRow: {

      marginTop: 2,

      height: 12,

      overflow: "hidden",

    },

    playBtn: {

      width: PLAY_SIZE,

      height: PLAY_SIZE,

      borderRadius: PLAY_SIZE / 2,

      alignItems: "center",

      justifyContent: "center",

      backgroundColor: colors.accentPrimary,

    },

    playIconOffset: {

      marginLeft: 2,

    },

  });

}

