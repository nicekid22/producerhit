import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LoopCover } from "@/components/LoopCover";
import { SeekBar } from "@/components/SeekBar";
import { formatDurationMs } from "@/lib/loopDisplay";
import { seekPlayback, togglePlayback, usePlayerStore } from "@/stores/playerStore";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

export function FullPlayerSheet() {
  const { t } = useI18n();
  const { colors, typography, radius, motion } = useTheme();
  const insets = useSafeAreaInsets();
  const current = usePlayerStore((s) => s.current);
  const expanded = usePlayerStore((s) => s.expanded);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const positionMs = usePlayerStore((s) => s.positionMs);
  const durationMs = usePlayerStore((s) => s.durationMs);
  const setExpanded = usePlayerStore((s) => s.setExpanded);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrev = usePlayerStore((s) => s.playPrev);
  const queue = usePlayerStore((s) => s.queue);

  if (!current) return null;

  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const hasQueue = queue.length > 1;

  const close = () => setExpanded(false);

  const seek = (ratio: number) => {
    if (durationMs <= 0) return;
    void seekPlayback(Math.floor(ratio * durationMs));
  };

  return (
    <Modal visible={expanded} animationType="slide" onRequestClose={close}>
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={close} hitSlop={12}>
            <Ionicons name="chevron-down" size={28} color={colors.textMuted} />
          </Pressable>
          <Text style={[typography.caption, { color: colors.textSubtle, letterSpacing: 0.6 }]}>
            {t("nowPlaying")}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.artWrap}>
          <LoopCover loop={current} size={280} rounded={radius.xl} />
        </View>

        <View style={styles.meta}>
          <Text style={[typography.title, { color: colors.text, textAlign: "center" }]} numberOfLines={2}>
            {current.name}
          </Text>
          <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm, textAlign: "center" }]}>
            {current.genre} · {current.bpm} BPM
          </Text>
        </View>

        <View style={styles.seekWrap}>
          <SeekBar progress={progress} onSeek={seek} disabled={isLoading || durationMs <= 0} />
          <View style={styles.timeRow}>
            <Text style={[typography.micro, { color: colors.textSubtle }]}>{formatDurationMs(positionMs)}</Text>
            <Text style={[typography.micro, { color: colors.textSubtle }]}>{formatDurationMs(durationMs)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable
            style={[styles.sideBtn, { backgroundColor: colors.surfaceBorder }, !hasQueue && styles.sideBtnDisabled]}
            disabled={!hasQueue}
            onPress={() => {
              void Haptics.selectionAsync();
              playPrev();
            }}
          >
            <Ionicons name="play-skip-back" size={22} color={colors.text} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.mainBtn,
              { backgroundColor: colors.accentSolid },
              pressed && { transform: [{ scale: motion.pressScale }] },
            ]}
            disabled={isLoading}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              void togglePlayback();
            }}
          >
            <Ionicons
              name={isLoading ? "hourglass-outline" : isPlaying ? "pause" : "play"}
              size={28}
              color="#fff"
            />
          </Pressable>

          <Pressable
            style={[styles.sideBtn, { backgroundColor: colors.surfaceBorder }, !hasQueue && styles.sideBtnDisabled]}
            disabled={!hasQueue}
            onPress={() => {
              void Haptics.selectionAsync();
              playNext();
            }}
          >
            <Ionicons name="play-skip-forward" size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: spacing.lg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  artWrap: { alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.xxl },
  meta: { alignItems: "center", paddingHorizontal: spacing.md },
  seekWrap: { marginTop: spacing.xxl, paddingHorizontal: spacing.sm },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
    marginTop: spacing.xxl,
  },
  sideBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  sideBtnDisabled: { opacity: 0.35 },
  mainBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
