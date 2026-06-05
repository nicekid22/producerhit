import { useEffect, useState, type RefObject } from "react";
import { COVER_SURFACE_CLASS, cn } from "@/lib/utils";
import { SpeechDictationField } from "@/components/SpeechDictationField";
import { Music2, Pause, Play, SlidersHorizontal, Sparkles } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/planLimits";
import { PkIconLoader } from "@/components/ui/PkIconLoader";

type CreateMode = "song" | "beat";

export type GeneratorSideCard = {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  /** Legacy lazy Pinterest — ignoré si persist actif. */
  coverUrlFallback?: string;
  coverPinterestQuery?: string;
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
  embedded?: boolean;
  compactMobile?: boolean;
  reduceMotion?: boolean;
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
  const [coverReady, setCoverReady] = useState(false);

  useEffect(() => {
    setCoverReady(false);
  }, [card.id, card.coverUrl]);

  return (
    <div
      className={[
        "pk-landing-gen-card hidden shrink-0 lg:block",
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
        <div className="pk-landing-gen-card__frame pk-landing-gen-card__frame--swap-in overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div
            className={[
              "pk-landing-gen-card__media relative aspect-[4/5] overflow-hidden",
              playingNow ? "pk-landing-gen-card__media--active" : "",
              coverReady ? "pk-landing-gen-card__media--cover-ready" : "",
            ].join(" ")}
          >
            <div className={cn("absolute inset-0", card.coverBg || COVER_SURFACE_CLASS)} aria-hidden />
            {card.coverUrl ? (
              <img
                key={card.coverUrl}
                src={card.coverUrl}
                alt=""
                loading="eager"
                decoding="async"
                fetchPriority="high"
                referrerPolicy="no-referrer"
                className={[
                  "pk-landing-gen-card__cover absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-300 ease-out",
                  coverReady ? "opacity-100" : "opacity-0",
                ].join(" ")}
                onLoad={() => {
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => setCoverReady(true));
                  });
                }}
                onError={() => setCoverReady(false)}
              />
            ) : null}
            <div className="pk-landing-gen-card__fx" aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" aria-hidden />

            <div
              className={[
                "pk-landing-gen-card__play absolute inset-0 z-[2] flex items-center justify-center",
                playingNow ? "pk-landing-gen-card__play--visible" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "pk-landing-gen-card__play-btn flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300",
                  playingNow
                    ? "border-white/35 bg-black/55 text-white"
                    : "border-white/25 bg-black/40 text-white group-hover:scale-105 group-hover:border-white/40 group-hover:bg-black/55",
                ].join(" ")}
              >
                {playingNow ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
              </span>
            </div>

            <div className="pk-landing-gen-card__meta absolute bottom-3 left-3 right-3 z-[3]">
              <div className="truncate text-sm font-semibold text-white">{card.title}</div>
              <div className="mt-0.5 truncate text-[11px] font-medium text-white/55">{card.subtitle}</div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

function GeneratorReassurance({ locale, compact }: { locale: "en" | "fr"; compact?: boolean }) {
  const isFr = locale === "fr";
  return (
    <p className={cn("pk-landing-gen__reassurance", compact && "pk-landing-gen__reassurance--mobile")}>
      <Sparkles className="pk-landing-gen__reassurance-icon" aria-hidden />
      <span className="pk-landing-gen__reassurance-copy">
        {isFr ? "Aucune compétence requise — décris ton idée, on s’occupe du reste." : "No skills needed — describe your idea, we handle the rest."}
      </span>
    </p>
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
  embedded = false,
  compactMobile = false,
  reduceMotion = false,
}: Props) {
  const isFr = locale === "fr";
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [shellTouched, setShellTouched] = useState(false);
  const [shellIdle, setShellIdle] = useState(false);
  const freeLabel = isFr
    ? `${PLAN_LIMITS.free} gratuites / mois`
    : `${PLAN_LIMITS.free} free / month`;

  useEffect(() => {
    if (!compactMobile || focused || generating || shellTouched || reduceMotion) {
      setShellIdle(false);
      return;
    }
    const start = window.setTimeout(() => setShellIdle(true), 1800);
    return () => window.clearTimeout(start);
  }, [compactMobile, focused, generating, shellTouched, reduceMotion]);

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
        ? "Un prompt suffit — voix, structure et hook prêts à itérer."
        : "One prompt is enough — vocals, structure, and hook ready to iterate."
      : isFr
        ? "BPM et mood optionnels. Instrumentale royalty-free en un clic."
        : "Optional BPM and mood. Royalty-free instrumental in one click.";

  const showSideCards = sideCards.length >= 2;

  return (
    <div
      id="create"
      className={[
        "pk-landing-gen mx-auto w-full max-w-7xl",
        embedded ? "mt-0" : "mt-10 sm:mt-14",
      ].join(" ")}
    >
      <div
        className={[
          "pk-landing-gen__row flex w-full items-center",
          showSideCards ? "justify-between gap-5 xl:gap-8 2xl:gap-10" : "justify-center",
        ].join(" ")}
      >
        {sideCards[0] ? (
          <FloatingCard
            key={sideCards[0].id}
            card={sideCards[0]}
            side="left"
            locale={locale}
            isActive={activeCardId === sideCards[0].id}
            isPlaying={isPlaying}
            onPlay={onPlayCard}
          />
        ) : null}

        <div className="pk-landing-gen__center relative z-[1] w-full min-w-0 max-w-3xl flex-1 lg:max-w-4xl">
          {embedded ? null : (
            <div className="relative z-[1] text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
                {isFr ? "Générateur" : "Generator"}
              </p>
              <h2 className="mt-3 text-balance text-[clamp(1.65rem,4.5vw,2.75rem)] font-bold leading-tight tracking-tight text-white">
                {headline}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-balance text-sm leading-relaxed text-white/55">{sub}</p>
            </div>
          )}

          {compactMobile ? (
            <p className="pk-landing-gen__mobile-hint">
              {isFr ? "Décris ton idée — ton hit est à un clic" : "Describe your idea — your next track is one click away"}
            </p>
          ) : null}

          <div
            className={cn(
              compactMobile && "pk-landing-gen__mobile-stage",
              compactMobile && shellIdle && !focused && !generating && "pk-landing-gen__mobile-stage--idle",
            )}
            onPointerDown={() => setShellTouched(true)}
          >
          {compactMobile ? (
            <>
              <span className="pk-landing-gen__mobile-stage-grain" aria-hidden />
              <span className="pk-landing-gen__mobile-stage-vignette" aria-hidden />
            </>
          ) : null}
          <div
            className={cn(
              "pk-landing-gen__shell relative z-[1]",
              embedded ? "mt-0" : "mt-6 sm:mt-8",
              compactMobile && "pk-landing-gen__shell--mobile",
              focused ? "pk-landing-gen__shell--focused" : "",
            )}
          >
        {!compactMobile ? (
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
        ) : null}

        <div className={cn("px-3 py-3 sm:px-4 sm:py-4", compactMobile && "pk-landing-gen__prompt-zone")}>
          <SpeechDictationField
            multiline
            locale={locale}
            variant="landing"
            inputRef={inputRef}
            value={prompt}
            onChange={setPrompt}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void onGenerate();
              }
            }}
            placeholder={placeholders[placeholderIndex]}
            rows={compactMobile ? 3 : 3}
            wrapperClassName="mt-0"
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

        <div
          className={cn(
            "border-t border-white/[0.08] px-3 py-3 sm:px-4",
            compactMobile ? "pk-landing-gen__mobile-toolbar" : "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          {compactMobile ? (
            <>
              <div className="pk-landing-gen__mobile-toolbar-left">
                <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-0.5">
                  <button
                    type="button"
                    onClick={() => setMode("song")}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors",
                      mode === "song" ? "pk-prism-pill-active" : "text-white/55 hover:text-white",
                    )}
                  >
                    Song
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("beat")}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors",
                      mode === "beat" ? "pk-prism-pill-active" : "text-white/55 hover:text-white",
                    )}
                  >
                    Type Beat
                  </button>
                </div>
                {mode === "beat" ? (
                  <button
                    type="button"
                    onClick={() => setAdvancedOpen((v) => !v)}
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                      advancedOpen
                        ? "border-[var(--prism-violet)]/40 bg-[var(--prism-violet)]/10 text-white"
                        : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white",
                    )}
                    aria-label={isFr ? "Options avancées" : "Advanced options"}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <div className="pk-landing-gen__cta-shell pk-landing-gen__cta-shell--mobile relative inline-flex min-w-[132px] flex-1 sm:flex-none">
                <span className="pk-landing-gen__cta-field" aria-hidden />
                <button
                  type="button"
                  onClick={() => void onGenerate()}
                  disabled={generating}
                  className={`pk-landing-gen__cta pk-landing-gen__cta--mobile group inline-flex h-11 w-full items-center justify-center rounded-full px-5${generating ? " is-generating" : ""}`}
                >
                  <span className="pk-landing-gen__cta-rim" aria-hidden />
                  <span className="pk-landing-gen__cta-spark" aria-hidden />
                  <span className="pk-landing-gen__cta-spark pk-landing-gen__cta-spark--alt" aria-hidden />
                  <span className="pk-landing-gen__cta-glass" aria-hidden>
                    <span className="pk-landing-gen__cta-liquid" aria-hidden />
                    <span className="pk-landing-gen__cta-shine" aria-hidden />
                  </span>
                  <span className="pk-landing-gen__cta-inner inline-flex items-center justify-center gap-2 text-sm font-bold">
                    {generating ? (
                      <PkIconLoader icon="generator" size="xs" inline />
                    ) : (
                      <Music2 className="h-4 w-4" aria-hidden />
                    )}
                    {generating ? (isFr ? "Génération…" : "Generating…") : isFr ? "Créer" : "Create"}
                  </span>
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-center text-[11px] font-semibold text-white/40 sm:text-left sm:hidden">{freeLabel}</p>
              <p className="hidden text-xs text-white/45 sm:block">
                {isFr ? "Entre ton texte et clique sur Créer · Shift+Entrée pour une nouvelle ligne" : "Enter to generate · Shift+Enter new line"}
              </p>
              <div className="pk-landing-gen__cta-shell relative inline-flex w-full sm:w-auto sm:min-w-[148px]">
                <span className="pk-landing-gen__cta-field" aria-hidden />
                <button
                  type="button"
                  onClick={() => void onGenerate()}
                  disabled={generating}
                  className={`pk-landing-gen__cta group inline-flex h-12 w-full items-center justify-center rounded-full px-6 sm:w-auto sm:min-w-[148px]${generating ? " is-generating" : ""}`}
                >
                  <span className="pk-landing-gen__cta-rim" aria-hidden />
                  <span className="pk-landing-gen__cta-spark" aria-hidden />
                  <span className="pk-landing-gen__cta-spark pk-landing-gen__cta-spark--alt" aria-hidden />
                  <span className="pk-landing-gen__cta-glass" aria-hidden>
                    <span className="pk-landing-gen__cta-liquid" aria-hidden />
                    <span className="pk-landing-gen__cta-shine" aria-hidden />
                  </span>
                  <span className="pk-landing-gen__cta-inner inline-flex items-center justify-center gap-2 text-sm font-bold">
                    {generating ? (
                      <PkIconLoader icon="generator" size="xs" inline />
                    ) : (
                      <Music2 className="h-4 w-4" aria-hidden />
                    )}
                    {generating ? (isFr ? "Génération…" : "Generating…") : isFr ? "Créer" : "Create"}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
          </div>

          {compactMobile ? (
            <GeneratorReassurance locale={locale} compact />
          ) : (
            <GeneratorReassurance locale={locale} />
          )}
        </div>

        {sideCards[1] ? (
          <FloatingCard
            key={sideCards[1].id}
            card={sideCards[1]}
            side="right"
            locale={locale}
            isActive={activeCardId === sideCards[1].id}
            isPlaying={isPlaying}
            onPlay={onPlayCard}
          />
        ) : null}
      </div>
    </div>
  );
}
