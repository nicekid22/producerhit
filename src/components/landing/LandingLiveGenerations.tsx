import { useEffect, useMemo, useState } from "react";
import { Music2, Sparkles, Zap } from "lucide-react";

import type { AppLocale } from "@/i18n/config";
type Props = {
  locale: AppLocale;
};

type DemoItem = {
  id: string;
  prompt: string;
  mode: string;
  genre: string;
  bpm: number;
  gradient: string;
};

const GRADIENTS = [
  "linear-gradient(145deg, #67c3ff 0%, #9d7cff 52%, #c084fc 100%)",
  "linear-gradient(145deg, #5eead4 0%, #67c3ff 45%, #9d7cff 100%)",
  "linear-gradient(145deg, #fbbf24 0%, #fb7185 38%, #9d7cff 100%)",
  "linear-gradient(145deg, #e2e8f0 0%, #67c3ff 40%, #7c3aed 100%)",
];

const FEATURES = {
  fr: ["MP3 / WAV", "Usage commercial", "Spotify Ready", "Remix communauté"],
  en: ["MP3 / WAV", "Commercial use", "Spotify Ready", "Community remix"],
};

export function LandingLiveGenerations({ locale }: Props) {
  const isFr = locale === "fr";
  const demos = useMemo<DemoItem[]>(
    () =>
      isFr
        ? [
            {
              id: "a",
              prompt: "Trap mélancolique avec piano et 808 profondes…",
              mode: "Type Beat",
              genre: "Trap",
              bpm: 142,
              gradient: GRADIENTS[0],
            },
            {
              id: "b",
              prompt: "R&B nocturne, voix airy, hook accrocheur…",
              mode: "Song",
              genre: "RnB",
              bpm: 88,
              gradient: GRADIENTS[1],
            },
            {
              id: "c",
              prompt: "Drill sombre, hi-hats rapides, basse glissante…",
              mode: "Type Beat",
              genre: "Drill",
              bpm: 148,
              gradient: GRADIENTS[2],
            },
            {
              id: "d",
              prompt: "Afrobeat summer, percussions chaudes, mélodie joyeuse…",
              mode: "Song",
              genre: "Afro",
              bpm: 104,
              gradient: GRADIENTS[3],
            },
          ]
        : [
            {
              id: "a",
              prompt: "Melancholic trap with piano and deep 808s…",
              mode: "Type Beat",
              genre: "Trap",
              bpm: 142,
              gradient: GRADIENTS[0],
            },
            {
              id: "b",
              prompt: "Late-night R&B, airy vocals, catchy hook…",
              mode: "Song",
              genre: "RnB",
              bpm: 88,
              gradient: GRADIENTS[1],
            },
            {
              id: "c",
              prompt: "Dark drill, fast hi-hats, sliding bass…",
              mode: "Type Beat",
              genre: "Drill",
              bpm: 148,
              gradient: GRADIENTS[2],
            },
            {
              id: "d",
              prompt: "Summer afrobeat, warm percussion, joyful melody…",
              mode: "Song",
              genre: "Afro",
              bpm: 104,
              gradient: GRADIENTS[3],
            },
          ],
    [isFr],
  );

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "generating" | "ready">("typing");
  const [typedLen, setTypedLen] = useState(0);
  const [progress, setProgress] = useState(0);

  const current = demos[index] ?? demos[0];
  const queue = [demos[(index + 1) % demos.length], demos[(index + 2) % demos.length]];
  const features = isFr ? FEATURES.fr : FEATURES.en;

  useEffect(() => {
    setPhase("typing");
    setTypedLen(0);
    setProgress(0);
  }, [index]);

  useEffect(() => {
    if (phase !== "typing") return;
    if (typedLen >= current.prompt.length) {
      const t = window.setTimeout(() => setPhase("generating"), 420);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setTypedLen((n) => n + 1), 28);
    return () => window.clearTimeout(t);
  }, [phase, typedLen, current.prompt.length]);

  useEffect(() => {
    if (phase !== "generating") return;
    if (progress >= 100) {
      const t = window.setTimeout(() => setPhase("ready"), 320);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setProgress((p) => Math.min(100, p + 4 + Math.round(Math.random() * 6))), 120);
    return () => window.clearTimeout(t);
  }, [phase, progress]);

  useEffect(() => {
    if (phase !== "ready") return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % demos.length), 2600);
    return () => window.clearTimeout(t);
  }, [phase, demos.length]);

  const typedPrompt = current.prompt.slice(0, typedLen);
  const statusLabel =
    phase === "ready"
      ? isFr
        ? "Prêt à écouter"
        : "Ready to preview"
      : phase === "generating"
        ? isFr
          ? "Génération…"
          : "Generating…"
        : isFr
          ? "Analyse du prompt"
          : "Parsing prompt";

  return (
    <div className="pk-landing-live-gen pk-prism-card relative overflow-hidden p-5 sm:p-6">
      <div aria-hidden className="pk-landing-live-gen__glow pointer-events-none absolute inset-0" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
          <Sparkles className="h-4 w-4 text-[var(--prism-violet)]" />
          {isFr ? "Suite créateur 2026" : "2026 creator suite"}
        </div>
        <div className="pk-landing-live-gen__live inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
          <span className="pk-landing-live-gen__live-dot" aria-hidden />
          Live
        </div>
      </div>

      <div className="relative mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div
            className={[
              "pk-landing-live-gen__cover relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10",
              phase === "ready" ? "pk-landing-live-gen__cover--ready" : "",
            ].join(" ")}
            style={{ background: current.gradient }}
            aria-hidden
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
            {phase === "ready" ? <Music2 className="absolute inset-0 m-auto h-5 w-5 text-white/90" /> : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-white/70">
                {current.mode}
              </span>
              <span className="text-[10px] font-semibold text-white/40">
                {current.genre} · {current.bpm} BPM
              </span>
            </div>

            <p className="pk-landing-live-gen__prompt mt-2 min-h-[2.75rem] text-sm leading-relaxed text-white/85">
              {typedPrompt}
              {phase === "typing" ? <span className="pk-landing-live-gen__cursor" aria-hidden /> : null}
            </p>

            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-white/40">
                <span>{statusLabel}</span>
                <span>{phase === "typing" ? "…" : `${progress}%`}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="pk-landing-live-gen__bar h-full rounded-full bg-gradient-to-r from-[var(--prism-cyan)] via-[var(--prism-violet)] to-[var(--prism-accent)] transition-[width] duration-200 ease-out"
                  style={{ width: phase === "typing" ? "18%" : `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pk-landing-live-gen__wave mt-4 flex h-8 items-end justify-center gap-1" aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className={[
                "pk-landing-live-gen__wave-bar w-1 rounded-full bg-gradient-to-t from-[var(--prism-violet)] to-[var(--prism-cyan)]",
                phase === "generating" || phase === "ready" ? "is-active" : "",
              ].join(" ")}
              style={{ animationDelay: `${i * 55}ms` }}
            />
          ))}
        </div>
      </div>

      <div className="relative mt-4 space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
          <Zap className="h-3.5 w-3.5 text-[var(--prism-cyan)]" />
          {isFr ? "File d'attente" : "Queue"}
        </div>
        {queue.map((item, qi) => (
          <div
            key={`${item.id}-${qi}`}
            className="pk-landing-live-gen__queue flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
          >
            <div className="h-8 w-8 shrink-0 rounded-lg border border-white/10" style={{ background: item.gradient }} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-semibold text-white/55">{item.prompt}</div>
              <div className="mt-0.5 text-[10px] text-white/35">
                {item.mode} · {item.genre}
              </div>
            </div>
            <span className="text-[10px] font-semibold text-white/30">{isFr ? "En attente" : "Queued"}</span>
          </div>
        ))}
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2">
        {features.map((label, i) => (
          <div
            key={label}
            className={[
              "pk-landing-live-gen__pill rounded-xl border px-3 py-2 text-center text-[11px] font-semibold transition-all duration-500",
              phase === "ready" ? "pk-landing-live-gen__pill--lit" : "border-white/8 bg-black/20 text-white/55",
            ].join(" ")}
            style={{ transitionDelay: phase === "ready" ? `${i * 80}ms` : "0ms" }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
