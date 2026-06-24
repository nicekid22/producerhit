import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { isHttpAudioUrl } from "@producerhit/shared";
import { PhCard } from "@/components/PhCard";
import {
  ONBOARDING_PREVIEW_FALLBACK,
  ONBOARDING_PREVIEW_LOOP_ID,
} from "@/lib/onboardingPreview";
import { fetchCommunityLoopById, fetchCommunityLoops } from "@/lib/publicLoopsApi";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type PreviewMeta = {
  title: string;
  genre: string;
  audioUrl: string;
};

type Props = {
  active?: boolean;
};

export const OnboardingPreviewCard = memo(function OnboardingPreviewCard({ active = true }: Props) {
  const { t } = useI18n();
  const { colors, typography, radius } = useTheme();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [meta, setMeta] = useState<PreviewMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [offline, setOffline] = useState(false);

  const unload = useCallback(async () => {
    const sound = soundRef.current;
    soundRef.current = null;
    if (sound) await sound.unloadAsync().catch(() => undefined);
    setPlaying(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setOffline(false);
      try {
        let loop = await fetchCommunityLoopById(ONBOARDING_PREVIEW_LOOP_ID);
        if (!loop?.audioUrl || !isHttpAudioUrl(loop.audioUrl)) {
          const rows = await fetchCommunityLoops(6);
          loop = rows.find((r) => isHttpAudioUrl(r.audioUrl)) ?? rows[0] ?? null;
        }
        if (cancelled) return;
        if (!loop?.audioUrl || !isHttpAudioUrl(loop.audioUrl)) {
          setOffline(true);
          return;
        }
        setMeta({
          title: loop.name?.trim() || ONBOARDING_PREVIEW_FALLBACK.title,
          genre: loop.genre?.trim() || ONBOARDING_PREVIEW_FALLBACK.genre,
          audioUrl: loop.audioUrl,
        });
      } catch {
        if (!cancelled) setOffline(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      void unload();
    };
  }, [unload]);

  useEffect(() => {
    if (!active) void unload();
  }, [active, unload]);

  const toggle = async () => {
    if (!meta || loading || offline) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (playing && soundRef.current) {
      await soundRef.current.pauseAsync();
      setPlaying(false);
      return;
    }

    try {
      if (!soundRef.current) {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri: meta.audioUrl },
          { shouldPlay: true, progressUpdateIntervalMillis: 400 },
        );
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            void unload();
          } else {
            setPlaying(status.isPlaying);
          }
        });
        setPlaying(true);
        return;
      }
      await soundRef.current.playAsync();
      setPlaying(true);
    } catch {
      setOffline(true);
      setMeta(null);
      await unload();
    }
  };

  const title = meta?.title ?? ONBOARDING_PREVIEW_FALLBACK.title;
  const genre = meta?.genre ?? ONBOARDING_PREVIEW_FALLBACK.genre;
  const canPlay = Boolean(meta) && !offline && !loading;

  return (
    <PhCard elevated={false} style={[styles.card, { borderRadius: radius.lg }]}>
      <Pressable
        onPress={() => void toggle()}
        disabled={!canPlay}
        style={({ pressed }) => [styles.row, pressed && canPlay && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityLabel={offline ? t("onbPreviewOffline") : t("onbPreviewPlay")}
      >
        <View
          style={[
            styles.playBtn,
            {
              backgroundColor: offline ? colors.bgGlass : colors.accentPrimary,
              borderRadius: radius.pill,
              borderWidth: offline ? StyleSheet.hairlineWidth : 0,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.accentPrimary} size="small" />
          ) : offline ? (
            <Ionicons name="cloud-offline-outline" size={20} color={colors.textMuted} />
          ) : (
            <Ionicons name={playing ? "pause" : "play"} size={18} color={colors.accentOnPrimary} />
          )}
        </View>
        <View style={styles.copy}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>{t("onbPreviewKicker")}</Text>
          <Text style={[typography.body, { color: colors.text, fontWeight: "600" }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[typography.micro, { color: colors.textSubtle, marginTop: 2 }]} numberOfLines={offline ? 2 : 1}>
            {offline ? t("onbPreviewOffline") : genre}
          </Text>
        </View>
        <Ionicons
          name={offline ? "wifi-outline" : "headset-outline"}
          size={20}
          color={offline ? colors.textSubtle : colors.pillActiveText}
        />
      </Pressable>
    </PhCard>
  );
});

const styles = StyleSheet.create({
  card: { padding: 0, width: "100%" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  playBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1 },
});
