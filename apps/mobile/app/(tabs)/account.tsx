import { memo, useCallback, useState } from "react";

import { InteractionManager, Linking, ScrollView, Share, StyleSheet, Text, View } from "react-native";

import { useFocusEffect, useRouter } from "expo-router";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AccountProfileHeader } from "@/components/AccountProfileHeader";

import { markActivationStep } from "@/components/ActivationChecklist";
import { paywallHref } from "@/lib/iapCatalog";

import { ContinueListeningCard } from "@/components/ContinueListeningCard";

import { DailyBonusCard } from "@/components/DailyBonusCard";

import { LocaleToggle } from "@/components/LocaleToggle";

import { PhButton } from "@/components/PhButton";

import { PhCard } from "@/components/PhCard";

import { ThemePicker } from "@/components/ThemePicker";

import { UsageBar } from "@/components/UsageBar";

import { signOut } from "@/lib/auth";

import { usageSummary } from "@/lib/loopsApi";

import { buildReferralUrl } from "@/lib/referral";

import { useResponsiveLayout } from "@/lib/useResponsiveLayout";

import { resolveAccountIdentity, useAuthStore } from "@/stores/authStore";

import type { UserProfile } from "@producerhit/shared";

import { useI18n } from "@/stores/localeStore";

import { useTheme } from "@/theme/ThemeProvider";

import { spacing } from "@/theme/tokens";

const PRIVACY_URL = "https://www.producerhit.com/privacy";

const TERMS_URL = "https://www.producerhit.com/terms";

const PROFILE_REFRESH_MS = 60_000;

let accountHeavyMounted = false;

let lastProfileRefreshAt = 0;

