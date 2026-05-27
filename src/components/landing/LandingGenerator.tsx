import { useState, type RefObject } from "react";
import { Music2, Pause, Play, SlidersHorizontal, Sparkles } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/planLimits";

type CreateMode = "song" | "beat";

export type GeneratorSideCard = {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  coverBg: string;
  audioUrl: string | null;
  stemsUrl?: Record<string, unknown> | null;
  name: string;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  prompt: string;
};

type Props = {
  locale: "en" | "fr";
  mode: CreateMode;
  setMode: (mode: CreateMode) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  placeholders: string[];
  placeholderIndex: number;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  focused: boolean;
  setFocused: (value: boolean) => void;
  generating: boolean;
  onGenerate: () => void;
  beatArtist: string;
  setBeatArtist: (value: string) => void;
  beatBpm: number;
  setBeatBpm: (value: number) => void;
  beatMood: string;
  setBeatMood: (value: string) => void;
  beatGenres: string[];
  toggleGenre: (genre: string) => void;
  sideCards: GeneratorSideCard[];
  activeCardId: string | null;
  isPlaying: boolean;
  onPlayCard: (card: GeneratorSideCard) => void;
};

function FloatingCard({
  card,
  side,
  locale,
  isActive,
  isPlaying,
  onPlay,
}: {
  card: GeneratorSideCard;
  side: "left" | "right";
  locale: "en" | "fr";
  isActive: boolean;
  isPlaying: boolean;
  onPlay: (card: GeneratorSideCard) => void;
}) {
  const isFr = locale === "fr";
  const playingNow = isActive && isPlaying;

  return (
    <div
      className={[
        "pk-landing-gen-card absolute top-1/2 hidden w-[168px] lg:block xl:w-[190px]",
        side === "left" ? "pk-landing-gen-card--left" : "pk-landing-gen-card--right",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => onPlay(card)}
        className="pk-landing-gen-card__btn group w-full text-left"
        aria-label={
          playingNow
            ? isFr
              ? `Pause ${card.title}`
              : `Pause ${card.title}`
            : isFr
              ? `Écouter ${card.title}`
              : `Play ${card.title}`
        }
      >
        <div className="pk-landing-gen-card__frame overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div
            className={[
              "pk-landing-gen-card__media relative aspect-[4/5]",
              playingNow ? "pk-landing-gen-card__media--active" : "",
            ].join(" ")}
          >
            <div className="absolute inset-0" style={{ background: card.coverBg }} aria-hidden />
            <img
              src={card.coverUrl}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500"
              onLoad={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/5" aria-hidden />

            <div
              className={[
                "pk-landing-gen-card__play absolute inset-0 flex items-center justify-center",
                playingNow ? "pk-landing-gen-card__play--visible" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300",
                  playingNow
                    ? "border-white/35 bg-black/55 text-white"
                    : "border-white/25 bg-black/40 text-white group-hover:scale-105 group-hover:border-white/40 group-hover:bg-black/55",
                ].join(" ")}
              >
                {playingNow ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 right-3">
              <div className="truncate text-sm font-semibold text-white">{card.title}</div>
              <div className="mt-0.5 truncate text-[11px] font-medium text-white/55">{card.subtitle}</div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

export function LandingGenerator({
  locale,
  mode,
  setMode,
  prompt,
  setPrompt,
  placeholders,
  placeholderIndex,
  inputRef,
  focused,
  setFocused,
  generating,
  onGenerate,
  beatArtist,
  setBeatArtist,
  beatBpm,
  setBeatBpm,
  beatMood,
  setBeatMood,
  beatGenres,
  toggleGenre,
  sideCards,
  activeCardId,
  isPlaying,
  onPlayCard,
}: Props) {
  const isFr = locale === "fr";
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const freeLabel = isFr
    ? `${PLAN_LIMITS.free} générations gratuites / mois`
    : `${PLAN_LIMITS.free} free generations / month`;

  const headline =
    mode === "song"
      ? isFr
        ? "Décris ta prochaine chanson."
        : "Describe your next song."
      : isFr
        ? "Décris ton prochain type beat."
        : "Describe your next type beat.";

  const sub =
    mode === "song"
      ? isFr
        ? "Un prompt suffit — voix, structure et hook en ~20 secondes."
        : "One prompt is enough — vocals, structure, and hook in ~20 seconds."
      : isFr
        ? "BPM et vibe optionnels. Lance la génération en un clic."
        : "Optional BPM and vibe. Start generating in one click.";

  return (
    <div id="create" className="pk-landing-gen relative mx-auto mt-10 w-full max-w-3xl sm:mt-14">
      {sideCards[0] ? (
        <FloatingCard
          card={sideCards[0]}
          side="left"
          locale={locale}
          isActive={activeCardId === sideCards[0].id}
          isPlaying={isPlaying}
          onPlay={onPlayCard}
        />
      ) : null}
      {sideCards[1] ? (
        <FloatingCard
          card={sideCards[1]}
          side="right"
          locale={locale}
          isActive={activeCardId === sideCards[1].id}
          isPlaying={isPlaying}
          onPlay={onPlayCard}
        />
      ) : null}

      <div className="relative z-[1] text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
          {isFr ? "Générateur" : "Generator"}
        </p>
        <h2 className="mt-3 text-balance text-[clamp(1.65rem,4.5vw,2.75rem)] font-bold leading-tight tracking-tight text-white">
          {headline}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-balance text-sm leading-relaxed text-white/55">{sub}</p>
      </div>

      <div
        className={[
          "pk-landing-gen__shell relative z-[1] mt-6 sm:mt-8",
          focused ? "pk-landing-gen__shell--focused" : "",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] px-3 py-2.5 sm:px-4">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-0.5">
            <button
              type="button"
              onClick={() => setMode("song")}
              className={[
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:text-sm",
                mode === "song" ? "pk-prism-pill-active" : "text-white/55 hover:text-white",
              ].join(" ")}
            >
              Song
            </button>
            <button
              type="button"
              onClick={() => setMode("beat")}
              className={[
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:text-sm",
                mode === "beat" ? "pk-prism-pill-active" : "text-white/55 hover:text-white",
              ].join(" ")}
            >
              Type Beat
            </button>
          </div>

          <div className="flex items-center gap-2">
            {mode === "beat" ? (
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  advancedOpen
                    ? "border-[var(--prism-violet)]/40 bg-[var(--prism-violet)]/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white",
                ].join(" ")}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {isFr ? "Avancé" : "Advanced"}
              </button>
            ) : null}
            <span className="hidden text-[11px] font-semibold text-white/40 sm:inline">{freeLabel}</span>
          </div>
        </div>

        <div className="px-3 py-3 sm:px-4 sm:py-4">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void onGenerate();
              }
            }}
            placeholder={placeholders[placeholderIndex]}
            rows={2}
            className="w-full resize-none bg-transparent text-base font-medium leading-relaxed text-white outline-none placeholder:text-white/35 sm:text-lg"
          />
        </div>

        {mode === "beat" && advancedOpen ? (
          <div className="border-t border-white/[0.08] px-3 py-3 sm:px-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                  {isFr ? "Style artiste" : "Artist style"}
                </span>
                <input
                  value={beatArtist}
                  onChange={(e) => setBeatArtist(e.target.value)}
                  placeholder={isFr ? "Drake, Travis Scott…" : "Drake, Travis Scott…"}
                  className="mt-1.5 h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[var(--prism-cyan)]/40"
                />
              </label>
              <label className="block">
                <span className="flex justify-between text-[11px] font-semibold uppercase tracking-wide text-white/45">
                  <span>BPM</span>
                  <span className="text-white/70">{beatBpm}</span>
                </span>
                <input
                  type="range"
                  min={80}
                  max={170}
                  value={beatBpm}
                  onChange={(e) => setBeatBpm(Number(e.target.value))}
                  className="mt-3 w-full accent-[var(--prism-cyan)]"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Trap", "Drill", "Afro", "RnB", "Jersey"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  className={[
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    beatGenres.includes(g) ? "pk-prism-pill-active" : "border border-white/10 text-white/60 hover:text-white",
                  ].join(" ")}
                >
                  {g}
                </button>
              ))}
              {["Chill", "Hype", "Dark"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setBeatMood(m)}
                  className={[
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    beatMood === m ? "pk-prism-pill-active" : "border border-white/10 text-white/60 hover:text-white",
                  ].join(" ")}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-white/[0.08] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <p className="text-center text-[11px] font-semibold text-white/40 sm:text-left sm:hidden">{freeLabel}</p>
          <p className="hidden text-xs text-white/45 sm:block">
            {isFr ? "Entrée pour générer · Shift+Entrée nouvelle ligne" : "Enter to generate · Shift+Enter new line"}
          </p>
          <button
            type="button"
            onClick={() => void onGenerate()}
            disabled={generating}
            className="pk-landing-gen__cta inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-black transition-all hover:brightness-110 disabled:opacity-70 sm:w-auto sm:min-w-[148px]"
          >
            {generating ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
            ) : (
              <Music2 className="h-4 w-4" />
            )}
            {generating ? (isFr ? "Génération…" : "Generating…") : isFr ? "Créer" : "Create"}
          </button>
        </div>
      </div>

      <p className="relative z-[1] mt-4 flex items-center justify-center gap-2 text-center text-xs text-white/45">
        <Sparkles className="h-3.5 w-3.5 text-[var(--prism-violet)]" aria-hidden />
        {isFr ? "Aucune compétence requise — décris ton idée, on s’occupe du reste." : "No skills needed — describe your idea, we handle the rest."}
      </p>
    </div>
  );
}
