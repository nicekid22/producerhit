import { useEffect } from "react";
import { Linking, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { markActivationStep } from "@/components/ActivationChecklist";
import { DailyBonusCard } from "@/components/DailyBonusCard";
import { LocaleToggle } from "@/components/LocaleToggle";
import { PhButton } from "@/components/PhButton";
import { PhCard } from "@/components/PhCard";
import { PhDisplay } from "@/components/PhDisplay";
import { ThemeBackdrop } from "@/components/ThemeBackdrop";
import { ThemePicker } from "@/components/ThemePicker";
import { UsageBar } from "@/components/UsageBar";
import { signOut } from "@/lib/auth";
import { usageSummary } from "@/lib/loopsApi";
import { buildReferralUrl } from "@/lib/referral";
import { useResponsiveLayout } from "@/lib/useResponsiveLayout";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

const PRIVACY_URL = "https://www.producerhit.com/privacy";
const TERMS_URL = "https://www.producerhit.com/terms";

export default function AccountScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const { t, tf } = useI18n();
  const { colors, typography: typo } = useTheme();
  const { contentMaxWidth, isTablet } = useResponsiveLayout();

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const usage = usageSummary(profile);
  const planLabel = (profile?.plan ?? "free").toUpperCase();
  const bonus =
    (profile?.referralBonus ?? 0) +
    (profile?.levelBonus ?? 0) +
    (profile?.dailyBonusMonth ?? 0) +
    (profile?.purchasedBonus ?? 0);

  return (
    <ThemeBackdrop>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { maxWidth: contentMaxWidth, alignSelf: isTablet ? "center" : undefined, width: isTablet ? "100%" : undefined },
        ]}
      >
        <PhDisplay variant="display">{t("account")}</PhDisplay>
        <Text style={[typo.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>{t("accountSub")}</Text>

        <PhCard elevated={false}>
          <Text style={[typo.subtitle, styles.sectionTitle, { color: colors.text }]}>{t("themeLabel")}</Text>
          <ThemePicker />
        </PhCard>

        <PhCard>
          <Text style={[typo.subtitle, styles.sectionTitle, { color: colors.text }]}>{t("language")}</Text>
          <LocaleToggle />
        </PhCard>

        <DailyBonusCard />

        <PhCard>
          <Text style={[typo.micro, { color: colors.accent, letterSpacing: 1.2, marginBottom: spacing.md }]}>{planLabel}</Text>
          <Text style={[typo.caption, styles.label, { color: colors.textMuted }]}>{t("email")}</Text>
          <Text style={[typo.subtitle, styles.value, { color: colors.text }]}>{session?.user?.email ?? profile?.email ?? "—"}</Text>
          <View style={{ marginTop: spacing.lg }}>
            <UsageBar used={usage.used} limit={usage.limit} />
          </View>
          {bonus > 0 ? (
            <Text style={[typo.caption, styles.bonus, { color: colors.success }]}>{tf("bonusCredits", { n: bonus })}</Text>
          ) : null}
        </PhCard>

        {profile?.plan === "free" ? (
          <PhButton label={t("upgradePro")} onPress={() => router.push("/paywall")} />
        ) : null}

        <PhCard>
          <Text style={[typo.subtitle, styles.sectionTitle, { color: colors.text }]}>{t("subscription")}</Text>
          {profile?.plan !== "free" ? (
            <PhButton
              label={t("manageAppleSub")}
              variant="ghost"
              onPress={() => void Linking.openURL("https://apps.apple.com/account/subscriptions")}
            />
          ) : null}
          <PhButton
            label={t("billingWeb")}
            variant="ghost"
            onPress={() => void Linking.openURL("https://www.producerhit.com/settings")}
          />
          <PhButton
            label={t("openWebLibrary")}
            variant="ghost"
            onPress={() => void Linking.openURL("https://www.producerhit.com/library")}
          />
        </PhCard>

        <PhCard>
          <Text style={[typo.subtitle, styles.sectionTitle, { color: colors.text }]}>{t("inviteFriends")}</Text>
          <Text style={[typo.body, styles.referralBody, { color: colors.textMuted }]}>{t("referralBody")}</Text>
          {profile?.referralCode ? (
            <>
              <Text style={[typo.caption, styles.referralCode, { color: colors.accent }]}>{profile.referralCode}</Text>
              <PhButton
                label={t("shareReferral")}
                variant="ghost"
                onPress={() => {
                  const url = buildReferralUrl(profile.referralCode!);
                  void Share.share({
                    message: tf("shareReferralMessage", { url }),
                    url,
                  }).then(() => markActivationStep("referral_share"));
                }}
              />
            </>
          ) : (
            <PhButton
              label={t("referralWebLink")}
              variant="ghost"
              onPress={() => void Linking.openURL("https://www.producerhit.com/settings")}
            />
          )}
        </PhCard>

        <PhCard>
          <Text style={[typo.subtitle, styles.sectionTitle, { color: colors.text }]}>{t("legal")}</Text>
          <PhButton label={t("privacyPolicy")} variant="ghost" onPress={() => void Linking.openURL(PRIVACY_URL)} />
          <PhButton label={t("termsOfService")} variant="ghost" onPress={() => void Linking.openURL(TERMS_URL)} />
        </PhCard>

        <Text style={[typo.micro, styles.ace, { color: colors.textSubtle }]}>{t("acePowered")}</Text>

        <PhButton
          label={t("signOut")}
          variant="ghost"
          onPress={() =>
            void signOut().then(() => {
              router.replace("/(auth)/login");
            })
          }
        />
      </ScrollView>
    </ThemeBackdrop>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screen, gap: spacing.lg, paddingBottom: 200 },
  label: {},
  value: { marginTop: 4 },
  bonus: { marginTop: spacing.sm },
  sectionTitle: { marginBottom: spacing.sm },
  referralBody: { marginBottom: spacing.sm },
  referralCode: { letterSpacing: 0.5, marginBottom: spacing.sm },
  ace: { textAlign: "center", marginTop: spacing.sm },
});
