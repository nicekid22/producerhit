import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Sparkles } from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/Button";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import { buildAuthUrl } from "@/lib/authRoutes";
import { getBeatNameGeneratorSeo } from "@/lib/marketing/phase1PagesSeo";
import {
  beatNameGenreOptions,
  beatNameMoodOptions,
  beatNameToGeneratorPrompt,
  generateBeatNames,
  type BeatNameGenre,
  type BeatNameMood,
} from "@/lib/marketing/beatNameGenerator";
import { trackClientEvent } from "@/lib/supabaseClient";

export default function BeatNameGeneratorPage() {
  const locale = useLocaleStore((s) => s.locale);
  const user = useAuthStore((s) => s.user);
  const isFr = locale === "fr";
  const seo = getBeatNameGeneratorSeo(locale);
  const genreOptions = useMemo(() => beatNameGenreOptions(locale), [locale]);
  const moodOptions = useMemo(() => beatNameMoodOptions(locale), [locale]);

  const [genre, setGenre] = useState<BeatNameGenre>("trap");
  const [mood, setMood] = useState<BeatNameMood>("any");
  const [seed, setSeed] = useState(() => String(Date.now()));
  const [names, setNames] = useState<string[]>(() => generateBeatNames({ locale, genre: "trap", mood: "any", seed: String(Date.now()) }));

  const regenerate = useCallback(() => {
    const nextSeed = `${Date.now()}:${Math.random()}`;
    setSeed(nextSeed);
    setNames(generateBeatNames({ locale, genre, mood, seed: nextSeed }));
    trackClientEvent("beat_name_generator_refresh", { genre, mood });
  }, [genre, locale, mood]);

  const applyGenreMood = useCallback(() => {
    const nextSeed = `${Date.now()}:${genre}:${mood}`;
    setSeed(nextSeed);
    setNames(generateBeatNames({ locale, genre, mood, seed: nextSeed }));
    trackClientEvent("beat_name_generator_generate", { genre, mood });
  }, [genre, locale, mood]);

  const openGenerator = (name: string) => {
    const prompt = beatNameToGeneratorPrompt(name, genre);
    const dashboardNext = `/dashboard?prompt=${encodeURIComponent(prompt)}&mode=beat`;
    trackClientEvent("beat_name_generator_cta", { genre, mood });
    if (user) {
      window.location.href = dashboardNext;
      return;
    }
    window.location.href = buildAuthUrl({ mode: "signup", next: dashboardNext });
  };

  return (
    <MarketingPageShell>
      <Navbar variant="marketing" />
      <div className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/80">
          {isFr ? "Outil gratuit · sans inscription" : "Free tool · no signup"}
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{seo.h1}</h1>
        <p className="mt-4 text-base leading-relaxed text-white/70">{seo.description}</p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-white/70">{isFr ? "Genre" : "Genre"}</span>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value as BeatNameGenre)}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-violet-400/50"
              >
                {genreOptions.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-white/70">{isFr ? "Ambiance" : "Mood"}</span>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value as BeatNameMood)}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-violet-400/50"
              >
                {moodOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" className="gap-2" onClick={applyGenreMood}>
              <Sparkles className="h-4 w-4" />
              {isFr ? "Générer des noms" : "Generate names"}
            </Button>
            <Button variant="secondary" className="gap-2" onClick={regenerate}>
              <RefreshCw className="h-4 w-4" />
              {isFr ? "Autres idées" : "More ideas"}
            </Button>
          </div>
        </div>

        <ul className="mt-6 space-y-2">
          {names.map((name) => (
            <li
              key={`${seed}-${name}`}
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-medium text-white/90">{name}</span>
              <button
                type="button"
                onClick={() => openGenerator(name)}
                className="shrink-0 text-left text-sm font-semibold text-violet-300 hover:text-violet-200"
              >
                {isFr ? "Créer ce beat →" : "Create this beat →"}
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-sm text-white/45">
          {isFr ? "Ensuite sur ProducerHit : BPM, key, seed, export MP3." : "Then on ProducerHit: BPM, key, seed, MP3 export."}
        </p>
        <p className="mt-4 text-center text-sm">
          <Link to="/for-ai" className="text-white/40 hover:text-white/60">
            /for-ai
          </Link>
          {" · "}
          <Link to="/suno-alternatives" className="text-white/40 hover:text-white/60">
            {isFr ? "Alternatives Suno" : "Suno alternatives"}
          </Link>
        </p>
      </div>
      <LandingFooter locale={locale} user={user} />
    </MarketingPageShell>
  );
}
