import { useState } from "react";
import toast from "react-hot-toast";
import { captureMarketingLead } from "@/lib/emailCapture";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/i18n/config";
import "@/styles/email-capture.css";

type Props = {
  locale: AppLocale;
  source?: string;
  className?: string;
  compact?: boolean;
};

export function EmailCaptureSection({ locale, source = "landing_footer", className, compact }: Props) {
  const isFr = locale === "fr";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || done) return;
    setLoading(true);
    const result = await captureMarketingLead({ email, locale, source });
    setLoading(false);
    if (!result.ok) {
      toast.error(
        result.error === "rate_limited"
          ? isFr
            ? "Trop de tentatives — réessaie dans une heure."
            : "Too many attempts — try again in an hour."
          : isFr
            ? "Email invalide ou erreur."
            : "Invalid email or error.",
      );
      return;
    }
    setDone(true);
    toast.success(
      isFr ? "Tu es inscrit — on te prévient des drops 🔥" : "You're in — we'll notify you on drops 🔥",
      { duration: 4500 },
    );
  };

  if (done) {
    return (
      <div className={cn("rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100", className)}>
        {isFr ? "Merci — tu recevras nos prochaines actus product & beats exclusifs." : "Thanks — you'll get product updates and exclusive beat drops."}
      </div>
    );
  }

  return (
    <section className={cn("pk-email-capture", className)} aria-label={isFr ? "Newsletter" : "Newsletter"}>
      {!compact ? (
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-white">
            {isFr ? "Reste dans la vibe" : "Stay in the loop"}
          </h3>
          <p className="mt-1 text-sm text-white/65">
            {isFr
              ? "Nouveaux genres, features IA et offres — sans spam."
              : "New genres, AI features and offers — no spam."}
          </p>
        </div>
      ) : null}
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={isFr ? "ton@email.com" : "you@email.com"}
          className="pk-email-capture__input"
        />
        <button
          type="submit"
          disabled={loading}
          className="pk-email-capture__btn shrink-0"
        >
          {loading ? (isFr ? "…" : "…") : isFr ? "Rejoindre" : "Join"}
        </button>
      </form>
    </section>
  );
}
