import { memo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Loop } from "@producerhit/shared";
import { PlayerCoverArt } from "@/components/PlayerCoverArt";
import { ThemeBackdrop } from "@/components/ThemeBackdrop";
import { WaveformSeekBar } from "@/components/WaveformSeekBar";
import { PressableScale } from "@/lib/reanimated/usePressScale";
import { formatDurationMs } from "@/lib/loopDisplay";
import { seekPlayback, togglePlayback, usePlayerStore } from "@/stores/playerStore";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

const COVER_SIZE = 280;
const PLAY_SIZE = 64;

export function FullPlayerSheet() {
  const current = usePlayerStore((s) => s.current);
  const expanded = usePlayerStore((s) => s.expanded);
  if (!current) return null;

  const close = () => usePlayerStore.getState().setExpanded(false);

  return (
    <Modal visible={expanded} animationType="fade" transparent={false} onRequestClose={close}>
      <GestureHandlerRootView style={styles.modalRoot}>
        {expanded ? <FullPlayerSheetBody current={current} /> : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

const FullPlayerSheetBody = memo(function FullPlayerSheetBody({ current }: { current: Loop }) {
  const { t } = useI18n();
  const { colors, typography, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const positionMs = usePlayerStore((s) => s.positionMs);
  const durationMs = usePlayerStore((s) => s.durationMs);
  const setExpanded = usePlayerStore((s) => s.setExpanded);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrev = usePlayerStore((s) => s.playPrev);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);

  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const hasQueue = queue.length > 1;
  const close = () => setExpanded(false);
  const orbPlaying = isPlaying && !isLoading;

  const seek = (ratio: number) => {
    if (durationMs <= 0) return;
    void seekPlayback(Math.floor(ratio * durationMs));
  };

  return (
    <ThemeBackdrop>
      <Animated.View entering={FadeIn.duration(280)} style={styles.screen}>
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              close();
            }}
            style={styles.iconBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close player"
          >
            <Ionicons name="chevron-down" size={26} color={colors.textMuted} />
          </Pressable>
          <Text style={[typography.caption, { color: colors.textSubtle }]}>
            {hasQueue ? `${t("nowPlaying")} · ${queueIndex + 1}/${queue.length}` : t("nowPlaying")}
          </Text>
          <View style={styles.iconBtn} />
        </View>

        <Animated.View entering={FadeInDown.duration(420).delay(80)} style={styles.artWrap}>
          <PlayerCoverArt
            loop={current}
            size={COVER_SIZE}
            borderRadius={24}
            playing={orbPlaying}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(380).delay(140)} style={styles.meta}>
          <Text
            style={[typography.title, { color: colors.text, textAlign: "center", fontSize: 26, fontWeight: "700" }]}
            numberOfLines={2}
          >
            {current.name}
          </Text>
          <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm, textAlign: "center" }]}>
            {current.genre} · {current.bpm} BPM
          </Text>
        </Animated.View>

        <View style={styles.seekWrap}>
          <WaveformSeekBar
            progress={progress}
            onSeek={seek}
            disabled={isLoading || durationMs <= 0}
            height={48}
          />
          <View style={styles.timeRow}>
            <Text style={[typography.mono, { color: colors.textSubtle }]}>{formatDurationMs(positionMs)}</Text>
            <Text style={[typography.mono, { color: colors.textSubtle }]}>{formatDurationMs(durationMs)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <PressableScale
            style={[styles.sideBtn, !hasQueue && styles.sideBtnDisabled]}
            disabled={!hasQueue}
            onPress={() => {
              void Haptics.selectionAsync();
              playPrev();
            }}
            haptic
          >
            <Ionicons name="play-skip-back" size={22} color={colors.text} />
          </PressableScale>

          <PressableScale
            style={[styles.mainBtn, { backgroundColor: colors.accentPrimary }, elevation.high]}
            disabled={isLoading}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              void togglePlayback();
            }}
            haptic={false}
          >
            <Ionicons
              name={isLoading ? "hourglass-outline" : isPlaying ? "pause" : "play"}
              size={30}
              color={colors.text}
              style={!isPlaying && !isLoading ? { marginLeft: 3 } : undefined}
            />
          </PressableScale>

          <PressableScale
            style={[styles.sideBtn, !hasQueue && styles.sideBtnDisabled]}
            disabled={!hasQueue}
            onPress={() => {
              void Haptics.selectionAsync();
              playNext();
            }}
            haptic
          >
            <Ionicons name="play-skip-forward" size={22} color={colors.text} />
          </PressableScale>
        </View>
      </Animated.View>
    </ThemeBackdrop>
  );
});

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
  screen: { flex: 1, paddingHorizontal: spacing.screen },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    zIndex: 20,
    elevation: 20,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  artWrap: { alignItems: "center", marginTop: spacing.md, marginBottom: spacing.xl },
  meta: { alignItems: "center", paddingHorizontal: spacing.md },
  seekWrap: { marginTop: spacing.xl, paddingHorizontal: spacing.xs },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
    marginTop: spacing.xxl,
  },
  sideBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sideBtnDisabled: { opacity: 0.35 },
  mainBtn: {
    width: PLAY_SIZE,
    height: PLAY_SIZE,
    borderRadius: PLAY_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
