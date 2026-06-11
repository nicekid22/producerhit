import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Navbar } from "@/components/Navbar";
import { useLocaleStore } from "@/stores/localeStore";

export default function Legal() {
  const locale = useLocaleStore((s) => s.locale);

  const isFr = locale === "fr";
  const title = isFr ? "Mentions légales & politiques" : "Legal & Policies";
  const email = "info.producermarket@gmail.com";

  const updatedAt = "2026-06-05";

  const labels = {
    toc: isFr ? "Accès rapide" : "Quick links",
    updatedAt: isFr ? "Dernière mise à jour" : "Last updated",
    privacy: isFr ? "Politique de confidentialité" : "Privacy Policy",
    terms: isFr ? "Conditions d’utilisation" : "Terms of Service",
    commercialLicense: isFr ? "Licence commerciale & droits" : "Commercial license & rights",
    cookies: isFr ? "Politique cookies" : "Cookie Policy",
    refunds: isFr ? "Paiements & remboursements" : "Payments & Refunds",
    acceptableUse: isFr ? "Règles d’usage (Acceptable Use)" : "Acceptable Use",
    dmca: isFr ? "Signalement / droits d’auteur (DMCA)" : "Copyright / DMCA",
    contact: isFr ? "Support / Contact" : "Support / Contact",
  };

  const sections = [
    {
      id: "privacy",
      title: labels.privacy,
      body: isFr ? (
        <>
          <p>
            ProducerHit collecte uniquement les informations nécessaires au fonctionnement du service (création de compte, sessions, usage, historique des
            générations si tu les sauvegardes).
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Données de compte et d’authentification (via Supabase).</li>
            <li>Données de facturation (via Stripe). ProducerHit ne stocke pas ton numéro de carte.</li>
            <li>Données d’usage (crédits / générations) pour appliquer les limites de ton plan.</li>
            <li>Contenus générés: visibles seulement pour toi, sauf si tu marques une création comme publique.</li>
          </ul>
          <p className="mt-3">
            Tu peux demander la suppression de ton compte et de tes données en écrivant à{" "}
            <a className="font-semibold text-pk-accent hover:underline" href={`mailto:${email}`}>
              {email}
            </a>
            .
          </p>
        </>
      ) : (
        <>
          <p>
            ProducerHit only collects data needed to operate the service (account creation, sessions, usage, and your saved generations if you choose to
            store them).
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Account and authentication data (via Supabase).</li>
            <li>Billing data (via Stripe). ProducerHit does not store your card number.</li>
            <li>Usage data (credits / generations) to enforce plan limits.</li>
            <li>Generated content is private unless you mark a creation as public.</li>
          </ul>
          <p className="mt-3">
            You can request account/data deletion by emailing{" "}
            <a className="font-semibold text-pk-accent hover:underline" href={`mailto:${email}`}>
              {email}
            </a>
            .
          </p>
        </>
      ),
    },
    {
      id: "terms",
      title: labels.terms,
      body: isFr ? (
        <>
          <p>En utilisant ProducerHit, tu acceptes de respecter les règles suivantes:</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Tu es responsable des prompts, contenus générés, et de leur utilisation.</li>
            <li>Tu ne dois pas utiliser le service pour générer du contenu illégal, haineux, harcelant ou portant atteinte aux droits d’autrui.</li>
            <li>Le service peut produire des résultats imparfaits (artefacts, erreurs, incohérences). Il n’y a aucune garantie de résultat.</li>
            <li>
              Les droits et usages commerciaux dépendent de ton plan ProducerHit et des conditions des fournisseurs de modèles (voir{" "}
              <a className="font-semibold text-pk-accent hover:underline" href="#commercial-license">
                Licence commerciale
              </a>
              ).
            </li>
          </ul>
          <p className="mt-3">
            ProducerHit peut suspendre un compte en cas d’abus, de fraude, de tentative de contournement des limites, ou de violation de ces règles.
          </p>
        </>
      ) : (
        <>
          <p>By using ProducerHit, you agree to:</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>You are responsible for your prompts, generated content, and how you use it.</li>
            <li>You must not use the service to generate illegal, hateful, harassing, or rights-infringing content.</li>
            <li>The service may produce imperfect results (artifacts, errors, inconsistencies). No output quality guarantee is provided.</li>
            <li>
              Rights and commercial use depend on your ProducerHit plan and model provider terms (see{" "}
              <a className="font-semibold text-pk-accent hover:underline" href="#commercial-license">
                Commercial license
              </a>
              ).
            </li>
          </ul>
          <p className="mt-3">ProducerHit may suspend accounts for abuse, fraud, limit circumvention, or violations of these rules.</p>
        </>
      ),
    },
    {
      id: "commercial-license",
      title: labels.commercialLicense,
      body: isFr ? (
        <>
          <p>
            ProducerHit te permet de générer de la musique IA et de l’exporter selon ton abonnement. Cette section clarifie ce que tu peux faire
            commercialement avec tes exports — sans remplacer les règles des plateformes (Spotify, YouTube, BeatStars, etc.) ni celles du moteur IA sous-jacent
            (ACE Step).
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-pk-border">
                  <th className="py-2 pr-4 font-semibold text-pk-text">Plan</th>
                  <th className="py-2 pr-4 font-semibold text-pk-text">Usage commercial</th>
                  <th className="py-2 pr-4 font-semibold text-pk-text">Exports</th>
                  <th className="py-2 font-semibold text-pk-text">Stems (ZIP)</th>
                </tr>
              </thead>
              <tbody className="text-pk-muted">
                <tr className="border-b border-pk-border/60">
                  <td className="py-2 pr-4">Free</td>
                  <td className="py-2 pr-4">Usage personnel / démo uniquement</td>
                  <td className="py-2 pr-4">MP3</td>
                  <td className="py-2">Non</td>
                </tr>
                <tr className="border-b border-pk-border/60">
                  <td className="py-2 pr-4">Pro</td>
                  <td className="py-2 pr-4">Oui — royalty-free pour tes projets (vidéos, beats, streaming)</td>
                  <td className="py-2 pr-4">MP3 + WAV</td>
                  <td className="py-2">Non</td>
                </tr>
                <tr className="border-b border-pk-border/60">
                  <td className="py-2 pr-4">Studio</td>
                  <td className="py-2 pr-4">Oui — idem Pro + mastering complet</td>
                  <td className="py-2 pr-4">MP3 + WAV</td>
                  <td className="py-2">Non</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Plus</td>
                  <td className="py-2 pr-4">Oui — idem Pro/Studio</td>
                  <td className="py-2 pr-4">MP3 + WAV + pistes séparées (ZIP)</td>
                  <td className="py-2">Oui (si le moteur les fournit)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-pk-text">Royalty-free</strong> signifie que ProducerHit ne te facture pas de redevances supplémentaires sur les exports
              inclus dans ton plan. Cela ne garantit pas l’enregistrement automatique auprès d’une société de gestion (SACEM, ASCAP, etc.).
            </li>
            <li>
              Tu restes responsable du contenu de tes prompts (samples, noms d’artistes, paroles) et du respect des règles des plateformes de distribution.
            </li>
            <li>
              Les fichiers stems (vocals, drums, etc.) sont disponibles sur le plan Plus lorsque le moteur ACE les génère ; leur absence ponctuelle n’ouvre pas
              droit à remboursement automatique.
            </li>
            <li>
              En cas de doute avant une release majeure (label, sync TV, pub), contacte{" "}
              <a className="font-semibold text-pk-accent hover:underline" href={`mailto:${email}`}>
                {email}
              </a>
              .
            </li>
          </ul>
        </>
      ) : (
        <>
          <p>
            ProducerHit lets you generate AI music and export it according to your subscription. This section clarifies what you may do commercially with your
            exports — without replacing platform rules (Spotify, YouTube, BeatStars, etc.) or the underlying AI engine terms (ACE Step).
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-pk-border">
                  <th className="py-2 pr-4 font-semibold text-pk-text">Plan</th>
                  <th className="py-2 pr-4 font-semibold text-pk-text">Commercial use</th>
                  <th className="py-2 pr-4 font-semibold text-pk-text">Exports</th>
                  <th className="py-2 font-semibold text-pk-text">Stems (ZIP)</th>
                </tr>
              </thead>
              <tbody className="text-pk-muted">
                <tr className="border-b border-pk-border/60">
                  <td className="py-2 pr-4">Free</td>
                  <td className="py-2 pr-4">Personal / demo only</td>
                  <td className="py-2 pr-4">MP3</td>
                  <td className="py-2">No</td>
                </tr>
                <tr className="border-b border-pk-border/60">
                  <td className="py-2 pr-4">Pro</td>
                  <td className="py-2 pr-4">Yes — royalty-free for your projects (videos, beats, streaming)</td>
                  <td className="py-2 pr-4">MP3 + WAV</td>
                  <td className="py-2">No</td>
                </tr>
                <tr className="border-b border-pk-border/60">
                  <td className="py-2 pr-4">Studio</td>
                  <td className="py-2 pr-4">Yes — same as Pro + full mastering</td>
                  <td className="py-2 pr-4">MP3 + WAV</td>
                  <td className="py-2">No</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Plus</td>
                  <td className="py-2 pr-4">Yes — same as Pro/Studio</td>
                  <td className="py-2 pr-4">MP3 + WAV + separate stems (ZIP)</td>
                  <td className="py-2">Yes (when the engine provides them)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-pk-text">Royalty-free</strong> means ProducerHit does not charge additional royalties on exports included in your plan. It
              does not guarantee automatic registration with a PRO (SACEM, ASCAP, etc.).
            </li>
            <li>You remain responsible for prompt content (samples, artist names, lyrics) and platform distribution rules.</li>
            <li>
              Stem files (vocals, drums, etc.) are available on Plus when the ACE engine generates them; occasional unavailability is not grounds for automatic
              refund.
            </li>
            <li>
              For major releases (label, TV sync, ads), contact{" "}
              <a className="font-semibold text-pk-accent hover:underline" href={`mailto:${email}`}>
                {email}
              </a>{" "}
              if unsure.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "cookies",
      title: labels.cookies,
      body: isFr ? (
        <>
          <p>
            ProducerHit utilise principalement le stockage local du navigateur pour mémoriser certaines préférences (ex: langue) et la session utilisateur.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Préférences (langue, options UI).</li>
            <li>Session d’authentification et sécurité (via Supabase).</li>
          </ul>
          <p className="mt-3">Si nous ajoutons des outils analytics ou pixels marketing, cette page sera mise à jour.</p>
        </>
      ) : (
        <>
          <p>ProducerHit primarily uses browser storage to remember preferences (e.g., language) and user sessions.</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Preferences (language, UI options).</li>
            <li>Authentication session and security (via Supabase).</li>
          </ul>
          <p className="mt-3">If we add analytics or marketing pixels, this page will be updated.</p>
        </>
      ),
    },
    {
      id: "refunds",
      title: labels.refunds,
      body: isFr ? (
        <>
          <p>
            Les abonnements sont gérés via Stripe. Tu peux annuler à tout moment depuis ton espace client (Stripe Customer Portal) afin d’éviter le prochain
            renouvellement.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Les crédits/générations mensuels se réinitialisent selon la période de facturation.</li>
            <li>Les remboursements ne sont pas garantis (service numérique). On peut étudier un cas au cas par cas en cas de problème technique majeur.</li>
          </ul>
          <p className="mt-3">
            Pour toute demande liée à un paiement, contacte{" "}
            <a className="font-semibold text-pk-accent hover:underline" href={`mailto:${email}`}>
              {email}
            </a>
            .
          </p>
        </>
      ) : (
        <>
          <p>
            Subscriptions are handled via Stripe. You can cancel anytime via the Stripe Customer Portal to prevent the next renewal.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Monthly credits/generations reset based on your billing period.</li>
            <li>Refunds are not guaranteed for digital services; we may review requests case-by-case for major technical issues.</li>
          </ul>
          <p className="mt-3">
            For billing questions, contact{" "}
            <a className="font-semibold text-pk-accent hover:underline" href={`mailto:${email}`}>
              {email}
            </a>
            .
          </p>
        </>
      ),
    },
    {
      id: "acceptable-use",
      title: labels.acceptableUse,
      body: isFr ? (
        <>
          <p>Exemples d’usages interdits:</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Contenu illégal, incitation à la violence, harcèlement, haine.</li>
            <li>Tentatives de contournement des limites, automatisation abusive, scraping.</li>
            <li>Usurpation d’identité ou violations manifestes de droits d’auteur.</li>
          </ul>
        </>
      ) : (
        <>
          <p>Examples of prohibited use:</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Illegal content, incitement to violence, harassment, hate.</li>
            <li>Limit circumvention, abusive automation, scraping.</li>
            <li>Impersonation or obvious copyright infringement.</li>
          </ul>
        </>
      ),
    },
    {
      id: "dmca",
      title: labels.dmca,
      body: isFr ? (
        <>
          <p>
            Si tu penses qu’un contenu public sur ProducerHit viole tes droits, envoie un email avec les informations pertinentes (lien, preuve de droits,
            explication) à{" "}
            <a className="font-semibold text-pk-accent hover:underline" href={`mailto:${email}`}>
              {email}
            </a>
            .
          </p>
        </>
      ) : (
        <>
          <p>
            If you believe public content on ProducerHit infringes your rights, email details (link, proof of rights, explanation) to{" "}
            <a className="font-semibold text-pk-accent hover:underline" href={`mailto:${email}`}>
              {email}
            </a>
            .
          </p>
        </>
      ),
    },
    {
      id: "contact",
      title: labels.contact,
      body: isFr ? (
        <p>
          Support:{" "}
          <a className="font-semibold text-pk-accent hover:underline" href={`mailto:${email}`}>
            {email}
          </a>
        </p>
      ) : (
        <p>
          Support:{" "}
          <a className="font-semibold text-pk-accent hover:underline" href={`mailto:${email}`}>
            {email}
          </a>
        </p>
      ),
    },
  ] as const;

  return (
    <MarketingPageShell className="text-pk-text">
      <Navbar variant="marketing" />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <div className="mt-2 text-sm text-pk-muted">
          {labels.updatedAt}: {updatedAt}
        </div>

        <section className="mt-6 rounded-2xl border border-pk-border bg-pk-panel/70 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="text-sm font-semibold">{labels.toc}</div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {sections.map((s) => (
              <a key={s.id} className="font-semibold text-pk-accent hover:underline" href={`#${s.id}`}>
                {s.title}
              </a>
            ))}
          </div>
        </section>

        {sections.map((s) => (
          <section key={s.id} id={s.id} className="mt-4 rounded-2xl border border-pk-border bg-pk-panel/60 p-6 backdrop-blur-xl">
            <div className="text-lg font-semibold">{s.title}</div>
            <div className="prose prose-invert prose-sm mt-3 max-w-none text-pk-muted">{s.body}</div>
          </section>
        ))}
      </main>
    </MarketingPageShell>
  );
}
