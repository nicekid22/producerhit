import { Image, StyleSheet, View } from "react-native";

import type { Loop } from "@producerhit/shared";

import { AudioReactiveOrb } from "@/components/AudioOrb";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { resolveLoopCoverUrl } from "@/lib/loopDisplay";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { DUSTY_RADIUS } from "@/theme/dustyCloud";

type Props = {
  loop: Loop;
  size?: number;
  rounded?: number;
  playing?: boolean;
  positionMs?: number;
};

export function LoopCover({
  loop,
  size = 64,
  rounded = DUSTY_RADIUS.cover,
  playing = false,
  positionMs = 0,
}: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const uri = resolveLoopCoverUrl(loop);

  const shellStyle = [
    styles.wrap,
    {
      width: size,
      height: size,
      borderRadius: rounded,
      borderColor: playing ? colors.pillActiveText : colors.surfaceBorder,
      backgroundColor: colors.bgElevated,
    },
    playing && styles.playing,
  ];

  if (playing) {
    return (
      <View style={shellStyle}>
        <SectionErrorBoundary
          label="loop-cover-orb"
          fallbackTitle={t("sectionErrorOrbTitle")}
          fallbackBody={t("sectionErrorOrbBody")}
          retryLabel={t("retry")}
        >
          <AudioReactiveOrb
            size={size}
            active
            playing
            enabled
            bpm={loop.bpm}
            positionMs={positionMs}
            energy="playing"
            glPriority="high"
          />
        </SectionErrorBoundary>
      </View>
    );
  }

  return (
    <View style={shellStyle}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: rounded }} resizeMode="cover" />
      ) : (
        <View style={[styles.placeholder, { borderRadius: rounded }]}>
          <View style={[styles.mark, { backgroundColor: colors.pillActiveText }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  playing: {
    borderWidth: 1.5,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mark: {
    width: "36%",
    height: "36%",
    borderRadius: 999,
    opacity: 0.35,
  },
});
