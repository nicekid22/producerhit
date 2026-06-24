import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import type { Loop } from "@producerhit/shared";
import { markCoverLoaded, isCoverLoaded, prefetchCoverUri } from "@/lib/coverImageCache";
import { resolveLoopCoverUrl } from "@/lib/loopDisplay";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  loop: Pick<Loop, "coverUrl" | "stemsUrl">;
  size: number;
  borderRadius?: number;
  playing?: boolean;
};

/** Cover Pollinations / ACE — mini-player & full player (pas d'orbe). */
export function PlayerCoverArt({ loop, size, borderRadius, playing = false }: Props) {
  const { colors } = useTheme();
  const uri = resolveLoopCoverUrl(loop);
  const radius = borderRadius ?? Math.round(size * 0.22);
  const [imageReady, setImageReady] = useState(() => (uri ? isCoverLoaded(uri) : false));

  useEffect(() => {
    if (!uri) {
      setImageReady(false);
      return;
    }
    if (isCoverLoaded(uri)) {
      setImageReady(true);
      return;
    }
    setImageReady(false);
    prefetchCoverUri(uri);
  }, [uri]);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderColor: playing ? colors.pillActiveText : colors.surfaceBorder,
          backgroundColor: colors.bgElevated,
        },
        playing && styles.playing,
      ]}
    >
      {uri ? (
        <>
          {!imageReady ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                styles.placeholder,
                { borderRadius: radius, backgroundColor: colors.bgElevated },
              ]}
            >
              <View style={[styles.mark, { backgroundColor: colors.pillActiveText }]} />
            </View>
          ) : null}
          <Image
            source={{ uri }}
            style={[
              { width: size, height: size, borderRadius: radius },
              !imageReady && styles.imageHidden,
            ]}
            resizeMode="cover"
            onLoad={() => {
              markCoverLoaded(uri);
              setImageReady(true);
            }}
            onError={() => setImageReady(false)}
          />
        </>
      ) : (
        <View style={[styles.placeholder, { borderRadius: radius }]}>
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
  imageHidden: {
    position: "absolute",
    opacity: 0,
  },
});
