import type { AppLocale } from "@/i18n/config";
import {
  canDualGeneration,
  canExportWav,
  hasCommercialUseRights,
  hasFullMastering,
  hasPriorityGeneration,
  normalizePlanId,
  planDisplayName,
  type PaidPlanId,
} from "@/lib/planEntitlements";
import { PLAN_LIMITS, getPlanBaseLimit } from "@/lib/planLimits";
import { LOOP_AUDIO_RETENTION_DAYS_PRO } from "@/lib/loopAudioRetention";
import { COMMERCIAL_RIGHTS_FAQ, planPriceLabel, planPriceUpsellLabel } from "@/lib/planPricing";

export type UpsellReason =
  | "credits_exhausted"
  | "credits_low"
  | "post_generation"
  | "limit_reached"
  | "wav_export"
  | "feature_wav_format"
  | "feature_priority"
  | "feature_dual_generation"
  | "feature_voice_to_song"
  | "feature_voice_clone"
  | "feature_stems"
  | "feature_no_watermark"
  | "feature_permanent_audio"
  | "feature_commercial_download";

export type UpsellContext = {
  source: string;
  /** Plan effectif au moment du prompt (évite free en cache vs quota Studio). */
  plan?: string;
  remaining?: number;
  totalLimit?: number;
  usedThisMonth?: number;
};

/** Ne pas afficher de modal upgrade incohérent (ex. « Passe Pro » pour un compte Studio). */
export function shouldShowPlanUpsell(
  plan: string | null | undefined,
  reason: UpsellReason,
  ctx: UpsellContext = { source: "unknown" },
): boolean {
  const cur = normalizePlanId(plan);
  const remaining = Math.max(0, ctx.remaining ?? 0);
  const target = recommendedUpgradePlan(plan);

  switch (reason) {
    case "credits_low":
      return cur === "free" && remaining > 0 && remaining <= 2;
    case "post_generation":
      return cur === "free";
    case "feature_priority":
      return !hasPriorityGeneration(plan);
    case "feature_dual_generation":
      return !canDualGeneration(plan);
    case "feature_voice_to_song":
      return !hasFullMastering(plan);
    case "feature_voice_clone":
      return !hasFullMastering(plan);
    case "feature_stems":
      return normalizePlanId(plan) !== "plus";
    case "feature_no_watermark":
      return !hasCommercialUseRights(plan);
    case "feature_permanent_audio":
      return normalizePlanId(plan) !== "plus";
    case "feature_commercial_download":
      return !hasCommercialUseRights(plan);
    case "wav_export":
      return !hasFullMastering(plan);
    case "feature_wav_format":
      return !canExportWav(plan);
    case "credits_exhausted":
    case "limit_reached":
      return remaining < 1;
    default:
      return cur === "free" || target !== null;
  }
}

const LOW_CREDITS_SESSION_KEY = "producerhit_low_credits_prompt_v1";
const EXHAUSTED_CREDITS_SESSION_KEY = "producerhit_exhausted_upsell_v2";
const POST_GEN_COOLDOWN_KEY = "producerhit_upgrade_prompt_ts";
const POST_GEN_COOLDOWN_MS = 6 * 60 * 60 * 1000;

export function recommendedUpgradePlan(plan: string | null | undefined): PaidPlanId | null {
  const cur = normalizePlanId(plan);
  if (cur === "free") return "pro";
  if (cur === "pro") return "studio";
  if (cur === "studio") return "plus";
  return null;
}

