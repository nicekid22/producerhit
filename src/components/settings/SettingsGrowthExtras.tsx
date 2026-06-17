import { useCallback, useEffect, useRef, useState } from "react";
import type { AppLocale } from "@/i18n/config";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { DashboardPromoBillboard } from "@/components/growth/DashboardPromoBillboard";
import { GamificationStrip } from "@/components/growth/GamificationStrip";
import { GamificationCollapsedPreview } from "@/components/growth/GamificationCollapsedPreview";
import {
  DashboardGamingPanelShell,
  type DashboardGamingPanelHandle,
} from "@/components/dashboard/DashboardGamingPanelShell";
import { useAuthStore } from "@/stores/authStore";
import { ensureReferralCode } from "@/lib/referral";
import { trackClientEvent } from "@/lib/supabaseClient";

type Props = {
  locale: AppLocale;
  plan: string;
  /** Masque le billboard promo — garde uniquement la progression. */
  compact?: boolean;
};

function scrollToId(id: string) {
  window.setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 80);
}

/** Spotlight + progression — déplacés hors du dashboard mobile. */
export function SettingsGrowthExtras({ locale, plan, compact = false }: Props) {
  const navigate = useNavigate();
  const isFr = locale === "fr";
  const user = useAuthStore((s) => s.user);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const progressionRef = useRef<DashboardGamingPanelHandle>(null);
  const [gamificationRefreshKey, setGamificationRefreshKey] = useState(0);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "").trim();
    if (hash === "progression") scrollToId("pk-settings-progression");
  }, []);

  const onReferral = useCallback(async () => {
    scrollToId("pk-settings-referral");
    let code = useAuthStore.getState().profile?.referral_code ?? null;
    if (!code) {
      code = await ensureReferralCode();
      if (code) void refreshProfile();
    }
    if (!code) {
      toast.error(isFr ? "Lien indisponible — réessaie" : "Link unavailable — try again");
      return;
    }
    trackClientEvent("referral_prompt_shown", { source: "settings_spotlight" });
  }, [isFr, refreshProfile]);

  return (
    <div className="pk-settings-growth space-y-4">
      {!compact ? (
        <DashboardPromoBillboard
          locale={locale}
          plan={plan}
          onShare={() => {
            toast(isFr ? "Génère une track depuis le studio, puis partage-la." : "Generate a track in the studio, then share it.");
            navigate("/dashboard");
          }}
          onReferral={() => void onReferral()}
          onCommunity={() => navigate("/community")}
          onMastering={() => navigate("/dashboard")}
          onProgress={() => {
            progressionRef.current?.expand();
            scrollToId("pk-settings-progression");
            trackClientEvent("dashboard_billboard_progress", { source: "settings" });
          }}
          onPricing={() => navigate("/pricing?plan=plus")}
          onProfile={() => scrollToId("pk-settings-profile")}
          onCreate={() => navigate("/dashboard")}
        />
      ) : null}

      <div id="pk-settings-progression">
        <DashboardGamingPanelShell
          ref={progressionRef}
          locale={locale}
          title={isFr ? "Progression" : "Progress"}
          subtitle={isFr ? "Niveau · série · bonus daily" : "Level · streak · daily bonus"}
          storageKey="producerhit_settings_gaming_collapsed_v1"
          collapsedPreview={<GamificationCollapsedPreview locale={locale} />}
        >
          <GamificationStrip
            locale={locale}
            refreshKey={gamificationRefreshKey}
            syncRewards={!!user}
            onBonusCreditsChange={() => {
              void refreshProfile();
              setGamificationRefreshKey((k) => k + 1);
            }}
          />
        </DashboardGamingPanelShell>
      </div>
    </div>
  );
}
