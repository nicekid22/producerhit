import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LoopCover } from "@/components/LoopCover";
import { SeekBar } from "@/components/SeekBar";
import { PhSurface } from "@/components/PhSurface";
import { togglePlayback, usePlayerStore } from "@/stores/playerStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Props = {
  tabBarOffset: number;
};

export function MiniPlayer({ tabBarOffset }: Props) {
  const theme = useTheme();
  const { colors, radius, typography, motion } = theme;
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const positionMs = usePlayerStore((s) => s.positionMs);
  const durationMs = usePlayerStore((s) => s.durationMs);
  const setExpanded = usePlayerStore((s) => s.setExpanded);

  const styles = useMemo(() => createStyles(colors, radius, typography), [colors, radius, typography]);

  if (!current) return null;

  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  return (
    <View style={[styles.dock, { bottom: tabBarOffset }]}>
      <PhSurface elevated style={styles.shell}>
        <Pressable style={styles.main} onPress={() => setExpanded(true)}>
          <LoopCover loop={current} size={52} rounded={radius.cover} playing={isPlaying} />
          <View style={styles.meta}>
            <Text style={styles.title} numberOfLines={1}>
              {current.name}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              {current.genre} · {current.bpm} BPM
            </Text>
            <SeekBar progress={progress} onSeek={() => setExpanded(true)} disabled={isLoading} />
          </View>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.playBtn,
            { backgroundColor: colors.accentSolid },
            pressed && { transform: [{ scale: motion.pressScale }] },
          ]}
          onPress={() => void togglePlayback()}
          disabled={isLoading}
        >
          <Ionicons
            name={isLoading ? "hourglass-outline" : isPlaying ? "pause" : "play"}
            size={20}
            color="#fff"
          />
        </Pressable>
      </PhSurface>
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  radius: ReturnType<typeof useTheme>["radius"],
  typography: ReturnType<typeof useTheme>["typography"],
) {
  return StyleSheet.create({
    dock: {
      position: "absolute",
      left: spacing.lg,
      right: spacing.lg,
    },
    shell: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.sm,
      paddingRight: spacing.md,
      gap: spacing.sm,
    },
    main: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md },
    meta: { flex: 1, minWidth: 0 },
    title: { ...typography.subtitle, color: colors.text, fontSize: 15 },
    sub: { ...typography.micro, color: colors.textMuted, marginBottom: 4 },
    playBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
