import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { markActivationStep } from "@/components/ActivationChecklist";
import { CommunityLoopCard } from "@/components/CommunityLoopCard";
import { PublicLoopSheet } from "@/components/PublicLoopSheet";
import { GenreChips } from "@/components/GenreChips";
import { PhCard } from "@/components/PhCard";
import {
  fetchCommunityLoops,
  prepareCommunityLoopForPlayback,
  type CommunityLoop,
} from "@/lib/publicLoopsApi";
import { supabase } from "@/lib/supabase";
import { usePlayerStore } from "@/stores/playerStore";
import { useI18n } from "@/stores/localeStore";
import { useResponsiveLayout } from "@/lib/useResponsiveLayout";
import { ThemeBackdrop } from "@/components/ThemeBackdrop";
import { PhDisplay } from "@/components/PhDisplay";
import { resolveLoopCoverUrl } from "@/lib/loopDisplay";
import { fetchDisplayPinterestCover } from "@/lib/pinterestCover";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

const ALL_VALUE = "__all__";

export default function CommunityScreen() {
  const { t } = useI18n();
  const { colors, typography, radius } = useTheme();
  const { columns, contentMaxWidth, gutter, gridItemWidth, isTablet } = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    void markActivationStep("community_visit");
  }, []);
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setCurrent = usePlayerStore((s) => s.setCurrent);
  const [loops, setLoops] = useState<CommunityLoop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState(ALL_VALUE);
  const [detailLoop, setDetailLoop] = useState<CommunityLoop | null>(null);
  const [coverOverrides, setCoverOverrides] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const rows = await fetchCommunityLoops(48);
    setLoops(rows);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  useEffect(() => {
    const missing = loops.filter((l) => !resolveLoopCoverUrl(l)).slice(0, 12);
    for (const loop of missing) {
      void fetchDisplayPinterestCover(loop).then((url) => {
        if (!url) return;
        setCoverOverrides((prev) => (prev[loop.id] ? prev : { ...prev, [loop.id]: url }));
      });
    }
  }, [loops]);

  const genreOptions = useMemo(() => {
    const unique = [...new Set(loops.map((l) => l.genre).filter(Boolean))].sort();
    return [
      { group: "Filter", value: ALL_VALUE, label: t("allGenre") },
      ...unique.map((g) => ({ group: "Genre", value: g, label: g })),
    ];
  }, [loops, t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return loops.filter((l) => {
      if (genre !== ALL_VALUE && l.genre !== genre) return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.genre.toLowerCase().includes(q) ||
        (l.authorUsername ?? "").toLowerCase().includes(q)
      );
    });
  }, [loops, query, genre]);

  const playLoop = async (loop: CommunityLoop) => {
    setResolvingId(loop.id);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      const playable = await prepareCommunityLoopForPlayback(loop, token);
      if (!playable) return;
      const queue = filtered
        .map((l) => ({ ...l, audioUrl: l.audioUrl }))
        .filter((l) => l.audioUrl || l.aceTaskId);
      setCurrent(playable, queue.length ? queue : [playable]);
    } finally {
      setResolvingId(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ThemeBackdrop>
      <FlatList
        data={filtered}
        key={columns}
        numColumns={columns}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={columns > 1 ? { gap: gutter } : undefined}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: insets.top + spacing.lg,
            maxWidth: contentMaxWidth,
            alignSelf: isTablet ? "center" : undefined,
            width: isTablet ? "100%" : undefined,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <PhDisplay variant="display">{t("community")}</PhDisplay>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 6 }]}>
              {loading ? t("loading") : `${filtered.length} ${t("exploreSub")}`}
            </Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("search")}
              placeholderTextColor={colors.textSubtle}
              style={[
                styles.search,
                {
                  color: colors.text,
                  backgroundColor: colors.bgElevated,
                  borderColor: colors.surfaceBorder,
                  borderRadius: radius.lg,
                  ...typography.body,
                },
              ]}
            />
            {genreOptions.length > 1 ? (
              <GenreChips genres={genreOptions} value={genre} onChange={setGenre} />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <PhCard>
              <Text style={[typography.subtitle, { color: colors.text }]}>No public tracks yet</Text>
              <Text style={[typography.body, { color: colors.textMuted, marginTop: 8 }]}>
                Make a track public from your Library to appear here.
              </Text>
            </PhCard>
          ) : (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
          )
        }
        renderItem={({ item }) => {
          const displayLoop = coverOverrides[item.id] ? { ...item, coverUrl: coverOverrides[item.id] } : item;
          const active = current?.id === item.id;
          const playing = active && isPlaying;
          const busy = resolvingId === item.id;
          return (
            <View style={columns > 1 ? { width: gridItemWidth } : undefined}>
              <CommunityLoopCard
                loop={displayLoop}
                active={active}
                playing={playing && !busy}
                onPress={() => void playLoop(item)}
                onOpen={() => setDetailLoop(item)}
              />
            </View>
          );
        }}
      />

      <PublicLoopSheet loop={detailLoop} visible={detailLoop != null} onClose={() => setDetailLoop(null)} />
    </ThemeBackdrop>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.screen, paddingBottom: 200, gap: spacing.md },
  header: { marginBottom: spacing.lg, gap: spacing.sm, width: "100%" },
  search: {
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
