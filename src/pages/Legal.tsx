import { Navbar } from "@/components/Navbar";
import { useLocaleStore } from "@/stores/localeStore";

export default function Legal() {
  const locale = useLocaleStore((s) => s.locale);

  const isFr = locale === "fr";
  const title = isFr ? "Mentions légales" : "Legal";
  const privacyTitle = isFr ? "Politique de confidentialité" : "Privacy Policy";
  const termsTitle = isFr ? "Conditions d’utilisation" : "Terms of Service";
  const contactTitle = isFr ? "Support / Contact" : "Support / Contact";

  const privacyBody = isFr
    ? "ProducerHit utilise Supabase (auth + base de données) et Stripe (paiements) pour fournir le service. Nous collectons les informations nécessaires au fonctionnement (compte, sessions, usage) et n’affichons en public que les contenus que tu marques comme publics."
    : "ProducerHit uses Supabase (auth + database) and Stripe (payments) to provide the service. We collect what’s needed to operate (account, sessions, usage) and only show content publicly when you mark it as public.";

  const termsBody = isFr
    ? "En utilisant ProducerHit, tu acceptes de respecter les règles de la plateforme et les conditions des fournisseurs de modèles. Tu es responsable des contenus générés et de leur usage commercial selon les termes des providers."
    : "By using ProducerHit, you agree to follow platform rules and the model/provider terms. You are responsible for generated content and any commercial use according to provider terms.";

  const contactBody = isFr
    ? "Pour toute question: info.producermarket@gmail.com"
    : "For support: info.producermarket@gmail.com";

  return (
    <div className="min-h-screen bg-[#f8f7ff] text-[#1a1a2e]">
      <Navbar variant="marketing" />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>

        <section id="privacy" className="mt-10 rounded-[12px] border border-[#e5e7eb] bg-white p-6">
          <div className="text-lg font-semibold">{privacyTitle}</div>
          <div className="mt-3 text-sm text-[#6b7280]">{privacyBody}</div>
        </section>

        <section id="terms" className="mt-4 rounded-[12px] border border-[#e5e7eb] bg-white p-6">
          <div className="text-lg font-semibold">{termsTitle}</div>
          <div className="mt-3 text-sm text-[#6b7280]">{termsBody}</div>
        </section>

        <section id="contact" className="mt-4 rounded-[12px] border border-[#e5e7eb] bg-white p-6">
          <div className="text-lg font-semibold">{contactTitle}</div>
          <div className="mt-3 text-sm text-[#6b7280]">{contactBody}</div>
          <a className="mt-4 inline-flex text-sm font-semibold text-[#6d28d9] hover:underline" href="mailto:info.producermarket@gmail.com">
            info.producermarket@gmail.com
          </a>
        </section>
      </main>
    </div>
  );
}
