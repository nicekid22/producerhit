import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { resolveGenerationCaptionContext } from "@producerhit/shared";
import type { AppLocale } from "@producerhit/shared";
import { t } from "@/lib/i18n/catalog";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

const STORAGE_KEY = "pk.showAcePreview";

type Props = {
  locale: AppLocale;
  displayIdea: string;
  formGenre: string;
  mode: "beat" | "song";
  diceAceOverride?: string | null;
};

export function MobileAceCaptionPreview({ locale, displayIdea, formGenre, mode, diceAceOverride }: Props) {
  const { colors, typography } = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [debouncedIdea, setDebouncedIdea] = useState(displayIdea);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((v) => setEnabled(v === "1"));
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedIdea(displayIdea), 300);
    return () => clearTimeout(id);
  }, [displayIdea]);

  const caption = useMemo(() => {
    if (!enabled || !debouncedIdea.trim()) return "";
    const ctx = resolveGenerationCaptionContext({
      displayIdea: debouncedIdea,
      formGenre,
      mode,
      uiLocale: locale,
      diceAceOverride,
    });
    return ctx.captionOverride?.trim() ?? "";
  }, [enabled, debouncedIdea, formGenre, mode, locale, diceAceOverride]);

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    void AsyncStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  };

  if (!enabled) {
    return (
      <Pressable onPress={toggleEnabled} hitSlop={8}>
        <Text style={[typography.micro, { color: colors.textSubtle, marginTop: spacing.xs }]}>{t(locale, "acePreviewEnable")}</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.box, { borderColor: colors.surfaceBorder, backgroundColor: colors.bgGlass }]}>
      <Pressable onPress={() => setOpen((v) => !v)} style={styles.header}>
        <Text style={[typography.micro, { color: colors.textMuted, fontWeight: "600" }]}>{t(locale, "acePreviewTitle")}</Text>
        <Text style={{ color: colors.textSubtle }}>{open ? "−" : "+"}</Text>
      </Pressable>
      {open ? (
        <View style={[styles.body, { borderTopColor: colors.surfaceBorder }]}>
          {caption ? (
            <>
              <Text style={[typography.micro, { color: colors.text, fontFamily: "monospace", lineHeight: 16 }]}>{caption}</Text>
              <Text style={[typography.micro, { color: colors.textSubtle, marginTop: spacing.sm, lineHeight: 16 }]}>{t(locale, "acePreviewNote")}</Text>
            </>
          ) : (
            <Text style={[typography.micro, { color: colors.textSubtle, lineHeight: 16 }]}>{t(locale, "ideaPromptHint")}</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: spacing.sm, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10 },
  body: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 10 },
});
