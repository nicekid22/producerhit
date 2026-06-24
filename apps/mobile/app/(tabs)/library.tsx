import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, FlatList, InteractionManager, RefreshControl, StyleSheet, Text, View, type ListRenderItem } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type Loop } from "@producerhit/shared";
import { GenrePicker } from "@/components/GenrePicker";
import { LibraryEmptyState } from "@/components/LibraryEmptyState";
import { LibraryNoResultsState } from "@/components/LibraryNoResultsState";
import { LibrarySkeletonGrid } from "@/components/LibrarySkeletonGrid";
import { NetworkErrorBanner } from "@/components/NetworkErrorBanner";
import { OfflineDataBanner } from "@/components/OfflineDataBanner";
import { LibraryFeaturedCard } from "@/components/LibraryFeaturedCard";
import { LoopDetailSheet } from "@/components/LoopDetailSheet";
import { LoopGridCard } from "@/components/LoopGridCard";
import { PhDisplay } from "@/components/PhDisplay";
import { SearchGlassField } from "@/components/SearchGlassField";
import { markActivationStep } from "@/components/ActivationChecklist";
import { t as translate } from "@/lib/i18n/catalog";
import { fetchUserLoops, subscribeUserLoops } from "@/lib/loopsApi";
import { prefetchLoopCovers } from "@/lib/coverImageCache";
import { peekLibraryMemory, readLibraryCache, writeLibraryCache } from "@/lib/offlineCache";
import { backfillMissingLoopCovers, setLoopCoverBackfillPaused } from "@/lib/loopCover";
import { useResponsiveLayout } from "@/lib/useResponsiveLayout";
import { useStaggerEntrance } from "@/lib/useStaggerEntrance";
import { usePullRefresh } from "@/lib/usePullRefresh";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "@/stores/localeStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

const ALL_GENRES = "__all__";

