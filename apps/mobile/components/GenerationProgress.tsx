import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import type { GenerationJobStatus } from "@producerhit/shared";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  progress: number;
  label?: string;
  done?: boolean;
  status?: GenerationJobStatus;
};

const SIZE = 88;
const STROKE = 4;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export function GenerationProgress({ progress, label, done, status }: Props) {
  const { t } = useI18n();
  const { colors, typography } = useTheme();
  const hapticFired = useRef(false);
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  const offset = CIRC - (CIRC * pct) / 100;

  useEffect(() => {
    if (done && !hapticFired.current) {
      hapticFired.current = true;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [done]);

  const displayLabel = done ? t("statusReady") : (label ?? t("generating"));
  const statusHint =
    status === "pending"
      ? t("genInQueue")
      : status === "running"
        ? t("genAceStep")
        : status === "failed"
          ? t("genError")
          : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.ringOuter}>
        <Svg width={SIZE} height={SIZE} style={styles.svg}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={colors.seekTrack}
            strokeWidth={STROKE}
            fill={colors.pillActiveBg}
          />
          {!done ? (
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={colors.accent}
              strokeWidth={STROKE}
              fill="transparent"
              strokeDasharray={`${CIRC} ${CIRC}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              rotation={-90}
              origin={`${SIZE / 2}, ${SIZE / 2}`}
            />
          ) : null}
        </Svg>
        <View style={styles.center}>
          {done ? (
            <Text style={[typography.title, { color: colors.success, fontWeight: "700" }]}>✓</Text>
          ) : (
            <Text style={[typography.subtitle, { color: colors.text, fontWeight: "600" }]}>{pct}%</Text>
          )}
        </View>
      </View>
      <Text style={[typography.subtitle, { color: colors.text }]}>{displayLabel}</Text>
      {statusHint && !done ? (
        <Text style={[typography.caption, { color: colors.textMuted }]}>{statusHint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 8, paddingVertical: 24 },
  ringOuter: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  svg: { position: "absolute" },
  center: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
});
