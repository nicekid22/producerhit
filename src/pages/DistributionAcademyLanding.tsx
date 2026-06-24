import { useEffect } from "react";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Navbar } from "@/components/Navbar";
import { DistributionAcademyExperience } from "@/components/academy/DistributionAcademyExperience";
import { useLocaleStore } from "@/stores/localeStore";
import { DISTRIBUTION_ACADEMY_MODULES, DISTRIBUTION_ACADEMY_VALUE_USD } from "@/content/academy/distribution/modules";

const FAQ_EN = [
  {
    q: "Is this course really included?",
    a: "Yes — Distribution & Monetization Academy ($497 value) is included with Studio and Plus subscriptions at no extra cost.",
  },
  {
    q: "Can I distribute AI music on Spotify?",
    a: "Yes, when you own the commercial rights and follow your distributor's AI disclosure rules. ProducerHit packs include a commercial license for Pro+ tracks.",
  },
  {
    q: "Do I need a direct connection to Spotify or Apple Music?",
    a: "No — ProducerHit ships a manual upload ZIP for DistroKid, TuneCore, CD Baby, and similar services.",
  },
];

const FAQ_FR = [
  {
    q: "La formation est vraiment incluse ?",
    a: "Oui — Distribution & Monetization Academy (valeur 497 $) est incluse avec Studio et Plus sans frais supplémentaires.",
  },
  {
    q: "Puis-je distribuer de la musique IA sur Spotify ?",
    a: "Oui, si tu détiens les droits commerciaux et respectes les règles IA de ton distributeur. Les packs incluent une licence commerciale pour les titres Pro+.",
  },
  {
    q: "Ai-je besoin d'une connexion directe à Spotify ou Apple Music ?",
    a: "Non — ProducerHit fournit un ZIP pour upload manuel sur DistroKid, TuneCore, CD Baby, etc.",
  },
];

function injectJsonLd(origin: string, isFr: boolean) {
  const module1 = DISTRIBUTION_ACADEMY_MODULES[0]!;
  const faq = isFr ? FAQ_FR : FAQ_EN;
  const payload = [
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: isFr
        ? "Formation distribuer musique IA"
        : "Distribution & Monetization Academy for AI Music",
      description: isFr ? module1.summaryFr : module1.summaryEn,
      provider: { "@type": "Organization", name: "ProducerHit", url: origin },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: isFr
          ? `Inclus Studio/Plus — valeur ${DISTRIBUTION_ACADEMY_VALUE_USD} $`
          : `Included with Studio/Plus — $${DISTRIBUTION_ACADEMY_VALUE_USD} value`,
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: "PT2H30M",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((x) => ({
        "@type": "Question",
        name: x.q,
        acceptedAnswer: { "@type": "Answer", text: x.a },
      })),
    },
  ];
  const id = "distribution-academy-ld";
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(payload);
}

export default function DistributionAcademyLandingPage() {
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const lang = isFr ? "fr" : "en";

  useEffect(() => {
    const origin = window.location.origin;
    injectJsonLd(origin, isFr);
    return () => {
      document.getElementById("distribution-academy-ld")?.remove();
    };
  }, [isFr]);

  const faq = isFr ? FAQ_FR : FAQ_EN;

  return (
    <MarketingPageShell>
      <Navbar variant="marketing" />
      <main>
        <DistributionAcademyExperience locale={lang} variant="public" />

        <section className="pk-academy-page mx-auto max-w-3xl px-4 pb-20 md:px-6">
          <h2 className="pk-academy-faq__title">FAQ</h2>
          <dl className="mt-4 space-y-3">
            {faq.map((item) => (
              <div key={item.q} className="pk-academy-faq__item">
                <dt className="pk-academy-faq__q">{item.q}</dt>
                <dd className="pk-academy-faq__a">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </MarketingPageShell>
  );
}