export default function LibraryScreen() {
  const isFocused = useIsFocused();
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const { colors, typography, radius } = useTheme();
  const { contentMaxWidth, gutter, isTablet } = useResponsiveLayout();
  const gridColumns = isTablet ? (contentMaxWidth >= 900 ? 3 : 2) : 2;
  const listPad = spacing.screen * 2;
  const cellWidth =
    gridColumns > 1
      ? (contentMaxWidth - listPad - gutter * (gridColumns - 1)) / gridColumns
      : contentMaxWidth - listPad;
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;
  const currentId = usePlayerStore((s) => s.current?.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const positionMs = usePlayerStore((s) => s.positionMs);
  const [loops, setLoops] = useState<Loop[]>(() => (userId ? peekLibraryMemory(userId) ?? [] : []));
  const [loading, setLoading] = useState(() => {
    if (!userId) return false;
    return (peekLibraryMemory(userId)?.length ?? 0) === 0;
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showingCachedData, setShowingCachedData] = useState(false);
  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState(ALL_GENRES);
  const [detailLoop, setDetailLoop] = useState<Loop | null>(null);

  const headerEntrance = useStaggerEntrance(0, { screenKey: "library" });

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setLoadError(null);
      const rows = await fetchUserLoops(userId);
      setLoops(rows);
      setShowingCachedData(false);
      await writeLibraryCache(userId, rows);
      prefetchLoopCovers(rows);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : translate(locale, "networkErrorBody"));
      setShowingCachedData(true);
      throw e;
    }
  }, [userId, locale]);

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    void markActivationStep("library_visit");
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoops([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const memory = peekLibraryMemory(userId);
    if (memory?.length) {
      setLoops(memory);
      setLoading(false);
      prefetchLoopCovers(memory);
    }

    void (async () => {
      const cached = await readLibraryCache(userId);
      if (cancelled) return;
      if (cached?.length) {
        setLoops(cached);
        setLoading(false);
        prefetchLoopCovers(cached);
      }

      if (!cached?.length && !memory?.length) setLoading(true);
      try {
        await loadRef.current();
      } catch {
        /* loadError set; cached rows kept if any */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (loops.length === 0) return;
    prefetchLoopCovers(loops);
  }, [loops]);

  useEffect(() => {
    if (!userId) return;
    return subscribeUserLoops(userId, () => {
      void loadRef.current();
    });
  }, [userId]);

  useEffect(() => {
    setLoopCoverBackfillPaused(!isFocused);
  }, [isFocused]);

  useEffect(() => {
    if (loops.length === 0 || !isFocused) return;
    const task = InteractionManager.runAfterInteractions(() => {
      backfillMissingLoopCovers(loops);
    });
    return () => task.cancel();
  }, [isFocused, loops]);

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

  const featuredLoop = filtered.length > 0 ? filtered[0] : null;
  const listData = filtered.length > 1 ? filtered.slice(1) : [];

  const { refreshing, tintColor, onRefresh } = usePullRefresh({
    onRefresh: async () => {
      await load();
    },
  });

  const openDetail = useCallback((loop: Loop) => setDetailLoop(loop), []);

  const listExtraData = useMemo(
    () => `${currentId ?? ""}:${isPlaying}`,
    [currentId, isPlaying],
  );

  const renderItem: ListRenderItem<Loop> = useCallback(
    ({ item }) => {
      const active = currentId === item.id;
      const playing = active && isPlaying;
      return (
        <View style={gridColumns > 1 ? { width: cellWidth } : { flex: 1 }}>
          <LoopGridCard
            loop={item}
            queue={filtered}
            active={active}
            playing={playing}
            positionMs={playing ? positionMs : 0}
            onLongPress={() => openDetail(item)}
            onOpenDetails={() => openDetail(item)}
          />
        </View>
      );
    },
    [cellWidth, currentId, filtered, gridColumns, isPlaying, openDetail, positionMs],
  );

  return (
    <>
    <FlatList
        data={listData}
        key={gridColumns}
        numColumns={gridColumns}
        keyExtractor={(item) => item.id}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        columnWrapperStyle={gridColumns > 1 ? { gap: gutter } : undefined}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: insets.top + spacing.lg,
            maxWidth: contentMaxWidth,
            alignSelf: isTablet ? "center" : undefined,
            width: isTablet ? "100%" : undefined,
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tintColor} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <NetworkErrorBanner
              message={loadError}
              onRetry={() => {
                void load();
              }}
            />
            <OfflineDataBanner visible={showingCachedData && loadError != null} />
            <Animated.View style={headerEntrance.style}>
              <PhDisplay variant="display">{t("library")}</PhDisplay>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 6 }]}>
                {loading ? t("loading") : `${loops.length} ${t("tracks")} · ${t("libraryHint")}`}
              </Text>
              <SearchGlassField
                value={query}
                onChangeText={setQuery}
                placeholder={t("search")}
              />
              <GenrePicker
                catalogOnly
                value={genreFilter}
                onChange={setGenreFilter}
                filterAllValue={ALL_GENRES}
                filterAllLabel={t("filterAllGenres")}
                style={styles.genrePicker}
              />
            </Animated.View>

            {featuredLoop ? (
              <View style={styles.featured}>
                <LibraryFeaturedCard
                  loop={featuredLoop}
                  queue={filtered}
                  active={currentId === featuredLoop.id}
                  playing={currentId === featuredLoop.id && isPlaying}
                  screenFocused={isFocused}
                  onOpenDetails={() => setDetailLoop(featuredLoop)}
                />
              </View>
            ) : null}

            {listData.length > 0 ? (
              <Text style={[typography.caption, styles.sectionLabel, { color: colors.textMuted }]}>
                {t("libraryRecent")}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading && loops.length === 0 ? (
            <LibrarySkeletonGrid columns={gridColumns} count={gridColumns * 2} />
          ) : !loading && filtered.length === 0 && loops.length > 0 ? (
            <LibraryNoResultsState />
          ) : !loading && loops.length === 0 ? (
            <LibraryEmptyState />
          ) : null
        }
        renderItem={renderItem}
        extraData={listExtraData}
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
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.screen, paddingBottom: 200, gap: spacing.md },
  header: { marginBottom: spacing.lg, gap: spacing.md, width: "100%" },
  genrePicker: { marginTop: spacing.md },
  featured: { marginTop: spacing.lg },
  sectionLabel: { marginTop: spacing.xl, marginBottom: spacing.xs, fontWeight: "600", letterSpacing: 0.3 },
});
