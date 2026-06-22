import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { MOBILE_GENRES, MOBILE_SONG_GENRES, type Loop } from "@producerhit/shared";
import { LoopCard } from "@/components/LoopCard";
import { LoopDetailSheet } from "@/components/LoopDetailSheet";
import { PhCard } from "@/components/PhCard";
import { PhDisplay } from "@/components/PhDisplay";
import { WaveformStrip } from "@/components/WaveformStrip";
import { GenreChips } from "@/components/GenreChips";
import { ThemeBackdrop } from "@/components/ThemeBackdrop";
import { markActivationStep } from "@/components/ActivationChecklist";
import { fetchUserLoops, subscribeUserLoops } from "@/lib/loopsApi";
import { backfillMissingLoopCovers } from "@/lib/pinterestCover";
import { useResponsiveLayout } from "@/lib/useResponsiveLayout";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

const ALL_GENRES = "__all__";

export default function LibraryScreen() {
  const { t } = useI18n();
  const { colors, typography, radius } = useTheme();
  const { columns, contentMaxWidth, gutter, gridItemWidth, isTablet } = useResponsiveLayout();
  const session = useAuthStore((s) => s.session);
  const [loops, setLoops] = useState<Loop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState(ALL_GENRES);
  const [detailLoop, setDetailLoop] = useState<Loop | null>(null);

  const genreOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts = [...MOBILE_SONG_GENRES, ...MOBILE_GENRES].filter((g) => {
      if (seen.has(g.value)) return false;
      seen.add(g.value);
      return true;
    });
    return [{ group: "Filter", value: ALL_GENRES, label: t("filterAllGenres") }, ...opts];
  }, [t]);

  const load = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    const rows = await fetchUserLoops(userId);
    setLoops(rows);
  }, [session?.user?.id]);

  useEffect(() => {
    void markActivationStep("library_visit");
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
    const userId = session?.user?.id;
    if (!userId) return;
    return subscribeUserLoops(userId, () => {
      void load();
    });
  }, [session?.user?.id, load]);

  useEffect(() => {
    if (loops.length > 0) backfillMissingLoopCovers(loops);
  }, [loops]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return loops.filter((l) => {
      if (genreFilter !== ALL_GENRES && l.genre !== genreFilter) return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.genre.toLowerCase().includes(q) ||
        l.prompt.toLowerCase().includes(q)
      );
    });
  }, [loops, query, genreFilter]);

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
          { maxWidth: contentMaxWidth, alignSelf: isTablet ? "center" : undefined, width: isTablet ? "100%" : undefined },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <PhDisplay variant="display">{t("library")}</PhDisplay>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 6 }]}>
              {loading ? t("loading") : `${loops.length} ${t("tracks")} · ${t("libraryHint")}`}
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
                  borderColor: colors.surfaceBorder,
                  backgroundColor: colors.bgElevated,
                  borderRadius: radius.lg,
                  ...typography.body,
                },
              ]}
            />
            <GenreChips genres={genreOptions} value={genreFilter} onChange={setGenreFilter} />
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <PhCard>
              <WaveformStrip height={40} bars={24} opacity={0.4} />
              <Text style={[typography.subtitle, { color: colors.text, marginTop: spacing.lg }]}>
                {t("libraryEmptyTitle")}
              </Text>
              <Text style={[typography.body, { color: colors.textMuted, marginTop: 8 }]}>{t("libraryEmptyBody")}</Text>
            </PhCard>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={columns > 1 ? { width: gridItemWidth } : undefined}>
            <LoopCard
              loop={item}
              queue={filtered}
              onLongPress={() => setDetailLoop(item)}
              onOpenDetails={() => setDetailLoop(item)}
            />
          </View>
        )}
      />

      <LoopDetailSheet
        loop={detailLoop}
        visible={detailLoop != null}
        onClose={() => setDetailLoop(null)}
        onUpdated={(updated) => {
          setLoops((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
          setDetailLoop(updated);
        }}
        onDeleted={(id) => {
          setLoops((prev) => prev.filter((l) => l.id !== id));
          setDetailLoop(null);
        }}
        onCreated={(created) => {
          setLoops((prev) => [created, ...prev.filter((l) => l.id !== created.id)]);
          setDetailLoop(null);
        }}
      />
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
