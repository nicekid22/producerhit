import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {

  Animated,

  FlatList,
  InteractionManager,
  RefreshControl,

  StyleSheet,

  View,

  type ListRenderItem,

  type ViewToken,

} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { isHttpAudioUrl } from "@producerhit/shared";

import * as Haptics from "expo-haptics";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { markActivationStep } from "@/components/ActivationChecklist";

import { CommunityGridCard } from "@/components/CommunityGridCard";

import { CommunityEmptyState } from "@/components/CommunityEmptyState";

import { CommunityListHeader } from "@/components/CommunityListHeader";

import { CommunityNoResultsState } from "@/components/CommunityNoResultsState";

import { LibrarySkeletonGrid } from "@/components/LibrarySkeletonGrid";

import { PublicLoopSheet } from "@/components/PublicLoopSheet";

import { enqueueDisplayCover, scheduleDisplayCovers, setDisplayCoverQueuePaused } from "@/lib/displayCoverQueue";

import {

  fetchCommunityLoopById,

  fetchCommunityLoops,

  prepareCommunityLoopForPlayback,

  type CommunityLoop,

} from "@/lib/publicLoopsApi";

import { usePullRefresh } from "@/lib/usePullRefresh";

import { readCommunityCache, writeCommunityCache } from "@/lib/offlineCache";

import { supabase } from "@/lib/supabase";

import { usePlayerStore } from "@/stores/playerStore";

import { useI18n } from "@/stores/localeStore";

import { useResponsiveLayout } from "@/lib/useResponsiveLayout";

import { useStaggerEntrance } from "@/lib/useStaggerEntrance";

import { useTheme } from "@/theme/ThemeProvider";

import { useDeepLinkStore } from "@/stores/deepLinkStore";

import { spacing } from "@/theme/tokens";



const ALL_VALUE = "__all__";

const TRENDING_COUNT = 8;



function buildPlaybackQueue(playable: CommunityLoop, list: CommunityLoop[]): CommunityLoop[] {

  const withDirectUrl = list.filter((l) => l.audioUrl && isHttpAudioUrl(l.audioUrl));

  if (withDirectUrl.some((l) => l.id === playable.id)) {

    return withDirectUrl.map((l) => (l.id === playable.id ? playable : l));

  }

  return [playable, ...withDirectUrl];

}



