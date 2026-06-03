import { normalizePlanId, type PaidPlanId } from "@/lib/planEntitlements";
import { PLAN_LIMITS, getPlanBaseLimit } from "@/lib/planLimits";

export type UpsellReason =
  | "credits_exhausted"
  | "credits_low"
  | "post_generation"
  | "limit_reached"
  | "wav_export"
  | "feature_priority";

export type UpsellContext = {
  source: string;
  remaining?: number;
  totalLimit?: number;
  usedThisMonth?: number;
};

const LOW_CREDITS_SESSION_KEY = "producerhit_low_credits_prompt_v1";
const POST_GEN_COOLDOWN_KEY = "producerhit_upgrade_prompt_ts";
const POST_GEN_COOLDOWN_MS = 6 * 60 * 60 * 1000;

export function recommendedUpgradePlan(plan: string | null | undefined): PaidPlanId | null {
  const cur = normalizePlanId(plan);
  if (cur === "free") return "pro";
  if (cur === "pro") return "studio";
  if (cur === "studio") return "plus";
  return null;
}

export function shouldShowLowCreditsPrompt(plan: string, remaining: number): boolean {
  if (normalizePlanId(plan) !== "free") return false;
  if (remaining <= 0 || remaining > 2) return false;
  try {
    return sessionStorage.getItem(LOW_CREDITS_SESSION_KEY) !== "1";
  } catch {
    return true;
  }
}

export function markLowCreditsPromptShown(): void {
  try {
    sessionStorage.setItem(LOW_CREDITS_SESSION_KEY, "1");
  } catch {
    void 0;
  }
}

