import { useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import type { Loop } from "@producerhit/shared";
import {
  buildCoverPromptSuggestionsFromLoop,
  buildStructuredCoverPrompt,
  buildCoverGenerationSeed,
  pickCoverSurpriseSuggestion,
  withCoverCacheBust,
  suggestDistributionGenre,
} from "@producerhit/shared";
import { PhBottomSheet } from "@/components/PhBottomSheet";
import { PhButton } from "@/components/PhButton";
import { PhTextField } from "@/components/PhTextField";
import { acceptDistributionTerms, recordDistributionPackExport } from "@/lib/distributionApi";
import { buildAndShareDistributionPack } from "@/lib/distributionPack";
import { canDistribute } from "@/lib/planEntitlements";
import { paywallHref } from "@/lib/iapCatalog";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

type Props = {
  loop: Loop | null;
  visible: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
};

export function DistributionSubmitSheet({ loop, visible, onClose, onSubmitted }: Props) {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const locale = useLocaleStore((s) => s.locale);
  const { colors, typography } = useTheme();
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [genreName, setGenreName] = useState("");
  const [coverPrompt, setCoverPrompt] = useState("");
  const [coverUrlOverride, setCoverUrlOverride] = useState<string | null>(null);
  const [coverApproved, setCoverApproved] = useState(false);
  const [genAttempt, setGenAttempt] = useState(0);
  const [coverPreviewSeed, setCoverPreviewSeed] = useState(0);
  const [explicit, setExplicit] = useState(false);
  const [acceptRights, setAcceptRights] = useState(false);
  const [acceptAi, setAcceptAi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);

  useEffect(() => {
    if (!loop || !visible) return;
    setTitle(loop.name);
    setArtistName(profile?.username?.trim() ?? "");
    setGenreName(suggestDistributionGenre(loop.genre));
    const suggestion = buildCoverPromptSuggestionsFromLoop(loop)[0];
    setCoverPrompt(suggestion ? buildStructuredCoverPrompt(suggestion) : loop.prompt?.trim() ?? "");
    setCoverUrlOverride(null);
    setCoverApproved(false);
    setGenAttempt(0);
    setCoverPreviewSeed(0);
    setAcceptRights(false);
    setAcceptAi(false);
  }, [loop?.id, visible, profile?.username, loop]);

  if (!loop) return null;

  const eligible = canDistribute(profile?.plan);
  const licenseLocale = locale === "fr" ? "fr" : "en";

  const diceCoverPrompt = () => {
    const pick = pickCoverSurpriseSuggestion(loop, { seed: Date.now() });
    setCoverPrompt(buildStructuredCoverPrompt(pick));
    setCoverApproved(false);
  };

  const generateCover = async (isRegen: boolean) => {
    if (!eligible) {
      router.push(paywallHref("studio"));
      return;
    }
    const prompt = coverPrompt.trim();
    if (prompt.length < 6) {
      Alert.alert("Pack distribution", "Ajoute un prompt cover (au moins 6 caractères).");
      return;
    }
    const attempt = genAttempt + 1;
    const seed = buildCoverGenerationSeed(prompt, loop.id, loop.seed, attempt);
    setGenAttempt(attempt);
    setCoverPreviewSeed(seed);

    setCoverBusy(true);
    setCoverApproved(false);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");
      const idempotencyKey = `${loop.id}:${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const { data, error } = await supabase.functions.invoke("persist-pollinations-cover", {
        body: { loopId: loop.id, prompt, seed, idempotencyKey },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) {
        const msg = String((data as { error?: string } | null)?.error ?? error.message);
        if (msg.includes("no_credits")) throw new Error("no_credits");
        throw new Error(msg);
      }
      const coverUrl = typeof (data as { coverUrl?: unknown } | null)?.coverUrl === "string"
        ? String((data as { coverUrl: string }).coverUrl).trim()
        : "";
      if (!coverUrl.startsWith("http")) throw new Error("cover_failed");
      setCoverUrlOverride(coverUrl);
      Alert.alert("Pack distribution", isRegen ? "Nouvelle cover générée !" : "Cover générée — valide ou régénère.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur";
      if (msg.includes("no_credits")) Alert.alert("Pack distribution", "Plus de crédits disponibles.");
      else Alert.alert("Pack distribution", "Échec génération cover.");
    } finally {
      setCoverBusy(false);
    }
  };

  const submit = async () => {
    if (!eligible) {
      router.push(paywallHref("studio"));
      return;
    }
    if (!acceptRights || !acceptAi) {
      Alert.alert("Pack distribution", "Accepte les conditions pour continuer.");
      return;
    }
    if (!coverApproved) {
      Alert.alert(
        "Pack distribution",
        "Cover IA non validée — une cover officielle est recommandée pour la distribution.",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Continuer", onPress: () => void doExport() },
        ],
      );
      return;
    }
    await doExport();
  };

  const doExport = async () => {
    setBusy(true);
    try {
      await acceptDistributionTerms();
      const effectiveLoop = coverUrlOverride ? ({ ...loop, coverUrl: coverUrlOverride } as Loop) : loop;
      await buildAndShareDistributionPack({
        loop: effectiveLoop,
        title: title.trim(),
        artistName: artistName.trim(),
        genreName: genreName.trim(),
        languageCode: licenseLocale,
        explicit,
        locale: licenseLocale,
        plan: profile?.plan,
        username: profile?.username,
        userId: session?.user?.id,
        email: session?.user?.email ?? profile?.email,
      });

      const result = await recordDistributionPackExport({
        loopId: loop.id,
        title: title.trim(),
        artistName: artistName.trim(),
        genreName: genreName.trim(),
        languageCode: licenseLocale,
        explicit,
        acceptTerms: true,
      });
      if (!result.ok) {
        Alert.alert("Pack distribution", result.error ?? "Quota ou enregistrement échoué");
        return;
      }
      Alert.alert("Pack distribution", "ZIP partagé — upload manuel sur ton distributeur !");
      onSubmitted?.();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur";
      Alert.alert("Pack distribution", msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PhBottomSheet visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[typography.title, { color: colors.text, marginBottom: spacing.sm }]}>Pack distribution</Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
          Cover IA 1400×1400 · ZIP audio + licence ·{" "}
          <Text style={{ color: colors.accentPrimary }} onPress={() => router.push("/academy/distribution" as never)}>
            Academy
          </Text>
        </Text>

        {!eligible ? (
          <PhButton label="Passer à Studio" onPress={() => router.push(paywallHref("studio"))} />
        ) : (
          <View style={styles.form}>
            <PhTextField label="Titre" value={title} onChangeText={setTitle} />
            <PhTextField label="Artiste" value={artistName} onChangeText={setArtistName} />
            <PhTextField label="Genre" value={genreName} onChangeText={setGenreName} />
            <PhTextField label="Prompt cover (IA)" value={coverPrompt} onChangeText={setCoverPrompt} />
            <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
              <PhButton label="Dé" variant="ghost" onPress={diceCoverPrompt} />
              <PhButton
                label={coverBusy ? "…" : "Générer (1 cr.)"}
                variant="ghost"
                onPress={() => void generateCover(false)}
                loading={coverBusy}
              />
              {coverUrlOverride ? (
                <PhButton label="Régénérer" variant="ghost" onPress={() => void generateCover(true)} loading={coverBusy} />
              ) : null}
            </View>
            {coverUrlOverride ? (
              <View style={styles.previewRow}>
                <Image source={{ uri: withCoverCacheBust(coverUrlOverride, coverPreviewSeed) }} style={styles.previewLg} />
                <Image source={{ uri: withCoverCacheBust(coverUrlOverride, coverPreviewSeed) }} style={styles.previewSm} />
                <Image source={{ uri: withCoverCacheBust(coverUrlOverride, coverPreviewSeed) }} style={styles.previewXs} />
              </View>
            ) : null}
            {coverUrlOverride ? (
              <PhButton
                label={coverApproved ? "Cover validée" : "Valider cette cover"}
                variant="ghost"
                onPress={() => setCoverApproved(true)}
                disabled={coverApproved}
              />
            ) : null}
            {!coverApproved && coverUrlOverride ? (
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                Valide la cover avant l&apos;export pour une pochette officielle.
              </Text>
            ) : null}
            <View style={styles.row}>
              <Text style={{ color: colors.textMuted, flex: 1 }}>Explicite</Text>
              <Switch value={explicit} onValueChange={setExplicit} />
            </View>
            <View style={styles.row}>
              <Text style={{ color: colors.textMuted, flex: 1, fontSize: 13 }}>Je détiens les droits</Text>
              <Switch value={acceptRights} onValueChange={setAcceptRights} />
            </View>
            <View style={styles.row}>
              <Text style={{ color: colors.textMuted, flex: 1, fontSize: 13 }}>Contenu IA accepté</Text>
              <Switch value={acceptAi} onValueChange={setAcceptAi} />
            </View>
            <PhButton label={busy ? "Préparation…" : "Télécharger le pack"} onPress={() => void submit()} loading={busy} />
          </View>
        )}
      </ScrollView>
    </PhBottomSheet>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, paddingBottom: spacing.xl },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  previewRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  previewLg: { width: 120, height: 120, borderRadius: 12 },
  previewSm: { width: 64, height: 64, borderRadius: 8 },
  previewXs: { width: 48, height: 48, borderRadius: 6 },
});
