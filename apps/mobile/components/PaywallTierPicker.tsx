import { memo, useCallback, useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { PhCard } from "@/components/PhCard";
import {
  IAP_PLAN_ORDER,
  IAP_PRODUCTS,
  anchorDiscountPercent,
  parseStorePriceNumber,
  resolveTierStorePrice,
  type IapPaidPlan,
} from "@/lib/iapCatalog";
import { paywallTierFeatures, paywallTierLabel, tf } from "@/lib/i18n/catalog";
import type { IapPackageInfo } from "@/lib/subscriptionService";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

const CARD_WIDTH = 268;
const CARD_GAP = spacing.sm;

type TierCardProps = {
  plan: IapPaidPlan;
  pkg: IapPackageInfo | undefined;
  selected: boolean;
  onSelect: (plan: IapPaidPlan) => void;
};

const TierCard = memo(function TierCard({ plan, pkg, selected, onSelect }: TierCardProps) {
  const { locale, t } = useI18n();
  const { colors, typography, radius, material } = useTheme();
  const def = IAP_PRODUCTS[plan];
  const features = paywallTierFeatures(locale, plan);
  const storePrice = resolveTierStorePrice(pkg, def);
  const anchorLabel = tf(locale, "paywallAnchorWas", { price: `$${def.anchorUsd}` });
  const storeUsd = parseStorePriceNumber(storePrice);
  const savePct = anchorDiscountPercent(def.anchorUsd, storeUsd);
  const perGen =
    storeUsd && def.generations > 0
      ? tf(locale, "paywallPerGeneration", { price: (storeUsd / def.generations).toFixed(2) })
      : null;

  const badge =
    def.recommended ? t("paywallRecommended") : def.bestValue ? t("paywallBestValue") : null;

  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onSelect(plan);
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.cardWrap, pressed && styles.cardPressed]}
    >
      <PhCard
        style={[
          styles.card,
          {
            borderColor: selected ? colors.accentPrimary : colors.surfaceBorder,
            borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
          },
          material === "paper" && selected && { borderWidth: 2 },
        ]}
      >
        {badge ? (
          <View style={[styles.badge, { backgroundColor: colors.accentPrimary }]}>
            <Text style={[typography.micro, { color: colors.accentOnPrimary, fontWeight: "700" }]}>{badge}</Text>
          </View>
        ) : (
          <View style={styles.badgeSpacer} />
        )}

        <Text style={[typography.subtitle, { color: colors.text, fontSize: 20 }]}>
          {paywallTierLabel(locale, plan)}
        </Text>

        <Text style={[typography.micro, { color: colors.accentPrimary, marginTop: 2, fontWeight: "600" }]}>
          {t("paywallLaunchBadge")}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[typography.title, styles.storePrice, { color: colors.text }]}>{storePrice}</Text>
          <Text style={[typography.caption, styles.anchorPrice, { color: colors.textSubtle }]}>{anchorLabel}</Text>
        </View>

        {savePct != null && savePct > 0 ? (
          <View style={[styles.savePill, { backgroundColor: colors.pillActiveBg }]}>
            <Text style={[typography.micro, { color: colors.success, fontWeight: "700" }]}>
              {tf(locale, "paywallSaveBadge", { pct: savePct })}
            </Text>
          </View>
        ) : null}

        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
          {tf(locale, "paywallGenerationsLine", { n: def.generations })}
        </Text>

        {perGen ? (
          <Text style={[typography.micro, { color: colors.textSubtle, marginTop: 2 }]}>{perGen}</Text>
        ) : null}

        {pkg?.introOfferLabel ? (
          <Text style={[typography.micro, { color: colors.accentPrimary, marginTop: spacing.sm, lineHeight: 16 }]}>
            {tf(locale, "paywallIntroOffer", { offer: pkg.introOfferLabel })}
          </Text>
        ) : null}

        <View style={[styles.featureList, { borderTopColor: colors.surfaceBorder }]}>
          {features.map((line) => (
            <View key={line} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[typography.caption, { color: colors.textMuted, flex: 1, lineHeight: 18 }]}>{line}</Text>
            </View>
          ))}
        </View>

        {selected ? (
          <View style={[styles.selectedDot, { backgroundColor: colors.accentPrimary, borderRadius: radius.pill }]}>
            <Ionicons name="checkmark" size={14} color={colors.accentOnPrimary} />
          </View>
        ) : null}
      </PhCard>
    </Pressable>
  );
});

type Props = {
  selectedPlan: IapPaidPlan;
  onSelectPlan: (plan: IapPaidPlan) => void;
  packages: IapPackageInfo[];
};

export const PaywallTierPicker = memo(function PaywallTierPicker({ selectedPlan, onSelectPlan, packages }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  const pkgForPlan = useCallback(
    (plan: IapPaidPlan) => packages.find((p) => p.plan === plan),
    [packages],
  );

  const scrollToPlan = useCallback((plan: IapPaidPlan, animated: boolean) => {
    const index = IAP_PLAN_ORDER.indexOf(plan);
    if (index < 0) return;
    scrollRef.current?.scrollTo({
      x: Math.max(0, index * (CARD_WIDTH + CARD_GAP) - CARD_GAP),
      animated,
    });
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => scrollToPlan(selectedPlan, false));
    return () => cancelAnimationFrame(id);
  }, [scrollToPlan, selectedPlan]);

  const onSelect = useCallback(
    (plan: IapPaidPlan) => {
      onSelectPlan(plan);
      scrollToPlan(plan, true);
    },
    [onSelectPlan, scrollToPlan],
  );

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={CARD_WIDTH + CARD_GAP}
      snapToAlignment="start"
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {IAP_PLAN_ORDER.map((plan) => (
        <TierCard
          key={plan}
          plan={plan}
          pkg={pkgForPlan(plan)}
          selected={selectedPlan === plan}
          onSelect={onSelect}
        />
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollContent: {
    gap: CARD_GAP,
    paddingVertical: spacing.xs,
    paddingRight: spacing.xs,
  },
  cardWrap: {
    width: CARD_WIDTH,
  },
  cardPressed: {
    opacity: 0.92,
  },
  card: {
    padding: spacing.md,
    gap: 0,
    minHeight: 340,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: spacing.xs,
  },
  badgeSpacer: {
    height: 22,
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: spacing.sm,
    flexWrap: "wrap",
  },
  storePrice: {
    fontSize: 30,
    fontVariant: ["tabular-nums"],
  },
  anchorPrice: {
    textDecorationLine: "line-through",
  },
  savePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: spacing.xs,
  },
  featureList: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  featureRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  selectedDot: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