export function shouldShowPostGenerationPrompt(): boolean {
  try {
    const lastRaw = localStorage.getItem(POST_GEN_COOLDOWN_KEY);
    const last = lastRaw ? Number(lastRaw) : 0;
    const now = Date.now();
    if (!Number.isFinite(last) || now - last > POST_GEN_COOLDOWN_MS) {
      localStorage.setItem(POST_GEN_COOLDOWN_KEY, String(now));
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

export type UpsellCopy = {
  title: string;
  description: string;
  bullets: string[];
  primaryLabel: string;
  secondaryLabel: string;
  targetPlan: PaidPlanId | null;
};

export function getUpsellCopy(
  reason: UpsellReason,
  locale: "en" | "fr",
  plan: string,
  ctx: UpsellContext = { source: "unknown" },
): UpsellCopy {
  const isFr = locale === "fr";
  const cur = normalizePlanId(plan);
  const target = recommendedUpgradePlan(plan);
  const remaining = ctx.remaining ?? 0;
  const baseLimit = getPlanBaseLimit(cur);
  const proLimit = PLAN_LIMITS.pro;
  const studioLimit = PLAN_LIMITS.studio;

  const planName = (p: PaidPlanId) => {
    if (p === "plus") return "Plus";
    if (p === "studio") return "Studio";
    return "Pro";
  };

  const primaryForTarget = target
    ? isFr
      ? `Passer ${planName(target)}`
      : `Upgrade to ${planName(target)}`
    : isFr
      ? "Gérer l'abonnement"
      : "Manage subscription";

  if (reason === "wav_export") {
    const wavPlan: PaidPlanId = cur === "pro" ? "studio" : "studio";
    return {
      title: isFr ? "Export WAV & mastering complet" : "WAV export & full mastering",
      description: isFr
        ? "L'aperçu mastering est gratuit. Pour exporter le WAV masterisé et l'appliquer à ta track, passe Studio ou Plus."
        : "Mastering preview is free. Export mastered WAV and apply to your track with Studio or Plus.",
      bullets: isFr
        ? ["Presets studio pro", "Export WAV masterisé", "Application du master sur ta track", `${studioLimit} générations / mois sur Studio`]
        : ["Pro studio presets", "Mastered WAV export", "Apply master to your track", `${studioLimit} generations / month on Studio`],
      primaryLabel: isFr ? "Passer Studio" : "Go Studio",
      secondaryLabel: isFr ? "Comparer les plans" : "Compare plans",
      targetPlan: wavPlan,
    };
  }

  if (reason === "feature_priority") {
    return {
      title: isFr ? "Priorité génération" : "Generation priority",
      description: isFr
        ? "Le réseau est chargé. Les plans Pro et au-dessus passent avant la file d'attente free."
        : "The network is busy. Pro plans and above skip ahead of the free queue.",
      bullets: isFr
        ? [`${proLimit} générations / mois sur Pro`, "File prioritaire", "Export MP3 & Song Mode", "Versions ×2"]
        : [`${proLimit} generations / month on Pro`, "Priority queue", "MP3 export & Song Mode", "Versions ×2"],
      primaryLabel: primaryForTarget,
      secondaryLabel: isFr ? "Voir les tarifs" : "View pricing",
      targetPlan: target ?? "pro",
    };
  }

  if (reason === "credits_low") {
    return {
      title: isFr
        ? `Plus que ${remaining} génération${remaining !== 1 ? "s" : ""} ce mois-ci`
        : `Only ${remaining} generation${remaining !== 1 ? "s" : ""} left this month`,
      description: isFr
        ? `Tu es sur Free (${baseLimit}/mois). Passe Pro pour ${proLimit} tracks, la priorité et plus de marge pour itérer.`
        : `You're on Free (${baseLimit}/month). Go Pro for ${proLimit} tracks, priority, and room to iterate.`,
      bullets: isFr
        ? [`${proLimit} générations / mois`, "Priorité génération", "Song Mode + Remix", "Export MP3 royalty-free"]
        : [`${proLimit} generations / month`, "Generation priority", "Song Mode + Remix", "Royalty-free MP3 export"],
      primaryLabel: isFr ? "Passer Pro — 10€/mo" : "Go Pro — $10/mo",
      secondaryLabel: isFr ? "Plus tard" : "Not now",
      targetPlan: "pro",
    };
  }

  if (reason === "post_generation") {
    return {
      title: isFr ? "Tu produis sérieusement 🔥" : "You're on a roll 🔥",
      description: isFr
        ? `Free = ${baseLimit} générations / mois. Upgrade pour enchaîner sans compter chaque crédit.`
        : `Free = ${baseLimit} generations / month. Upgrade to keep creating without watching every credit.`,
      bullets: isFr
        ? [`Pro : ${proLimit} gen / mois`, "Versions ×2 pour A/B", "Priorité file", "Plus de bonus daily & niveau"]
        : [`Pro: ${proLimit} gen / month`, "Versions ×2 for A/B", "Priority queue", "More daily & level bonuses"],
      primaryLabel: isFr ? "Passer Pro" : "Go Pro",
      secondaryLabel: isFr ? "Continuer en Free" : "Keep creating on Free",
      targetPlan: "pro",
    };
  }

  if (cur !== "free" && !target) {
    return {
      title: isFr ? "Quota mensuel atteint" : "Monthly quota reached",
      description: isFr
        ? "Tu as utilisé toutes tes générations ce mois-ci. Reviens au renouvellement ou gère ton abonnement."
        : "You've used all generations this month. Come back at renewal or manage your subscription.",
      bullets: isFr
        ? ["Bonus daily & niveau demain", "Parrainage = crédits bonus", "Bibliothèque conservée selon ton plan"]
        : ["Daily & level bonuses tomorrow", "Referrals = bonus credits", "Library kept per your plan"],
      primaryLabel: isFr ? "Paramètres & facturation" : "Settings & billing",
      secondaryLabel: isFr ? "Fermer" : "Close",
      targetPlan: null,
    };
  }

  const exhaustedTitle = isFr ? "Plus de crédits ce mois-ci" : "No credits left this month";
  const exhaustedDesc =
    cur === "free"
      ? isFr
        ? `Quota Free épuisé (${ctx.usedThisMonth ?? baseLimit}/${ctx.totalLimit ?? baseLimit}). Passe Pro pour ${proLimit} générations, priorité et export MP3 sans stress.`
        : `Free quota used (${ctx.usedThisMonth ?? baseLimit}/${ctx.totalLimit ?? baseLimit}). Go Pro for ${proLimit} generations, priority, and stress-free MP3 export.`
      : isFr
        ? `Quota ${cur} atteint. Passe ${target ? planName(target) : "au plan supérieur"} pour continuer à générer.`
        : `${cur} quota reached. Upgrade to ${target ? planName(target) : "a higher plan"} to keep generating.`;

  return {
    title: reason === "limit_reached" ? (isFr ? "Limite mensuelle atteinte" : "Monthly limit reached") : exhaustedTitle,
    description: exhaustedDesc,
    bullets:
      target === "pro"
        ? isFr
          ? [`${proLimit} générations / mois`, "Priorité vs Free", "Song Mode + Remix Studio", "10€ / mois"]
          : [`${proLimit} generations / month`, "Priority vs Free", "Song Mode + Remix Studio", "$10 / month"]
        : target === "studio"
          ? isFr
            ? [`${studioLimit} générations / mois`, "Export WAV mastering", "Tout Pro inclus", "30€ / mois"]
            : [`${studioLimit} generations / month`, "Mastered WAV export", "Everything in Pro", "$30 / month"]
          : isFr
            ? ["Bonus demain (daily & niveau)", "Invite un pote = crédits", "Tes tracks restent dans la bibliothèque"]
            : ["Bonuses tomorrow (daily & level)", "Invite friends = credits", "Your tracks stay in the library"],
    primaryLabel: target ? primaryForTarget : isFr ? "Voir les tarifs" : "View pricing",
    secondaryLabel: isFr ? "Fermer" : "Close",
    targetPlan: target,
  };
}
