import { Link, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { useLocaleStore } from "@/stores/localeStore";

type SeoPageKey = "ai-beat-generator" | "ai-music-generator" | "type-beat-generator-ai" | "generate-beats-online-free" | "generic";

export default function Home() {
  const { pathname } = useLocation();
  const locale = useLocaleStore((s) => s.locale);

  const key: SeoPageKey = useMemo(() => {
    if (pathname === "/ai-beat-generator") return "ai-beat-generator";
    if (pathname === "/ai-music-generator") return "ai-music-generator";
    if (pathname === "/type-beat-generator-ai") return "type-beat-generator-ai";
    if (pathname === "/generate-beats-online-free") return "generate-beats-online-free";
    return "generic";
  }, [pathname]);

  const t = (en: string, fr: string) => (locale === "fr" ? fr : en);

  const page = useMemo(() => {
    if (key === "ai-beat-generator") {
      return {
        h1: t("AI Beat Generator", "Générateur de beats IA"),
        lead: t(
          "Generate producer-ready type beats from a text prompt. Start with short clips, generate two candidates, then lock in a vibe with seed-based variations.",
          "Génère des type beats niveau pro à partir d’un prompt. Commence avec des clips courts, génère deux versions, puis garde la vibe avec des variations via seed.",
        ),
        bullets: [
          t("Modern genres: trap, drill, afrobeats, UK garage, house, and more", "Genres modernes : trap, drill, afrobeats, UK garage, house, etc."),
          t("Short generation defaults to reduce artifacts and improve consistency", "Générations courtes par défaut pour réduire les artefacts et améliorer la cohérence"),
          t("Seed saved per result so you can generate coherent variations", "Seed sauvegardé pour créer des variations cohérentes"),
          t("MP3/WAV export depending on your plan", "Export MP3/WAV selon ton plan"),
        ],
        faq: [
          {
            q: t("What is an AI beat generator?", "C’est quoi un générateur de beats IA ?"),
            a: t(
              "An AI beat generator creates instrumental music from a text description (genre, mood, tempo). ProducerHit is optimized for quick iteration with short clips, seeds, and variations.",
              "Un générateur de beats IA crée des instrumentaux à partir d’une description (genre, mood, tempo). ProducerHit est optimisé pour itérer vite avec des clips courts, seeds et variations.",
            ),
          },
          {
            q: t("How do I get better results?", "Comment obtenir de meilleurs résultats ?"),
            a: t(
              "Generate short first, try Versions=2, then use Variation to keep the same vibe while changing details. This increases hit rate without manual tweaking.",
              "Commence court, active Versions=2, puis utilise Variation pour garder la vibe tout en changeant les détails. Ça augmente le hit rate sans prise de tête.",
            ),
          },
        ],
      };
    }
    if (key === "ai-music-generator") {
      return {
        h1: t("AI Music Generator", "Générateur de musique IA"),
        lead: t(
          "Create beats and full songs online with an AI music generator built for producers. Describe the vibe, generate, then iterate with variations.",
          "Crée des beats et des chansons en ligne avec un générateur de musique IA pensé pour les producteurs. Décris la vibe, génère, puis itère avec des variations.",
        ),
        bullets: [
          t("Generate songs with vocals or producer-grade type beats", "Génère des chansons avec voix ou des type beats niveau pro"),
          t("Pick the best take by generating two versions at once", "Choisis le meilleur résultat en générant deux versions d’un coup"),
          t("Reproducible seeds for controlled variation", "Seeds reproductibles pour des variations contrôlées"),
          t("Built for speed: generate ideas in seconds", "Pensé pour aller vite : des idées en quelques secondes"),
        ],
        faq: [
          {
            q: t("Can I generate both songs and beats?", "Je peux générer des chansons et des beats ?"),
            a: t("Yes. ProducerHit supports full songs and type beats depending on your mode.", "Oui. ProducerHit supporte chansons complètes et type beats selon le mode."),
          },
        ],
      };
    }
    if (key === "type-beat-generator-ai") {
      return {
        h1: t("Type Beat Generator AI", "Type beat generator IA"),
        lead: t(
          "Generate type beats with modern sound and fast iteration. Get a clean mix, pick a winner, then explore controlled variations with seeds.",
          "Génère des type beats au son moderne et itère rapidement. Mix clean, sélection du meilleur, puis variations contrôlées via seed.",
        ),
        bullets: [
          t("Prompt-driven: genre, vibe, mood, tempo", "Piloté par prompt : genre, vibe, mood, tempo"),
          t("Short defaults and hard caps to reduce unstable long renders", "Durées courtes par défaut + caps pour éviter les longs rendus instables"),
          t("Seed reuse to stay close to a style you like", "Réutilisation de seed pour rester proche d’un style que tu kiffes"),
          t("Export and organize in your library", "Export et organisation dans ta librairie"),
        ],
        faq: [
          {
            q: t("What is a type beat?", "C’est quoi un type beat ?"),
            a: t(
              "A type beat is an instrumental inspired by a style or artist reference (e.g. Metro Boomin type beat). Use your prompt to specify the vibe, tempo, and texture.",
              "Un type beat est un instrumental inspiré d’un style ou d’une référence artiste (ex: Metro Boomin type beat). Utilise ton prompt pour préciser vibe, tempo, texture.",
            ),
          },
        ],
      };
    }
    if (key === "generate-beats-online-free") {
      return {
        h1: t("Generate Beats Online Free", "Générer des beats en ligne gratuit"),
        lead: t(
          "Generate beats online for free with ProducerHit. Start with a short clip, pick the best version, then iterate with variations and export.",
          "Génère des beats en ligne gratuitement avec ProducerHit. Commence par un clip court, choisis la meilleure version, puis itère avec des variations et exporte.",
        ),
        bullets: [
          t("Free MP3 downloads on the free plan", "Téléchargements MP3 gratuits sur le plan free"),
          t("WAV export on paid plans", "Export WAV sur les plans payants"),
          t("Generate two versions to increase your chance of a good result", "Génère deux versions pour augmenter tes chances d’un bon résultat"),
          t("Seed-based Variation for consistent iterations", "Variation via seed pour itérations cohérentes"),
        ],
        faq: [
          {
            q: t("Is it really free to generate beats?", "C’est vraiment gratuit de générer des beats ?"),
            a: t(
              "Yes. You can generate beats on the free plan. Upgrade for more credits and WAV exports.",
              "Oui. Tu peux générer des beats sur le plan gratuit. Upgrade pour plus de crédits et l’export WAV.",
            ),
          },
        ],
      };
    }
    return {
      h1: t("AI Beat Generator", "Générateur de beats IA"),
      lead: t(
        "Generate type beats and songs online with ProducerHit. Use short generations, versions x2, and seed variations to find the best result quickly.",
        "Génère des type beats et des chansons en ligne avec ProducerHit. Utilise des générations courtes, versions x2, et variations via seed pour trouver vite le meilleur résultat.",
      ),
      bullets: [
        t("Fast AI music generation", "Génération IA rapide"),
        t("Producer-focused controls", "Contrôles pensés pour producteurs"),
        t("MP3/WAV export", "Export MP3/WAV"),
      ],
      faq: [],
    };
  }, [key, locale]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="text-sm font-semibold text-white/80 hover:text-white">
            ProducerHit
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/pricing" className="text-white/70 hover:text-white">
              {locale === "fr" ? "Tarifs" : "Pricing"}
            </Link>
            <Link to="/dashboard" className="rounded-full bg-[#7c3aed] px-4 py-2 font-semibold text-white hover:bg-[#6d28d9]">
              {locale === "fr" ? "Générer" : "Generate"}
            </Link>
          </div>
        </div>

        <h1 className="mt-12 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">{page.h1}</h1>
        <p className="mt-5 max-w-3xl text-balance text-lg text-white/70">{page.lead}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {page.bullets.map((b) => (
            <div key={b} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
              {b}
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg font-semibold">{locale === "fr" ? "Essaye maintenant" : "Try it now"}</div>
          <p className="mt-2 text-sm text-white/70">
            {locale === "fr"
              ? "Commence par une génération courte, active Versions=2, puis clique sur Variation sur le meilleur résultat."
              : "Start with a short generation, switch Versions=2, then click Variation on the best result."}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link to="/dashboard" className="inline-flex items-center justify-center rounded-full bg-[#7c3aed] px-6 py-3 text-sm font-semibold text-white hover:bg-[#6d28d9]">
              {locale === "fr" ? "Ouvrir le générateur" : "Open generator"}
            </Link>
            <Link to="/pricing" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-transparent px-6 py-3 text-sm font-semibold text-white/90 hover:border-white/30 hover:text-white">
              {locale === "fr" ? "Voir les plans" : "View plans"}
            </Link>
          </div>
        </div>

        {page.faq.length ? (
          <div className="mt-14">
            <h2 className="text-2xl font-bold tracking-tight">{locale === "fr" ? "FAQ" : "FAQ"}</h2>
            <div className="mt-6 grid gap-3">
              {page.faq.map((f) => (
                <details key={f.q} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <summary className="cursor-pointer text-sm font-semibold text-white">{f.q}</summary>
                  <div className="mt-3 text-sm text-white/70">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-14 border-t border-white/10 pt-8 text-sm text-white/60">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/ai-beat-generator" className="hover:text-white">
              AI Beat Generator
            </Link>
            <Link to="/ai-music-generator" className="hover:text-white">
              AI Music Generator
            </Link>
            <Link to="/type-beat-generator-ai" className="hover:text-white">
              Type Beat Generator AI
            </Link>
            <Link to="/generate-beats-online-free" className="hover:text-white">
              Generate Beats Online Free
            </Link>
            <Link to="/legal" className="hover:text-white">
              {locale === "fr" ? "Légal" : "Legal"}
            </Link>
          </div>
          <div className="mt-4">© 2026 ProducerHit</div>
        </div>
      </div>
    </div>
  );
}