/** Cible upsell après erreur « réseau chargé » selon le plan actuel. */
export function priorityUpsellTarget(plan: string | null | undefined): PaidPlanId {
  const cur = normalizePlanId(plan);
  if (cur === "free") return "pro";
  return "plus";
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

/** Popup quota épuisé — une fois par session (tous plans, Studio → Plus inclus). */
export function shouldShowExhaustedCreditsPrompt(): boolean {
  try {
    return sessionStorage.getItem(EXHAUSTED_CREDITS_SESSION_KEY) !== "1";
  } catch {
    return true;
  }
}

export function markExhaustedCreditsPromptShown(): void {
  try {
    sessionStorage.setItem(EXHAUSTED_CREDITS_SESSION_KEY, "1");
  } catch {
    void 0;
  }
}

export function creditsBlockedReason(remaining: number, cost = 1): UpsellReason {
  return remaining < cost ? "credits_exhausted" : "credits_low";
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
  locale: AppLocale,
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
  const plusLimit = PLAN_LIMITS.plus;

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

  if (reason === "feature_wav_format") {
    return {
      title: isFr ? "Débloque le mode WAV 🎵" : "Unlock WAV mode 🎵",
      description: isFr
        ? "Sur Free, tu génères en MP3. Pro active le toggle WAV — fichiers plus propres pour Spotify, BeatStars et tes clients."
        : "On Free, you generate MP3. Pro unlocks the WAV toggle — cleaner files for Spotify, BeatStars, and client work.",
      bullets: isFr
        ? [`${proLimit} générations / mois`, "Toggle MP3 ↔ WAV à chaque gen", "Droits commerciaux inclus", planPriceUpsellLabel("pro", "fr")]
        : [`${proLimit} generations / month`, "MP3 ↔ WAV toggle every gen", "Commercial rights included", planPriceUpsellLabel("pro", "en")],
      primaryLabel: isFr ? `Passer Pro — ${planPriceLabel("pro", "fr", { suffix: true })}` : `Go Pro — ${planPriceLabel("pro", "en", { suffix: true })}`,
      secondaryLabel: isFr ? "Rester en MP3" : "Stay on MP3",
      targetPlan: "pro",
    };
  }

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

  if (reason === "feature_dual_generation") {
    return {
      title: isFr ? "Génération ×2 en parallèle" : "Dual parallel generation",
      description: isFr
        ? "Lance deux versions en même temps et choisis la meilleure — réservé au plan Studio et au-dessus."
        : "Run two versions at once and pick the best take — included with Studio and above.",
      bullets: isFr
        ? [`${studioLimit} générations / mois sur Studio`, "Versions ×2 en parallèle", "Export WAV mastering", "Tout Pro inclus"]
        : [`${studioLimit} generations / month on Studio`, "Parallel ×2 versions", "Mastered WAV export", "Everything in Pro"],
      primaryLabel: isFr ? "Passer Studio" : "Go Studio",
      secondaryLabel: isFr ? "Rester en ×1" : "Stay on ×1",
      targetPlan: "studio",
    };
  }

  if (reason === "feature_voice_to_song") {
    return {
      title: isFr ? "Voix → paroles illimité" : "Unlimited voice → lyrics",
      description: isFr
        ? "Free et Pro ont quelques essais par mois. Studio+ : enregistre ou upload ta voix, transcription auto, puis chanson ACE avec tes paroles."
        : "Free and Pro get a few trials per month. Studio+: record or upload your voice, auto transcript, then ACE song with your lyrics.",
      bullets: isFr
        ? ["Enregistrement micro + upload audio", "Transcription → paroles Song Mode", "Illimité sur Studio et Plus", `${studioLimit} générations / mois sur Studio`]
        : ["Mic recording + audio upload", "Transcript → Song Mode lyrics", "Unlimited on Studio & Plus", `${studioLimit} generations / month on Studio`],
      primaryLabel: isFr ? "Passer Studio" : "Go Studio",
      secondaryLabel: isFr ? "Continuer l'essai" : "Keep trial",
      targetPlan: "studio",
    };
  }

  if (reason === "feature_voice_clone") {
    return {
      title: isFr ? "Clone vocal illimité" : "Unlimited voice clone",
      description: isFr
        ? "Sauvegarde ton timbre et génère des chansons ACE avec TA voix — illimité sur Studio+."
        : "Save your timbre and generate ACE songs with YOUR voice — unlimited on Studio+.",
      bullets: isFr
        ? ["Profils vocaux persistants", "reference_audio ACE (timbre)", "Transcription voix → paroles", `${studioLimit} générations / mois sur Studio`]
        : ["Persistent voice profiles", "ACE reference_audio timbre", "Voice → lyrics transcription", `${studioLimit} generations / month on Studio`],
      primaryLabel: isFr ? "Passer Studio" : "Go Studio",
      secondaryLabel: isFr ? "Continuer l'essai" : "Keep trial",
      targetPlan: "studio",
    };
  }

  if (reason === "feature_priority") {
    const targetPriority = priorityUpsellTarget(plan);
    return {
      title: isFr ? "Priorité génération" : "Generation priority",
      description:
        cur === "free"
          ? isFr
            ? "Le réseau est chargé. Passe Pro pour sauter la file free et enchaîner tes sessions."
            : "The network is busy. Go Pro to skip the free queue and keep your flow."
          : isFr
            ? "Tu es en Pro/Studio mais la charge est forte. Plus = priorité max + quota ×4."
            : "You're on Pro/Studio but load is high. Plus = max priority + 4× quota.",
      bullets:
        targetPriority === "pro"
          ? isFr
            ? [`${proLimit} générations / mois`, "File prioritaire vs Free", "Export MP3 & droits commerciaux", planPriceUpsellLabel("pro", "fr")]
            : [`${proLimit} generations / month`, "Priority queue vs Free", "MP3 export & commercial rights", planPriceUpsellLabel("pro", "en")]
          : isFr
            ? [`${plusLimit} générations / mois`, "Priorité serveur max", "Audio hébergé permanent", "Stems ZIP inclus"]
            : [`${plusLimit} generations / month`, "Max server priority", "Permanent hosted audio", "Stems ZIP included"],
      primaryLabel:
        targetPriority === "pro"
          ? isFr
            ? `Passer Pro — ${planPriceLabel("pro", "fr", { suffix: true })}`
            : `Go Pro — ${planPriceLabel("pro", "en", { suffix: true })}`
          : isFr
            ? `Passer Plus — ${planPriceLabel("plus", "fr", { suffix: true })}`
            : `Go Plus — ${planPriceLabel("plus", "en", { suffix: true })}`,
      secondaryLabel: isFr ? "Réessayer plus tard" : "Try again later",
      targetPlan: targetPriority,
    };
  }

  if (reason === "feature_stems") {
    return {
      title: isFr ? "Stems séparés (Plus)" : "Separate stems (Plus)",
      description: isFr
        ? "Télécharge les pistes ACE en ZIP — idéal pour mixer dans ton DAW."
        : "Download ACE tracks as a ZIP — perfect for mixing in your DAW.",
      bullets: isFr
        ? [`${plusLimit} générations / mois`, "Stems ZIP par track", "Audio hébergé permanent", planPriceUpsellLabel("plus", "fr")]
        : [`${plusLimit} generations / month`, "Stems ZIP per track", "Permanent hosted audio", planPriceUpsellLabel("plus", "en")],
      primaryLabel: isFr ? `Passer Plus — ${planPriceLabel("plus", "fr", { suffix: true })}` : `Go Plus — ${planPriceLabel("plus", "en", { suffix: true })}`,
      secondaryLabel: isFr ? "Plus tard" : "Not now",
      targetPlan: "plus",
    };
  }

  if (reason === "feature_no_watermark") {
    return {
      title: isFr ? "Partage sans watermark" : "Share without watermark",
      description: isFr
        ? "Tes vidéos virales sans logo ProducerHit — inclus dès Pro."
        : "Your viral videos without the ProducerHit logo — included from Pro.",
      bullets: isFr
        ? ["Watermark retiré", "Droits commerciaux", `${proLimit} gen / mois`, planPriceUpsellLabel("pro", "fr")]
        : ["No watermark", "Commercial rights", `${proLimit} gen / month`, planPriceUpsellLabel("pro", "en")],
      primaryLabel: isFr ? `Passer Pro — ${planPriceLabel("pro", "fr", { suffix: true })}` : `Go Pro — ${planPriceLabel("pro", "en", { suffix: true })}`,
      secondaryLabel: isFr ? "Garder le watermark" : "Keep watermark",
      targetPlan: "pro",
    };
  }

  if (reason === "feature_permanent_audio") {
    const targetAudio: PaidPlanId = cur === "free" ? "pro" : "plus";
    return {
      title: isFr ? "Garde tes sons en ligne" : "Keep your tracks online",
      description:
        cur === "free"
          ? isFr
            ? "Free = 24h d'hébergement. Pro = 3 jours, Plus = permanent tant que tu es abonné."
            : "Free = 24h hosting. Pro = 3 days, Plus = permanent while subscribed."
          : isFr
            ? "Passe Plus pour des liens audio permanents — plus de tracks expirées."
            : "Go Plus for permanent audio links — no more expired tracks.",
      bullets:
        targetAudio === "pro"
          ? isFr
            ? [`${LOOP_AUDIO_RETENTION_DAYS_PRO} jours d'hébergement`, `${proLimit} gen / mois`, "Export WAV", planPriceUpsellLabel("pro", "fr")]
            : [`${LOOP_AUDIO_RETENTION_DAYS_PRO}-day hosting`, `${proLimit} gen / month`, "WAV export", planPriceUpsellLabel("pro", "en")]
          : isFr
            ? ["Hébergement permanent", "Stems ZIP", `${plusLimit} gen / mois`, planPriceUpsellLabel("plus", "fr")]
            : ["Permanent hosting", "Stems ZIP", `${plusLimit} gen / month`, planPriceUpsellLabel("plus", "en")],
      primaryLabel: primaryForTarget,
      secondaryLabel: isFr ? "Voir Library" : "Open Library",
      targetPlan: targetAudio,
    };
  }

  if (reason === "feature_commercial_download") {
    return {
      title: isFr ? "Droits commerciaux requis" : "Commercial rights required",
      description: isFr
        ? COMMERCIAL_RIGHTS_FAQ.fr.a
        : COMMERCIAL_RIGHTS_FAQ.en.a,
      bullets: isFr
        ? [`Pro : ${proLimit} gen / mois`, "Spotify · YouTube · clients", "Export WAV", planPriceUpsellLabel("pro", "fr")]
        : [`Pro: ${proLimit} gen / month`, "Spotify · YouTube · clients", "WAV export", planPriceUpsellLabel("pro", "en")],
      primaryLabel: isFr ? `Passer Pro — ${planPriceLabel("pro", "fr", { suffix: true })}` : `Go Pro — ${planPriceLabel("pro", "en", { suffix: true })}`,
      secondaryLabel: isFr ? "Usage perso uniquement" : "Personal use only",
      targetPlan: "pro",
    };
  }

  if (reason === "credits_low") {
    const label = planDisplayName(cur);
    if (cur !== "free") {
      return {
        title: isFr ? "Quota mensuel presque atteint" : "Monthly quota almost reached",
        description: isFr
          ? `Plan ${label} (${baseLimit}/mois) — ${remaining} génération${remaining !== 1 ? "s" : ""} restante${remaining !== 1 ? "s" : ""}.`
          : `${label} plan (${baseLimit}/month) — ${remaining} generation${remaining !== 1 ? "s" : ""} left.`,
        bullets: isFr
          ? target === "plus"
            ? [`${PLAN_LIMITS.plus} générations / mois sur Plus`, "Audio hébergé permanent", "Stems ZIP séparés"]
            : [`${studioLimit} générations / mois sur Studio`, "Export WAV mastering", "Tout Pro inclus"]
          : target === "plus"
            ? [`${PLAN_LIMITS.plus} generations / month on Plus`, "Permanent hosted audio", "Separate stems ZIP"]
            : [`${studioLimit} generations / month on Studio`, "Mastered WAV export", "Everything in Pro"],
        primaryLabel: target ? primaryForTarget : isFr ? "Voir les tarifs" : "View pricing",
        secondaryLabel: isFr ? "Fermer" : "Close",
        targetPlan: target,
      };
    }
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
      primaryLabel: isFr ? `Passer Pro — ${planPriceLabel("pro", "fr", { suffix: true })}` : `Go Pro — ${planPriceLabel("pro", "en", { suffix: true })}`,
      secondaryLabel: isFr ? "Plus tard" : "Not now",
      targetPlan: "pro",
    };
  }

  if (reason === "post_generation") {
    if (cur !== "free") {
      return getUpsellCopy("limit_reached", locale, plan, ctx);
    }
    return {
      title: isFr ? "Tu produis sérieusement 🔥" : "You're on a roll 🔥",
      description: isFr
        ? `Free = ${baseLimit} générations / mois. Upgrade pour enchaîner sans compter chaque crédit.`
        : `Free = ${baseLimit} generations / month. Upgrade to keep creating without watching every credit.`,
      bullets: isFr
        ? [`Pro : ${proLimit} gen / mois`, "Priorité file", "Song Mode + Remix", "Plus de bonus daily & niveau"]
        : [`Pro: ${proLimit} gen / month`, "Priority queue", "Song Mode + Remix", "More daily & level bonuses"],
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
          ? [`${proLimit} générations / mois`, "Priorité vs Free", "Song Mode + Remix Studio", planPriceUpsellLabel("pro", "fr")]
          : [`${proLimit} generations / month`, "Priority vs Free", "Song Mode + Remix Studio", planPriceUpsellLabel("pro", "en")]
        : target === "studio"
          ? isFr
            ? [`${studioLimit} générations / mois`, "Versions ×2 en parallèle", "Export WAV mastering", planPriceUpsellLabel("studio", "fr")]
            : [`${studioLimit} generations / month`, "Parallel ×2 versions", "Mastered WAV export", planPriceUpsellLabel("studio", "en")]
          : target === "plus"
            ? isFr
              ? [
                  `${plusLimit} générations / mois (vs ${studioLimit} Studio)`,
                  "Audio hébergé permanent",
                  "Stems & export rapide",
                  "Pour enchaîner sans limite",
                ]
              : [
                  `${plusLimit} generations / month (vs ${studioLimit} Studio)`,
                  "Permanently hosted audio",
                  "Stems & audio fast export",
                  "Keep creating without hitting the wall",
                ]
            : isFr
              ? ["Bonus demain (daily & niveau)", "Invite un pote = crédits", "Tes tracks restent dans la bibliothèque"]
              : ["Bonuses tomorrow (daily & level)", "Invite friends = credits", "Your tracks stay in the library"],
    primaryLabel: target ? primaryForTarget : isFr ? "Voir les tarifs" : "View pricing",
    secondaryLabel: isFr ? "Fermer" : "Close",
    targetPlan: target,
  };
}
