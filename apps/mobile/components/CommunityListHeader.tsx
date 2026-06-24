import { CommunityTrendingCard } from "@/components/CommunityTrendingCard";
import { GenrePicker } from "@/components/GenrePicker";
import { NetworkErrorBanner } from "@/components/NetworkErrorBanner";
import { OfflineDataBanner } from "@/components/OfflineDataBanner";
import { PhDisplay } from "@/components/PhDisplay";
import { SearchGlassField } from "@/components/SearchGlassField";
import type { CommunityLoop } from "@/lib/publicLoopsApi";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import { memo } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";

const ALL_VALUE = "__all__";

type Props = {
  loadError: string | null;
  playError: string | null;
  onRetryLoad: () => void;
  showingCachedData: boolean;
  headerEntranceStyle: object;
  trendingEntranceStyle: object;
  title: string;
  subtitle: string;
  query: string;
  onQueryChange: (q: string) => void;
  searchPlaceholder: string;
  genre: string;
  onGenreChange: (g: string) => void;
  trending: CommunityLoop[];
  trendingLabel: string;
  allTracksLabel: string;
  showAllTracksLabel: boolean;
  currentId?: string;
  isPlaying: boolean;
  resolvingId: string | null;
  onPlay: (loop: CommunityLoop) => void;
  onOpen: (loop: CommunityLoop) => void;
};

export const CommunityListHeader = memo(function CommunityListHeader({
  loadError,
  playError,
  onRetryLoad,
  showingCachedData,
  headerEntranceStyle,
  trendingEntranceStyle,
  title,
  subtitle,
  query,
  onQueryChange,
  searchPlaceholder,
  genre,
  onGenreChange,
  trending,
  trendingLabel,
  allTracksLabel,
  showAllTracksLabel,
  currentId,
  isPlaying,
  resolvingId,
  onPlay,
  onOpen,
}: Props) {
  const { t } = useI18n();
  const { colors, typography } = useTheme();
  const bannerMessage = playError ?? loadError;

  return (
    <View style={styles.header}>
      <NetworkErrorBanner
        message={bannerMessage}
        onRetry={() => {
          if (loadError) onRetryLoad();
        }}
      />
      <OfflineDataBanner visible={showingCachedData && loadError != null} />
      <Animated.View style={headerEntranceStyle}>
        <PhDisplay variant="display">{title}</PhDisplay>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 6 }]}>{subtitle}</Text>
        <SearchGlassField value={query} onChangeText={onQueryChange} placeholder={searchPlaceholder} />
        <GenrePicker
          catalogOnly
          value={genre}
          onChange={onGenreChange}
          filterAllValue={ALL_VALUE}
          filterAllLabel={t("filterAllGenres")}
          style={styles.genrePicker}
        />
      </Animated.View>

      {trending.length > 0 ? (
        <Animated.View style={[trendingEntranceStyle, styles.trendingBlock]}>
          <Text style={[typography.caption, styles.sectionLabel, { color: colors.textMuted }]}>{trendingLabel}</Text>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingRow}
          >
            {trending.map((item) => {
              const active = currentId === item.id;
              const playing = active && isPlaying;
              const busy = resolvingId === item.id;
              return (
                <CommunityTrendingCard
                  key={item.id}
                  loop={item}
                  active={active}
                  playing={playing && !busy}
                  busy={busy}
                  onPress={() => onPlay(item)}
                  onOpen={() => onOpen(item)}
                />
              );
            })}
          </ScrollView>
        </Animated.View>
      ) : null}

      {showAllTracksLabel ? (
        <Text style={[typography.caption, styles.sectionLabel, { color: colors.textMuted }]}>{allTracksLabel}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg, gap: spacing.md, width: "100%" },
  genrePicker: { marginTop: spacing.md },
  trendingBlock: { marginTop: spacing.lg },
  trendingRow: { gap: spacing.md, paddingVertical: spacing.sm },
  sectionLabel: { fontWeight: "600", letterSpacing: 0.3, marginTop: spacing.lg, marginBottom: spacing.xs },
});
