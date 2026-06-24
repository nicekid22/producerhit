import { memo, useEffect, useState } from "react";
import { InteractionManager, Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { PhCard } from "@/components/PhCard";
import { PressableScale } from "@/lib/reanimated/usePressScale";
import { readLastPlayed, type LastPlayedSnapshot } from "@/lib/lastPlayedCache";
import { fetchUserLoopById } from "@/lib/loopsApi";
import { fetchCommunityLoopById, prepareCommunityLoopForPlayback } from "@/lib/publicLoopsApi";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "@/stores/localeStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

export const ContinueListeningCard = memo(function ContinueListeningCard() {
  const { t } = useI18n();
  const { colors, typography, radius } = useTheme();
  const session = useAuthStore((s) => s.session);
  const [snapshot, setSnapshot] = useState<LastPlayedSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      void readLastPlayed().then(setSnapshot);
    });
    return () => task.cancel();
  }, []);

  if (!snapshot) return null;

  const resume = async () => {
    setLoading(true);
    try {
      const userId = session?.user?.id;
      let loop = userId ? await fetchUserLoopById(userId, snapshot.id) : null;

      if (!loop) {
        const community = await fetchCommunityLoopById(snapshot.id);
        if (community) {
          const {
            data: { session: authSession },
          } = await supabase.auth.getSession();
          loop = await prepareCommunityLoopForPlayback(community, authSession?.access_token ?? "");
        }
      }

      if (!loop) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const { setCurrent, setExpanded } = usePlayerStore.getState();
      setCurrent(loop);
      setExpanded(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PhCard variant="active">
      <Text style={[typography.caption, { color: colors.pillActiveText, fontWeight: "600" }]}>
        {t("continueListening")}
      </Text>
      <PressableScale
        onPress={() => void resume()}
        disabled={loading}
        style={styles.row}
      >
        {snapshot.coverUrl ? (
          <Image source={{ uri: snapshot.coverUrl }} style={[styles.cover, { borderRadius: radius.md }]} />
        ) : (
          <View style={[styles.cover, { backgroundColor: colors.pillActiveBg, borderRadius: radius.md }]} />
        )}
        <View style={styles.meta}>
          <Text style={[typography.subtitle, { color: colors.text, fontSize: 15 }]} numberOfLines={1}>
            {snapshot.name}
          </Text>
          <Text style={[typography.micro, { color: colors.textMuted }]} numberOfLines={1}>
            {snapshot.genre} · {snapshot.bpm} BPM
          </Text>
        </View>
        <View style={[styles.playChip, { backgroundColor: colors.accentPrimary }]}>
          <Ionicons name={loading ? "hourglass-outline" : "play"} size={16} color={colors.text} />
        </View>
      </PressableScale>
    </PhCard>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.md },
  cover: { width: 52, height: 52 },
  meta: { flex: 1, minWidth: 0 },
  playChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