export default function CommunityScreen() {
  const isFocused = useIsFocused();
  const isFocusedRef = useRef(isFocused);
  isFocusedRef.current = isFocused;

  const { t } = useI18n();

  const { colors } = useTheme();

  const { contentMaxWidth, gutter, isTablet } = useResponsiveLayout();

  const gridColumns = isTablet ? (contentMaxWidth >= 900 ? 3 : 2) : 2;

  const listPad = spacing.screen * 2;

  const cellWidth =

    gridColumns > 1

      ? (contentMaxWidth - listPad - gutter * (gridColumns - 1)) / gridColumns

      : contentMaxWidth - listPad;

  const insets = useSafeAreaInsets();

  const headerEntrance = useStaggerEntrance(0, { screenKey: "community" });
  const trendingEntrance = useStaggerEntrance(80, { screenKey: "community" });



  useEffect(() => {
    setDisplayCoverQueuePaused(!isFocused);
  }, [isFocused]);

  useEffect(() => {

    void markActivationStep("community_visit");

  }, []);



  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const current = usePlayerStore((s) => s.current);
  const positionMs = usePlayerStore((s) => s.positionMs);
  const setCurrent = usePlayerStore((s) => s.setCurrent);

  const [loops, setLoops] = useState<CommunityLoop[]>([]);

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [playError, setPlayError] = useState<string | null>(null);

  const [showingCachedData, setShowingCachedData] = useState(false);

  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  const [genre, setGenre] = useState(ALL_VALUE);

  const [detailLoop, setDetailLoop] = useState<CommunityLoop | null>(null);

  const [coverOverrides, setCoverOverrides] = useState<Record<string, string>>({});



  const onCoverUrl = useCallback((loopId: string, url: string) => {

    setCoverOverrides((prev) => (prev[loopId] ? prev : { ...prev, [loopId]: url }));

  }, []);



  const load = useCallback(async () => {

    try {

      setLoadError(null);

      const rows = await fetchCommunityLoops(48);

      setLoops(rows);

      setShowingCachedData(false);

      await writeCommunityCache(rows);

    } catch (e) {

      setLoadError(e instanceof Error ? e.message : t("networkErrorBody"));

      setShowingCachedData(true);

      throw e;

    }

  }, [t]);



  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      void (async () => {
        const cached = await readCommunityCache();
        if (cached?.length) {
          setLoops(cached);
        }

        setLoading(!cached?.length);
        try {
          await load();
        } catch {
          /* loadError set; cached rows kept if any */
        } finally {
          setLoading(false);
        }
      })();
    });
    return () => task.cancel();
  }, [load]);



  const pendingLoopId = useDeepLinkStore((s) => s.pendingLoopId);

  const consumePendingLoopId = useDeepLinkStore((s) => s.consumePendingLoopId);



  useEffect(() => {

    if (!pendingLoopId) return;

    const id = consumePendingLoopId();

    if (!id) return;

    void (async () => {

      try {

        const loop = await fetchCommunityLoopById(id);

        if (loop) setDetailLoop(loop);

      } catch {

        setLoadError(t("networkErrorBody"));

      }

    })();

  }, [pendingLoopId, consumePendingLoopId, t]);



  const withCovers = useMemo(

    () => loops.map((l) => (coverOverrides[l.id] ? { ...l, coverUrl: coverOverrides[l.id] } : l)),

    [loops, coverOverrides],

  );



  const filtered = useMemo(() => {

    const q = query.trim().toLowerCase();

    return withCovers.filter((l) => {

      if (genre !== ALL_VALUE && l.genre !== genre) return false;

      if (!q) return true;

      return (

        l.name.toLowerCase().includes(q) ||

        l.genre.toLowerCase().includes(q) ||

        (l.authorUsername ?? "").toLowerCase().includes(q)

      );

    });

  }, [withCovers, query, genre]);



  const trending = useMemo(() => filtered.slice(0, TRENDING_COUNT), [filtered]);



  useEffect(() => {
    if (!isFocused || trending.length === 0) return;
    scheduleDisplayCovers(trending, onCoverUrl);
  }, [isFocused, trending, onCoverUrl]);



  const playLoop = useCallback(

    async (loop: CommunityLoop) => {

      setPlayError(null);

      setResolvingId(loop.id);

      try {

        const {

          data: { session },

        } = await supabase.auth.getSession();

        const token = session?.access_token ?? "";

        const needsAce = !loop.audioUrl && Boolean(loop.aceTaskId);



        if (needsAce && !token) {

          setPlayError(t("communityLoginRequired"));

          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

          return;

        }



        const playable = await prepareCommunityLoopForPlayback(loop, token);

        if (!playable?.audioUrl) {

          setPlayError(t("communityPlayFailed"));

          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

          return;

        }



        const queue = buildPlaybackQueue(playable, filtered);

        setCurrent(playable, queue);

      } catch (e) {

        setPlayError(e instanceof Error ? e.message : t("communityPlayFailed"));

        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      } finally {

        setResolvingId(null);

      }

    },

    [filtered, setCurrent, t],

  );



  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<CommunityLoop>[] }) => {
    if (!isFocusedRef.current) return;

    const visible = viewableItems

      .map((v) => v.item)

      .filter((item): item is CommunityLoop => item != null);

    for (const loop of visible) {

      enqueueDisplayCover(loop, onCoverUrl);

    }

  }).current;



  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 40, minimumViewTime: 200 }).current;



  const { refreshing, tintColor, onRefresh } = usePullRefresh({

    onRefresh: async () => {

      await load();

    },

  });



  const openDetail = useCallback((loop: CommunityLoop) => setDetailLoop(loop), []);



  const renderItem: ListRenderItem<CommunityLoop> = useCallback(

    ({ item }) => {

      const active = current?.id === item.id;

      const playing = active && isPlaying;

      const busy = resolvingId === item.id;

      return (

        <View style={gridColumns > 1 ? { width: cellWidth } : { flex: 1 }}>

          <CommunityGridCard

            loop={item}

            active={active}

            playing={playing && !busy}

            positionMs={playing && !busy ? positionMs : 0}

            onPress={() => void playLoop(item)}

            onOpen={() => openDetail(item)}

            busy={busy}

          />

        </View>

      );

    },

    [cellWidth, current?.id, gridColumns, isPlaying, openDetail, playLoop, positionMs, resolvingId],

  );

  const listExtraData = useMemo(
    () => `${current?.id ?? ""}:${isPlaying}:${resolvingId ?? ""}`,
    [current?.id, isPlaying, resolvingId],
  );

  const listHeader = useMemo(

    () => (

      <CommunityListHeader

        loadError={loadError}

        playError={playError}

        onRetryLoad={() => {

          void load();

        }}

        showingCachedData={showingCachedData}

        headerEntranceStyle={headerEntrance.style}

        trendingEntranceStyle={trendingEntrance.style}

        title={t("community")}

        subtitle={loading ? t("loading") : `${filtered.length} ${t("exploreSub")}`}

        query={query}

        onQueryChange={setQuery}

        searchPlaceholder={t("search")}

        genre={genre}

        onGenreChange={setGenre}

        trending={trending}

        trendingLabel={t("communityTrending")}

        allTracksLabel={t("communityAllTracks")}

        showAllTracksLabel={filtered.length > 0}

        currentId={current?.id}

        isPlaying={isPlaying}

        resolvingId={resolvingId}

        onPlay={(loop) => void playLoop(loop)}

        onOpen={openDetail}

      />

    ),

    [

      current?.id,

      filtered.length,

      genre,

      headerEntrance.style,

      isPlaying,

      load,

      loadError,

      loading,

      playError,

      playLoop,

      openDetail,

      query,

      resolvingId,

      showingCachedData,

      t,

      trending,

      trendingEntrance.style,

    ],

  );



  return (

    <>

      <FlatList

        data={filtered}

        key={gridColumns}

        numColumns={gridColumns}

        keyExtractor={(item) => item.id}

        removeClippedSubviews

        initialNumToRender={8}

        maxToRenderPerBatch={6}

        windowSize={7}
        updateCellsBatchingPeriod={50}

        onViewableItemsChanged={onViewableItemsChanged}

        viewabilityConfig={viewabilityConfig}

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

        ListHeaderComponent={listHeader}

        ListEmptyComponent={

          loading && loops.length === 0 ? (

            <LibrarySkeletonGrid columns={gridColumns} count={gridColumns * 2} />

          ) : !loading && filtered.length === 0 && loops.length > 0 ? (

            <CommunityNoResultsState />

          ) : !loading && loops.length === 0 ? (

            <CommunityEmptyState />

          ) : null

        }

        renderItem={renderItem}
        extraData={listExtraData}

      />



      <PublicLoopSheet

        loop={detailLoop}

        visible={detailLoop != null}

        onClose={() => setDetailLoop(null)}

        onPlay={detailLoop ? () => void playLoop(detailLoop) : undefined}

        busy={detailLoop != null && resolvingId === detailLoop.id}

      />

    </>

  );

}



const styles = StyleSheet.create({

  list: { padding: spacing.screen, paddingBottom: 200, gap: spacing.md },

});


