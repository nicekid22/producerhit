import { useMemo } from "react";
import type { AppLocale } from "@/i18n/config";
import { createPortal } from "react-dom";
import { Copy, Gift, Sparkles, Users, X, Zap } from "lucide-react";
import toast from "react-hot-toast";
import {
  REFERRAL_REFEREE_BONUS,
  REFERRAL_REFEREE_START_TOTAL,
  REFERRAL_REFERRER_SIGNUP_BONUS,
} from "@/lib/referralConfig";
import { buildReferralInviteUrl } from "@/lib/referral";
import { trackClientEvent } from "@/lib/supabaseClient";
import { ViralShareBar } from "@/components/growth/ViralShareBar";
import { useVisualThemeStore } from "@/stores/visualThemeStore";
import "@/styles/paywall-modal.css";

type Props = {
  open: boolean;
  onClose: () => void;
  locale: AppLocale;
  referralCode: string | null;
};

export function ReferralInviteModal({ open, onClose, locale, referralCode }: Props) {
  const isFr = locale === "fr";
  const visualTheme = useVisualThemeStore((s) => s.theme);
  const link = useMemo(() => (referralCode ? buildReferralInviteUrl(referralCode) : ""), [referralCode]);

  if (!open || typeof document === "undefined") return null;

  const copyLink = async () => {
    if (!link) {
      toast.error(isFr ? "Lien indisponible — ouvre Paramètres" : "Link unavailable — open Settings");
      return;
    }
    trackClientEvent("referral_prompt_copy", { location: "dashboard_modal" });
    await navigator.clipboard.writeText(link);
    toast.success(isFr ? "Lien copié — envoie-le à un producteur" : "Link copied — send it to a producer");
    onClose();
  };

  return createPortal(
    <div
      className="pk-growth-modal-backdrop fixed inset-0 z-[250] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`pk-growth-modal pk-veil-modal-panel relative w-full max-w-md overflow-hidden rounded-[1.75rem] pk-growth-modal--theme-${visualTheme}`}>
        <button
          type="button"
          onClick={onClose}
          className="pk-paywall__close absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full transition"
          aria-label={isFr ? "Fermer" : "Close"}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pk-growth-modal__header px-6 pb-5 pt-6 text-center">
          <div className="pk-paywall__icon mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <Gift className="h-7 w-7" />
          </div>
          <p className="pk-growth-modal__eyebrow mt-4 text-[10px] font-bold uppercase tracking-[0.22em]">
            {isFr ? "Offre parrainage" : "Referral offer"}
          </p>
          <h2 className="pk-growth-modal__title mt-2 text-balance text-xl font-bold tracking-tight sm:text-2xl">
            {isFr ? "Double le free plan de tes potes" : "Double your friends' free plan"}
          </h2>
          <p className="pk-growth-modal__subtitle mt-2 text-sm leading-relaxed">
            {isFr
              ? `Inratable : ils démarrent avec ${REFERRAL_REFEREE_START_TOTAL} générations. Tu gagnes +${REFERRAL_REFERRER_SIGNUP_BONUS} dès qu'ils s'inscrivent via ton lien.`
              : `Unbeatable: they start with ${REFERRAL_REFEREE_START_TOTAL} generations. You earn +${REFERRAL_REFERRER_SIGNUP_BONUS} as soon as they sign up with your link.`}
          </p>
        </div>

        <div className="space-y-3 px-6 py-5">
          <div className="pk-growth-modal__card flex items-start gap-3 rounded-2xl p-3.5">
            <Users className="pk-audio-retention-banner__icon mt-0.5 h-4 w-4 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">{isFr ? "Pour eux" : "For them"}</span>
              <div className="pk-growth-modal__card-muted mt-1">
                {isFr
                  ? `${REFERRAL_REFEREE_START_TOTAL} gen dès l'inscription (${REFERRAL_REFEREE_START_TOTAL - REFERRAL_REFEREE_BONUS} free + ${REFERRAL_REFEREE_BONUS} bonus lien)`
                  : `${REFERRAL_REFEREE_START_TOTAL} gens on signup (${REFERRAL_REFEREE_START_TOTAL - REFERRAL_REFEREE_BONUS} free + ${REFERRAL_REFEREE_BONUS} link bonus)`}
              </div>
            </div>
          </div>
          <div className="pk-growth-modal__card flex items-start gap-3 rounded-2xl p-3.5">
            <Zap className="pk-audio-retention-banner__icon mt-0.5 h-4 w-4 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">{isFr ? "Pour toi" : "For you"}</span>
              <div className="pk-growth-modal__card-muted mt-1">
                {isFr
                  ? `+${REFERRAL_REFERRER_SIGNUP_BONUS} générations dès qu'un filleul s'inscrit via ton lien`
                  : `+${REFERRAL_REFERRER_SIGNUP_BONUS} generations when someone signs up with your link`}
              </div>
            </div>
          </div>
          <div className="pk-growth-modal__card flex items-start gap-3 rounded-2xl p-3.5">
            <Sparkles className="pk-audio-retention-banner__icon mt-0.5 h-4 w-4 shrink-0" />
            <div className="pk-growth-modal__card-muted text-sm">
              {isFr
                ? "Ensuite : loot daily, niveaux, streaks — la machine à bonus continue."
                : "Then: daily loot, levels, streaks — the bonus machine keeps rolling."}
            </div>
          </div>
        </div>

        <div className="pk-growth-modal__footer p-4">
          <button
            type="button"
            onClick={() => void copyLink()}
            disabled={!link}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-violet-500 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-[0_0_40px_rgba(124,58,237,0.3)] transition hover:brightness-110 disabled:opacity-50"
          >
            <Copy className="h-4 w-4" />
            {isFr ? "Copier mon lien d'invitation" : "Copy my invite link"}
          </button>
          {link ? (
            <div className="mt-4">
              <ViralShareBar
                url={link}
                shareText={
                  isFr
                    ? "Je crée mes beats avec ProducerHit — essaie avec mon lien"
                    : "I make beats with ProducerHit — try with my link"
                }
                locale={locale}
                channel="referral"
              />
            </div>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="pk-growth-modal__dismiss mt-2 w-full py-2 text-xs font-semibold transition"
          >
            {isFr ? "Plus tard" : "Maybe later"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
