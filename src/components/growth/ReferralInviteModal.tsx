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

type Props = {
  open: boolean;
  onClose: () => void;
  locale: AppLocale;
  referralCode: string | null;
};

export function ReferralInviteModal({ open, onClose, locale, referralCode }: Props) {
  const isFr = locale === "fr";
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
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-violet-400/25 bg-[#07070f] shadow-[0_0_100px_rgba(124,58,237,0.28)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white"
          aria-label={isFr ? "Fermer" : "Close"}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-white/10 bg-gradient-to-br from-violet-600/25 via-[#0c0c18] to-cyan-500/15 px-6 pb-5 pt-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/15">
            <Gift className="h-7 w-7 text-violet-200" />
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/80">
            {isFr ? "Offre parrainage" : "Referral offer"}
          </p>
          <h2 className="mt-2 text-balance text-xl font-bold tracking-tight text-white sm:text-2xl">
            {isFr ? "Double le free plan de tes potes" : "Double your friends' free plan"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            {isFr
              ? `Inratable : ils démarrent avec ${REFERRAL_REFEREE_START_TOTAL} générations. Tu gagnes +${REFERRAL_REFERRER_SIGNUP_BONUS} dès qu'ils s'inscrivent via ton lien.`
              : `Unbeatable: they start with ${REFERRAL_REFEREE_START_TOTAL} generations. You earn +${REFERRAL_REFERRER_SIGNUP_BONUS} as soon as they sign up with your link.`}
          </p>
        </div>

        <div className="space-y-3 px-6 py-5">
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
            <div className="text-sm text-white/80">
              <span className="font-semibold text-white">{isFr ? "Pour eux" : "For them"}</span>
              <div className="mt-1 text-white/60">
                {isFr
                  ? `${REFERRAL_REFEREE_START_TOTAL} gen dès l'inscription (${REFERRAL_REFEREE_START_TOTAL - REFERRAL_REFEREE_BONUS} free + ${REFERRAL_REFEREE_BONUS} bonus lien)`
                  : `${REFERRAL_REFEREE_START_TOTAL} gens on signup (${REFERRAL_REFEREE_START_TOTAL - REFERRAL_REFEREE_BONUS} free + ${REFERRAL_REFEREE_BONUS} link bonus)`}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
            <div className="text-sm text-white/80">
              <span className="font-semibold text-white">{isFr ? "Pour toi" : "For you"}</span>
              <div className="mt-1 text-white/60">
                {isFr
                  ? `+${REFERRAL_REFERRER_SIGNUP_BONUS} générations dès qu'un filleul s'inscrit via ton lien`
                  : `+${REFERRAL_REFERRER_SIGNUP_BONUS} generations when someone signs up with your link`}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.06] p-3.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            <div className="text-sm text-white/75">
              {isFr
                ? "Ensuite : loot daily, niveaux, streaks — la machine à bonus continue."
                : "Then: daily loot, levels, streaks — the bonus machine keeps rolling."}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/25 p-4">
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
            className="mt-2 w-full py-2 text-xs font-semibold text-white/45 hover:text-white/70"
          >
            {isFr ? "Plus tard" : "Maybe later"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
