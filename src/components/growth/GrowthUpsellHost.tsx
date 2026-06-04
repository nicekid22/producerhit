import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PlanUpsellModal } from "@/components/growth/PlanUpsellModal";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { useGrowthUpsellStore } from "@/stores/growthUpsellStore";
import { normalizePlan } from "@/lib/billing";

/** Modal d'upgrade global — monté une fois dans l'app. */
export function GrowthUpsellHost() {
  const locale = useLocaleStore((s) => s.locale);
  const profile = useAuthStore((s) => s.profile);
  const { open, reason, ctx, openUpsell, closeUpsell } = useGrowthUpsellStore();
  const authPlan = normalizePlan(profile?.plan);
  const plan = normalizePlan(ctx?.plan ?? authPlan);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const upsell = params.get("upsell");
    if (!upsell) return;
    if (upsell === "credits" || upsell === "limit") {
      openUpsell(upsell === "limit" ? "limit_reached" : "credits_exhausted", { source: "url_param" });
      params.delete("upsell");
      const next = params.toString();
      navigate({ pathname: location.pathname, search: next ? `?${next}` : "" }, { replace: true });
    }
  }, [location.pathname, location.search, navigate, openUpsell]);

  return (
    <PlanUpsellModal
      open={open}
      reason={reason}
      locale={locale}
      plan={plan}
      source={ctx?.source ?? "app"}
      remaining={ctx?.remaining}
      totalLimit={ctx?.totalLimit}
      usedThisMonth={ctx?.usedThisMonth}
      onClose={closeUpsell}
    />
  );
}