/** Sections lourdes (cartes bonus, préférences, légal) — montées après la transition d'onglet. */
const AccountHeavySections = memo(function AccountHeavySections({
  isFree,
  profile,
}: {
  isFree: boolean;
  profile: UserProfile | null;
}) {
  const router = useRouter();
  const { t, tf } = useI18n();
  const { colors, typography: typo } = useTheme();

  return (
    <>
      <View style={styles.stack}>
        <DailyBonusCard />
        <ContinueListeningCard />
      </View>

      <PhCard elevated={false}>
        <Text style={[typo.subtitle, styles.sectionTitle, { color: colors.text }]}>{t("accountPreferences")}</Text>
        <Text style={[typo.caption, styles.sectionCaption, { color: colors.textMuted }]}>{t("themeHint")}</Text>
        <View style={styles.themePickerBleed}>
          <ThemePicker />
        </View>
      </PhCard>

      <PhCard elevated={false}>
        <Text style={[typo.subtitle, styles.sectionTitle, { color: colors.text }]}>{t("language")}</Text>
        <Text style={[typo.caption, styles.sectionCaption, { color: colors.textMuted }]}>{t("languageHint")}</Text>
        <LocaleToggle />
      </PhCard>

      <View style={styles.stack}>
        <PhCard elevated={false}>
          <Text style={[typo.subtitle, styles.sectionTitle, { color: colors.text }]}>{t("subscription")}</Text>
          {!isFree ? (
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
          <PhButton
            label="Pack distribution"
            variant="ghost"
            onPress={() => router.push("/distribution" as never)}
          />
          <PhButton
            label="Distribution Academy"
            variant="ghost"
            onPress={() => router.push("/academy/distribution" as never)}
          />
        </PhCard>

        <PhCard elevated={false}>
          <Text style={[typo.subtitle, styles.sectionTitle, { color: colors.text }]}>{t("inviteFriends")}</Text>
          <Text style={[typo.body, styles.referralBody, { color: colors.textMuted }]}>{t("referralBody")}</Text>
          {profile?.referralCode ? (
            <>
              <Text style={[typo.caption, styles.referralCode, { color: colors.accentPrimary, fontVariant: ["tabular-nums"], letterSpacing: 1.2 }]}>
                {profile.referralCode}
              </Text>
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

        <PhCard elevated={false}>
          <Text style={[typo.subtitle, styles.sectionTitle, { color: colors.text }]}>{t("legal")}</Text>
          <PhButton label={t("privacyPolicy")} variant="ghost" onPress={() => void Linking.openURL(PRIVACY_URL)} />
          <PhButton label={t("termsOfService")} variant="ghost" onPress={() => void Linking.openURL(TERMS_URL)} />
        </PhCard>

        <Text style={[typo.micro, styles.footerNote, { color: colors.textSubtle }]}>{t("brandTagline")}</Text>

        <PhButton
          label={t("signOut")}
          variant="ghost"
          onPress={() =>
            void signOut().then(() => {
              router.replace("/(auth)/login");
            })
          }
        />
      </View>
    </>
  );
});

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const profileRefreshing = useAuthStore((s) => s.profileRefreshing);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const { t, tf } = useI18n();
  const { colors, typography: typo } = useTheme();
  const { contentMaxWidth, isTablet } = useResponsiveLayout();
  const [heavyReady, setHeavyReady] = useState(accountHeavyMounted);

  const { email, plan } = resolveAccountIdentity(session, profile);
  const profileLoading = profileRefreshing && !email && !profile;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const mountHeavy = () => {
        if (cancelled || accountHeavyMounted) return;
        accountHeavyMounted = true;
        setHeavyReady(true);
      };

      const refreshIfStale = () => {
        const now = Date.now();
        if (now - lastProfileRefreshAt < PROFILE_REFRESH_MS && profile) return;
        lastProfileRefreshAt = now;
        void refreshProfile({ silent: !!profile });
      };

      if (accountHeavyMounted) {
        const task = InteractionManager.runAfterInteractions(() => {
          refreshIfStale();
        });
        return () => {
          cancelled = true;
          task.cancel();
        };
      }

      const task = InteractionManager.runAfterInteractions(() => {
        mountHeavy();
        refreshIfStale();
      });

      return () => {
        cancelled = true;
        task.cancel();
      };
    }, [profile, refreshProfile]),
  );

  const usage = usageSummary(profile);
  const isFree = plan === "free";
  const bonus =
    (profile?.referralBonus ?? 0) +
    (profile?.levelBonus ?? 0) +
    (profile?.dailyBonusMonth ?? 0) +
    (profile?.purchasedBonus ?? 0);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.lg,
          maxWidth: contentMaxWidth,
          alignSelf: isTablet ? "center" : undefined,
          width: isTablet ? "100%" : undefined,
        },
      ]}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <AccountProfileHeader email={email} plan={plan} loading={profileLoading} />
        <Text style={[typo.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>{t("accountSub")}</Text>
      </View>

      <PhCard elevated={false}>
        <UsageBar used={usage.used} limit={usage.limit} />
        {bonus > 0 ? (
          <Text style={[typo.caption, styles.bonus, { color: colors.success }]}>{tf("bonusCredits", { n: bonus })}</Text>
        ) : null}
        {isFree ? (
          <PhButton label={t("upgradePro")} onPress={() => router.push(paywallHref("studio"))} style={{ marginTop: spacing.lg }} />
        ) : null}
      </PhCard>

      {heavyReady ? <AccountHeavySections isFree={isFree} profile={profile} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screen, gap: spacing.lg, paddingBottom: 200 },
  stack: { gap: spacing.lg },
  bonus: { marginTop: spacing.sm },
  sectionTitle: { marginBottom: spacing.sm },
  sectionCaption: { marginBottom: spacing.md, lineHeight: 18 },
  themePickerBleed: {
    marginHorizontal: -spacing.lg,
    paddingLeft: spacing.lg,
  },
  divider: { height: spacing.lg },
  referralBody: { marginBottom: spacing.sm },
  referralCode: { letterSpacing: 0.5, marginBottom: spacing.sm },
  footerNote: { textAlign: "center", marginTop: spacing.sm },
});
