import { Linking, Share, Text } from "react-native";
import * as Haptics from "expo-haptics";
import type { CommunityLoop } from "@/lib/publicLoopsApi";
import { PhBottomSheet } from "@/components/PhBottomSheet";
import { PhButton } from "@/components/PhButton";
import { PhCard } from "@/components/PhCard";
import { SheetHeroArt } from "@/components/SheetHeroArt";
import { loopKindLabel, resolveLoopCoverUrl, shareLoopUrl } from "@/lib/loopDisplay";
import { useI18n } from "@/stores/localeStore";
import { togglePlayback, usePlayerStore } from "@/stores/playerStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Props = {
  loop: CommunityLoop | null;
  visible: boolean;
  onClose: () => void;
  onPlay?: () => void;
  busy?: boolean;
};

export function PublicLoopSheet({ loop, visible, onClose, onPlay, busy }: Props) {
  const { t, locale } = useI18n();
  const { typography, colors } = useTheme();
  const current = usePlayerStore((s) => s.current);
  const storePlaying = usePlayerStore((s) => s.isPlaying);

  if (!loop) return null;

  const active = current?.id === loop.id;
  const isPlaying = active && storePlaying;
  const coverUri = resolveLoopCoverUrl(loop);
  const author = loop.authorUsername ? `@${loop.authorUsername}` : t("communityCreator");

  const share = async () => {
    const url = shareLoopUrl(loop.id);
    await Share.share({ message: `${loop.name} — ${url}`, url });
  };

  const openWeb = () => {
    void Linking.openURL(shareLoopUrl(loop.id));
  };

  const handlePlay = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (active && isPlaying) void togglePlayback();
    else onPlay?.();
  };

  return (
    <PhBottomSheet visible={visible} onClose={onClose} maxHeight="80%">
      <SheetHeroArt
        loop={loop}
        coverUri={coverUri}
        kindLabel={`${loopKindLabel(loop, locale)} · ${t("communityTag")}`}
        subtitle={`${loop.genre} · ${loop.bpm} BPM · ${author}`}
        playing={isPlaying}
        busy={busy}
        onPlay={onPlay ? handlePlay : undefined}
      />

      {loop.prompt ? (
        <PhCard>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>{t("promptLabel")}</Text>
          <Text style={[typography.body, { color: colors.textMuted, lineHeight: 22 }]}>{loop.prompt}</Text>
        </PhCard>
      ) : null}

      <PhButton label={t("shareLink")} variant="ghost" onPress={() => void share()} />
      <PhButton label={t("openOnWeb")} variant="ghost" onPress={openWeb} />
    </PhBottomSheet>
  );
}
