import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AppShell } from "@/components/AppShell";
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/EmptyState";
import { useGeneratorStore } from "@/stores/generatorStore";
import { useLoopsStore } from "@/stores/loopsStore";
import type { Loop, LoopLength } from "@/types/loop";
import { usePlayerStore } from "@/stores/playerStore";
import { LoopCardItem } from "@/components/LoopCardItem";
import { AudioWaveform, Clock, Copy, Gauge, Info, KeyRound, Loader2, Search, Sigma, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import { getRemainingBeats } from "@/lib/planLimits";
import { generateBeat } from "@/lib/audioApi";

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

const genreOptions: DropdownOption[] = [
  { group: "Trap / Hip-Hop", value: "Contemporary Rap", label: "Contemporary Rap" },
  { group: "Trap / Hip-Hop", value: "Dark Trap", label: "Dark Trap" },
  { group: "Trap / Hip-Hop", value: "Melodic Trap", label: "Melodic Trap" },
  { group: "Trap / Hip-Hop", value: "Old School Hip-Hop", label: "Old School (Boom Bap)" },
  { group: "Trap / Hip-Hop", value: "Drill", label: "Drill" },
  { group: "Trap / Hip-Hop", value: "Afrotrap", label: "Afrotrap" },
  { group: "R&B / Soul", value: "Trapsoul", label: "Trapsoul" },
  { group: "R&B / Soul", value: "90s R&B", label: "90s R&B" },
  { group: "R&B / Soul", value: "Neo Soul", label: "Neo Soul" },
  { group: "Afro / Latin / Island", value: "Afrobeats", label: "Afrobeats" },
  { group: "Afro / Latin / Island", value: "Amapiano", label: "Amapiano" },
  { group: "Afro / Latin / Island", value: "Reggaeton", label: "Reggaeton" },
  { group: "Afro / Latin / Island", value: "Baile Funk", label: "Baile Funk" },
  { group: "Afro / Latin / Island", value: "Dancehall", label: "Dancehall" },
  { group: "Electronic / Pop", value: "House", label: "House" },
  { group: "Electronic / Pop", value: "Pop", label: "Pop" },
  { group: "Electronic / Pop", value: "UK Garage", label: "UK Garage" },
  { group: "Electronic / Pop", value: "Jersey Club", label: "Jersey Club" },
  { group: "Electronic / Pop", value: "Hyperpop", label: "Hyperpop" },
  { group: "Other", value: "Country", label: "Country" },
  { group: "Other", value: "Lo-fi R&B", label: "Lo-fi R&B" },
];

const influenceOptions: DropdownOption[] = [
  { group: "Modern Trap", value: "Metro Boomin", label: "Metro Boomin" },
  { group: "Modern Trap", value: "Southside", label: "Southside" },
  { group: "Melodic / R&B", value: "OG Parker", label: "OG Parker" },
  { group: "Melodic / R&B", value: "Timbaland", label: "Timbaland" },
  { group: "UK / Afro", value: "JAE5", label: "JAE5" },
  { group: "Classic", value: "Kanye West (808s era)", label: "Kanye West (808s era)" },
  { value: "No Influence", label: "No Influence" },
];

const keyOptions = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const scaleOptions: DropdownOption[] = [
  { value: "Major", label: "Major" },
  { value: "Minor", label: "Minor" },
  { value: "Diminished", label: "Diminished" },
  { value: "Pentatonic", label: "Pentatonic" },
];
const reverbOptions: DropdownOption[] = [
  { value: "Dry", label: "Dry" },
  { value: "Subtle", label: "Subtle" },
  { value: "Medium", label: "Medium" },
  { value: "Heavy", label: "Heavy" },
];
const moodOptions = ["Dark", "Melancholic", "Euphoric", "Aggressive", "Smooth", "Dreamy", "Hypnotic"];
const lengths: LoopLength[] = ["2 bars", "4 bars", "8 bars", "16 bars"];

const bpmPresets = [
  { label: "Chill", value: 110 },
  { label: "Mid", value: 140 },
  { label: "Fast", value: 170 },
] as const;
const songDurationPresets = [15, 30, 45] as const;
const timeSignatureOptions = ["2/4", "3/4", "4/4", "6/8"] as const;
const vocalLanguageOptions: DropdownOption[] = [
  { value: "en", label: "🇺🇸 English" },
  { value: "fr", label: "🇫🇷 French" },
  { value: "es", label: "🇪🇸 Spanish" },
  { value: "pt", label: "🇵🇹 Portuguese" },
  { value: "it", label: "🇮🇹 Italian" },
  { value: "de", label: "🇩🇪 German" },
  { value: "ja", label: "🇯🇵 Japanese" },
  { value: "zh", label: "🇨🇳 Chinese" },
];

const vocalStyleOptions = [
  { value: "Singer", label: "🎤 Singer" },
  { value: "Rapper", label: "🎙️ Rapper" },
  { value: "Singer-Rapper", label: "🎶 Hybrid" },
  { value: "Choir", label: "🧑‍🤝‍🧑 Vocal" },
] as const;

const genreInspirationChips: Record<string, readonly string[]> = {
  "Contemporary Rap": ["Hard Drums", "808/Sub", "Minimal Melody", "Bouncy Hats", "Ear Candy", "Modern"],
  "90s R&B": ["Live Keys", "Rhodes", "Soulful Chords", "Swinging Drums", "Warm Tape", "Smooth Groove"],
  Trapsoul: ["Smooth 808", "Half-time", "Dark Pads", "Tight Hats", "Woozy Melody", "Emotional"],
  "Neo Soul": ["Jazzy Chords", "Organic Feel", "Laid-back", "Live Bass", "Soulful", "Warm"],
  "Old School Hip-Hop": ["Boom Bap", "Chopped Samples", "Vinyl Dust", "MPC Swing", "Scratches", "Jazz/Soul"],
  "UK Drill": ["Dark Melody", "Sliding 808", "Off-beat Hats", "Aggressive", "Minor Key", "Street"],
  Afrobeats: ["Percussion Heavy", "Bright Guitar", "Danceable", "West African", "Rhythmic", "Uplifting"],
  Amapiano: ["Log Drum", "Deep Bass", "Piano Keys", "Shuffle", "South African", "Smooth", "Shakers"],
  House: ["4-on-the-floor", "Groovy Bass", "Chord Stabs", "Hi-hats", "Uplifting", "Club"],
  Pop: ["Catchy", "Bright", "Commercial", "Modern", "Upbeat", "Radio-ready"],
  "UK Garage": ["2-Step", "Syncopated", "Bouncy Bass", "Swing", "Vocal Chops", "London Vibe"],
  "Jersey Club": ["Fast Kicks", "Club Bounce", "Chopped Vocals", "Bed Squeak", "High Energy"],
  Hyperpop: ["Glitchy", "High Energy", "Distorted", "Futuristic", "Fast", "Experimental"],
  "Baile Funk": ["Brazilian", "Heavy Percussion", "Street", "Rio", "Energetic", "Dance"],
  Afrotrap: ["Hybrid Drums", "Aggressive Afro", "Heavy 808", "Rhythmic", "High Energy"],
  Dancehall: ["Island Vibe", "Club Energy", "Heavy Bass", "Rhythmic", "Tropical", "Summer"],
  Country: ["Acoustic Guitar", "Live Drums", "Warm Bass", "Lead Guitar", "Anthemic", "Emotional"],
};

const defaultInspirationChips = ["Dark", "Melodic", "Emotional", "Hard", "Smooth", "Atmospheric"] as const;

function getInspirationChipsForGenre(genre: string) {
  return (genreInspirationChips[genre] ?? defaultInspirationChips) as readonly string[];
}

function detectLanguage(text: string): string {
  if (!text || text.trim().length < 3) return "en";
  const frPattern = /\b(je|tu|il|elle|nous|vous|ils|elles|le|la|les|un|une|des|et|est|pas|que|qui|dans|sur|avec|pour|mon|ton|son|ma|ta|sa)\b/i;
  const esPattern = /\b(yo|tú|él|ella|nosotros|los|las|una|del|por|para|con|que|como|pero|este|esta|muy|más)\b/i;
  const ptPattern = /\b(eu|você|ele|ela|nós|os|as|um|uma|do|da|por|para|com|que|como|mas|este|essa|muito)\b/i;
  if (frPattern.test(text)) return "fr";
  if (esPattern.test(text)) return "es";
  if (ptPattern.test(text)) return "pt";
  return "en";
}

function parseKeyScale(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { key: "", scale: "" };
  if (parts.length === 1) return { key: parts[0], scale: "" };
  return { key: parts[0], scale: parts.slice(1).join(" ") };
}

function genreForSampleQuery(genre: string) {
  if (genre === "Jersey Club") return "Jersey club / Baltimore club, fast kick pattern, bed squeak, chopped vocal stabs";
  return genre;
}

const presets = [
  {
    name: "Trapsoul — OG Parker",
    genre: "Trapsoul",
    influence: "OG Parker",
    bpm: 140,
    mood: "Melancholic",
    energyLevel: "Medium",
    loopLength: "8 bars" as LoopLength,
    prompt: "dark melodic trap, smooth 808s, emotional",
    key: "F#",
    scale: "Minor",
  },
  {
    name: "Drill — Aggressive",
    genre: "Drill",
    influence: "Southside",
    bpm: 150,
    mood: "Aggressive",
    energyLevel: "High",
    loopLength: "8 bars" as LoopLength,
    prompt: "hard hitting drums, sliding 808s, dark synth stabs",
    key: "G",
    scale: "Minor",
  },
  {
    name: "Melodic Trap — Dreamy",
    genre: "Melodic Trap",
    influence: "Metro Boomin",
    bpm: 140,
    mood: "Dreamy",
    energyLevel: "Medium",
    loopLength: "16 bars" as LoopLength,
    prompt: "bright melodic lead, airy pads, clean bounce",
    key: "A",
    scale: "Minor",
  },
  {
    name: "Old School — Boom Bap",
    genre: "Old School Hip-Hop",
    influence: "Pete Rock",
    bpm: 92,
    mood: "Nostalgic",
    energyLevel: "Chill",
    loopLength: "8 bars" as LoopLength,
    prompt: "chopped soul/jazz sample, dusty drums, MPC swing, subtle scratches",
    key: "F",
    scale: "Minor",
  },
  ] as const;

function barsFromLoopLength(loopLength: LoopLength) {
  const n = Number(loopLength.split(" ")[0]);
  return Number.isFinite(n) && n > 0 ? n : 4;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const form = useGeneratorStore((s) => s.form);
  const setField = useGeneratorStore((s) => s.setField);
  const setBpm = useGeneratorStore((s) => s.setBpm);
  const setLoopLength = useGeneratorStore((s) => s.setLoopLength);
  const loops = useLoopsStore((s) => s.loops);
  const durationsSecById = useLoopsStore((s) => s.durationsSecById);
  const createLoop = useLoopsStore((s) => s.createLoop);
  const setCurrent = usePlayerStore((s) => s.setCurrent);
  const user = useAuthStore((s) => s.user);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState("free");
  const [usedThisMonth, setUsedThisMonth] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);
  const [audioFormat, setAudioFormat] = useState<"mp3" | "wav">("mp3");
  const [query, setQuery] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [mode, setMode] = useState<"beat" | "song">(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("producerhit_mode") : null;
    return saved === "beat" ? "beat" : "song";
  });
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("producerhit_advanced") : null;
    return saved === "true";
  });
  const engine = "ace-step" as const;
  const [lyricsMode, setLyricsMode] = useState<"ai" | "manual">("manual");
  const [songUiMode, setSongUiMode] = useState<"simple" | "custom">("simple");
  const [lyrics, setLyrics] = useState("");
  const [songDescription, setSongDescription] = useState("");
  const [songVocalStyle, setSongVocalStyle] = useState<(typeof vocalStyleOptions)[number]["value"]>("Singer");
  const [songTempoMode, setSongTempoMode] = useState<"auto" | "manual">("auto");
  const [songKeyMode, setSongKeyMode] = useState<"auto" | "manual">("auto");
  const [beatTempoMode, setBeatTempoMode] = useState<"auto" | "manual">("auto");
  const [beatKeyMode, setBeatKeyMode] = useState<"auto" | "manual">("auto");
  const [songDurationMode, setSongDurationMode] = useState<"auto" | "manual">("auto");
  const [songTimeSignatureMode, setSongTimeSignatureMode] = useState<"auto" | "manual">("auto");
  const [songVocalLanguageMode, setSongVocalLanguageMode] = useState<"auto" | "manual">("auto");
  const [manualVocalLanguage, setManualVocalLanguage] = useState("en");
  const [songDurationSec, setSongDurationSec] = useState(30);
  const [songTimeSignature, setSongTimeSignature] = useState<(typeof timeSignatureOptions)[number]>("4/4");
  const [beatInstrumental] = useState(true);
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [autoGeneratePending, setAutoGeneratePending] = useState(false);
  const [pendingLandingPrompt, setPendingLandingPrompt] = useState<string | null>(null);
  const autoLandingGenerateRef = useRef(false);

  const refreshProfile = useMemo(() => {
    return async () => {
      if (!user) return;
      setProfileLoading(true);
      try {
        await supabase.rpc("reset_loops_usage_if_needed");
        const { data, error } = await supabase
          .from("profiles")
          .select("plan, loops_used_this_month")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        const nextPlan = typeof data?.plan === "string" ? data.plan : "free";
        const nextUsed = typeof data?.loops_used_this_month === "number" ? data.loops_used_this_month : 0;
        setPlan(nextPlan);
        setUsedThisMonth(nextUsed);
        return nextPlan;
      } catch {
        setPlan("free");
        setUsedThisMonth(0);
        return "free";
      } finally {
        setProfileLoading(false);
      }
    };
  }, [user]);

  const detailsLoop = useMemo(() => {
    if (!detailsId) return null;
    return loops.find((l) => l.id === detailsId) ?? null;
  }, [detailsId, loops]);

  useEffect(() => {
    if (!user) return;
    void refreshProfile();
  }, [refreshProfile, user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      toast.success("🎉 Payment received. Activating your plan…");
      window.history.replaceState({}, "", "/dashboard");
      void (async () => {
        for (let i = 0; i < 8; i++) {
          const nextPlan = await refreshProfile();
          if (nextPlan && nextPlan !== "free") {
            toast.success(`Plan activated: ${nextPlan}`);
            return;
          }
          await new Promise((r) => setTimeout(r, 1200));
        }
      })();
    }
  }, [refreshProfile]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPrompt = params.get("prompt");
    const localPrompt = window.localStorage.getItem("producerhit_pending_prompt");
    const pendingPrompt = urlPrompt || localPrompt;
    if (!pendingPrompt) return;

    let decoded = pendingPrompt;
    try {
      decoded = decodeURIComponent(pendingPrompt);
    } catch {
      decoded = pendingPrompt;
    }

    setPendingLandingPrompt(decoded);
    window.localStorage.removeItem("producerhit_pending_prompt");
    if (urlPrompt) window.history.replaceState({}, "", "/dashboard");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("producerhit_mode", mode);
  }, [mode]);

  useEffect(() => {
    window.localStorage.setItem("producerhit_advanced", advancedOpen ? "true" : "false");
  }, [advancedOpen]);

  useEffect(() => {
    setActiveChips([]);
  }, [form.genre]);

  const remaining = getRemainingBeats(plan, usedThisMonth);
  const inferGenreFromPrompt = useCallback((p: string) => {
    const s = p.toLowerCase();
    if (s.includes("afrobeats") || s.includes("afro")) return "Afrobeats";
    if (s.includes("drill")) return "Drill";
    if (s.includes("trapsoul")) return "Trapsoul";
    if (s.includes("r&b") || s.includes("rnb")) return "90s R&B";
    if (s.includes("boom bap") || s.includes("boombap") || s.includes("old school") || s.includes("old-school")) return "Old School Hip-Hop";
    if (s.includes("uk garage") || s.includes("2-step")) return "UK Garage";
    if (s.includes("pop")) return "Pop";
    if (s.includes("trap")) return "Dark Trap";
    return "Pop";
  }, []);
  const displayedLoops = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = loops.filter((l) => {
      if (savedOnly && !l.isSaved) return false;
      if (!normalized) return true;
      const hay = `${l.name} ${l.genre} ${l.mood} ${l.key} ${l.scale}`.toLowerCase();
      return hay.includes(normalized);
    });
    return filtered
      .slice()
      .sort((a, b) => Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? ""))
      .slice(0, 10);
  }, [loops, query, savedOnly]);
  const totalMatches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return loops.filter((l) => {
      if (savedOnly && !l.isSaved) return false;
      if (!normalized) return true;
      const hay = `${l.name} ${l.genre} ${l.mood} ${l.key} ${l.scale}`.toLowerCase();
      return hay.includes(normalized);
    }).length;
  }, [loops, query, savedOnly]);

  const bars = barsFromLoopLength(form.loopLength);
  const isSong = mode === "song";
  const effectiveEngine = isSong ? "ace-step" : engine;
  const songIsCustom = isSong && songUiMode === "custom";
  const effectiveAudioFormat = plan === "free" ? "mp3" : audioFormat;
  
  // Logical effective parameters
  const effectiveBpm = isSong 
    ? (songIsCustom && songTempoMode === "manual" ? form.bpm : 0)
    : (advancedOpen && beatTempoMode === "manual" ? form.bpm : 0);
    
  const effectiveKey = isSong
    ? (songIsCustom && songKeyMode === "manual" ? form.key : "")
    : (advancedOpen && beatKeyMode === "manual" ? form.key : "");

  const effectiveScale = isSong
    ? (songIsCustom && songKeyMode === "manual" ? form.scale : "")
    : (advancedOpen && beatKeyMode === "manual" ? form.scale : "");

  const autoMetaEnabled = isSong 
    ? !songIsCustom || (songTempoMode === "auto" && songKeyMode === "auto")
    : !advancedOpen || (beatTempoMode === "auto" && beatKeyMode === "auto");

  const detectedLang = isSong ? (songVocalLanguageMode === "manual" ? manualVocalLanguage : (lyricsMode === "manual" ? detectLanguage(lyrics) : "en")) : "en";
  const songLyrics = isSong ? (lyricsMode === "manual" ? lyrics : "") : "";
  const songDurationMax = 240;
  const manualSongDurationRaw = songIsCustom && songDurationMode === "manual" ? songDurationSec : undefined;
  const manualSongDuration = typeof manualSongDurationRaw === "number" ? Math.min(manualSongDurationRaw, songDurationMax) : undefined;
  const manualSongTimeSignature = songIsCustom && songTimeSignatureMode === "manual" ? songTimeSignature : "";
  const chipExtra = !isSong ? activeChips.join(", ") : "";
  const uiPrompt = isSong
    ? [
        form.genre ? `${form.genre}` : "",
        songDescription.trim(),
        songVocalStyle ? `vocal style: ${songVocalStyle}` : "",
      ]
        .filter(Boolean)
        .join(", ")
    : [form.prompt?.trim() ?? "", chipExtra].filter((s) => s.length > 0).join(", ");

  const handleGenerate = useCallback(async () => {
    if (remaining === 0) return;
    if (generating) return;
    setGenerating(true);
    let audioUrl: string | null = null;
    let didGenerate = false;
    try {
      const prompt = isSong ? uiPrompt : [form.prompt?.trim() ?? "", chipExtra].filter((s) => s.length > 0).join(", ");
      const sampleQuery =
        isSong && lyricsMode === "ai"
          ? [
              "song with vocals",
              "audible singing/rap lyrics, not instrumental",
              songVocalStyle ? songVocalStyle : "",
              genreForSampleQuery(form.genre),
              songDescription.trim(),
            ]
              .filter(Boolean)
              .join(", ")
          : "";

      const result = await generateBeat(
        {
          genre: form.genre,
          influence: form.influence,
          key: effectiveKey,
          scale: effectiveScale,
          bpm: effectiveBpm,
          loopLengthBars: bars,
          swing: form.swing,
          mood: isSong ? "" : form.mood,
          energyLevel: isSong ? "" : form.energyLevel,
          reverb: form.reverb,
          prompt: uiPrompt,
        },
        effectiveEngine,
        isSong
          ? {
              instrumental: false,
              lyrics: songLyrics,
              vocalLanguage: detectedLang,
              autoMeta: autoMetaEnabled,
              useFormat: true,
              thinking: true,
              duration: manualSongDuration,
              timeSignature: manualSongTimeSignature || undefined,
              sampleMode: lyricsMode === "ai",
              sampleQuery,
              isSong: true,
              audioFormat: effectiveAudioFormat,
            }
          : {
              instrumental: beatInstrumental,
              lyrics: "",
              vocalLanguage: "en",
              isSong: false,
              autoMeta: autoMetaEnabled,
              useFormat: true,
              audioFormat: effectiveAudioFormat,
            },
      );
      audioUrl = result.audioUrl;
      didGenerate = Boolean(audioUrl);

      const generatedKeyScale = parseKeyScale(result.meta?.keyScale ?? "");
      const realBpm = result.meta?.bpm && result.meta.bpm > 0 ? result.meta.bpm : 0;
      const realKey = generatedKeyScale.key || "";
      const realScale = generatedKeyScale.scale || "";

      const usedBpm = autoMetaEnabled ? realBpm : effectiveBpm || form.bpm;
      const usedKey = autoMetaEnabled ? realKey : effectiveKey || form.key;
      const usedScale = autoMetaEnabled ? realScale : effectiveScale || form.scale;

      const storedPrompt = prompt;

      const loopName =
        mode === "song"
          ? `${form.genre} Song #${loops.filter((l) => l.genre === form.genre).length + 1}${usedBpm > 0 ? ` · ${usedBpm} BPM` : ""}`
          : `${form.genre} Beat #${loops.filter((l) => l.genre === form.genre).length + 1} — ${usedKey || "Auto"} ${
              usedScale === "Minor" ? "min" : usedScale === "Major" ? "maj" : usedScale
            }${usedBpm > 0 ? ` · ${usedBpm} BPM` : ""}`;

      const draft: Omit<Loop, "id" | "createdAt" | "userId"> = {
        engine: result.engine,
        name: loopName,
        genre: form.genre,
        influence: form.influence,
        key: usedKey,
        scale: usedScale,
        bpm: usedBpm,
        loopLength: form.loopLength,
        swing: form.swing,
        mood: isSong ? "" : form.mood,
        energyLevel: isSong ? "" : form.energyLevel,
        reverb: form.reverb,
        prompt: storedPrompt,
        audioUrl: audioUrl ?? null,
        details: result.meta
          ? {
              caption: result.meta.prompt ?? storedPrompt,
              lyrics: result.meta.lyrics ?? "",
              bpm: result.meta.bpm ?? null,
              duration: result.meta.duration ?? null,
              keyScale: result.meta.keyScale ?? "",
              timeSignature: result.meta.timeSignature ?? "",
              audioFormat: result.meta.audioFormat ?? effectiveAudioFormat,
            }
          : null,
        stemsUrl: null,
        isSaved: false,
      };

      try {
        const loop = await createLoop(draft);
        setCurrent(loop, true);
        toast.success("Beat generated!");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Saving failed";
        if (audioUrl) {
          const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `local-${Date.now()}`;
          const temp: Loop = {
            id,
            engine: result.engine,
            name: draft.name,
            genre: draft.genre,
            influence: draft.influence,
            key: draft.key,
            scale: draft.scale,
            bpm: draft.bpm,
            loopLength: draft.loopLength,
            swing: draft.swing,
            mood: draft.mood,
            energyLevel: draft.energyLevel,
            reverb: draft.reverb,
            prompt: draft.prompt,
            audioUrl,
            details: draft.details ?? null,
            stemsUrl: draft.stemsUrl,
            isSaved: false,
            createdAt: new Date().toISOString(),
          };
          setCurrent(temp, true);
          toast.error(`Beat generated, but saving to your library failed: ${message}`);
        } else {
          throw err;
        }
      }
    } catch (err) {
      const anyErr = err as unknown as { limitReached?: boolean };
      if (anyErr?.limitReached) {
        toast.error("Monthly limit reached — upgrade your plan");
        navigate("/pricing");
        return;
      }
      const rawMessage = err instanceof Error ? err.message : "";
      const lower = rawMessage.toLowerCase();
      const isTemporaryNetwork =
        lower.includes("failed to fetch") ||
        lower.includes("networkerror") ||
        lower.includes("load resource") ||
        lower.includes("net::err_failed") ||
        lower.includes("cors") ||
        lower.includes("timeout") ||
        lower.includes("timed out") ||
        lower.includes("502") ||
        lower.includes("503") ||
        lower.includes("504");

      if (isTemporaryNetwork) {
        toast.error("Réseau chargé — réessaie dans quelques secondes. Upgrade pour avoir la priorité.");
      } else {
        const message = rawMessage || "Generation failed — please try again";
        toast.error(message);
      }
    } finally {
      setGenerating(false);
      if (didGenerate && user) void refreshProfile();
    }
  }, [
    autoMetaEnabled,
    bars,
    beatInstrumental,
    chipExtra,
    createLoop,
    detectedLang,
    effectiveBpm,
    effectiveAudioFormat,
    effectiveEngine,
    effectiveKey,
    effectiveScale,
    form.bpm,
    form.energyLevel,
    form.genre,
    form.influence,
    form.key,
    form.loopLength,
    form.mood,
    form.prompt,
    form.reverb,
    form.scale,
    form.swing,
    generating,
    isSong,
    lyricsMode,
    loops,
    manualSongDuration,
    manualSongTimeSignature,
    mode,
    navigate,
    remaining,
    setCurrent,
    songDescription,
    songLyrics,
    songVocalStyle,
    uiPrompt,
    refreshProfile,
    user,
  ]);

  useEffect(() => {
    if (!pendingLandingPrompt) return;
    if (autoLandingGenerateRef.current) return;
    if (profileLoading) return;

    if (remaining === 0) {
      toast.error("No credits remaining — upgrade your plan");
      navigate("/pricing");
      setPendingLandingPrompt(null);
      return;
    }

    autoLandingGenerateRef.current = true;
    setMode("song");
    setSongUiMode("simple");
    setLyricsMode("ai");
    setSongDescription(pendingLandingPrompt);
    setField("prompt", pendingLandingPrompt);
    if (!form.genre) setField("genre", inferGenreFromPrompt(pendingLandingPrompt));

    const timer = window.setTimeout(() => {
      void handleGenerate();
    }, 800);

    return () => window.clearTimeout(timer);
  }, [
    form.genre,
    handleGenerate,
    inferGenreFromPrompt,
    navigate,
    pendingLandingPrompt,
    profileLoading,
    remaining,
    setField,
    setLyricsMode,
    setMode,
    setSongDescription,
    setSongUiMode,
  ]);

  useEffect(() => {
    if (!user) return;
    const raw = window.localStorage.getItem("producerhit_pending_generation");
    if (!raw) return;
    window.localStorage.removeItem("producerhit_pending_generation");
    try {
      const pending = JSON.parse(raw) as {
        mode?: "beat" | "song";
        engine?: "sonauto" | "ace-step";
        form?: Partial<{
          genre: string;
          influence: string;
          key: string;
          scale: string;
          bpm: number;
          loopLength: string;
          swing: number;
          mood: string;
          energyLevel: string;
          reverb: string;
          prompt: string;
        }>;
        lyricsMode?: "ai" | "manual";
        lyrics?: string;
        songUiMode?: "simple" | "custom";
        songDescription?: string;
        songVocalStyle?: string;
      };
      if (pending.mode) setMode(pending.mode);
      // Engine selection is not exposed. Always use ACE-Step as primary.
      const nextForm = pending.form ?? {};
      if (typeof nextForm.genre === "string") setField("genre", nextForm.genre);
      if (typeof nextForm.influence === "string") setField("influence", nextForm.influence);
      if (typeof nextForm.prompt === "string") setField("prompt", nextForm.prompt);
      if (typeof nextForm.key === "string") setField("key", nextForm.key);
      if (typeof nextForm.scale === "string") setField("scale", nextForm.scale);
      if (typeof nextForm.bpm === "number") setBpm(nextForm.bpm);
      if (typeof nextForm.loopLength === "string") setLoopLength(nextForm.loopLength as LoopLength);
      if (typeof nextForm.swing === "number") setField("swing", nextForm.swing);
      if (typeof nextForm.mood === "string") setField("mood", nextForm.mood);
      if (typeof nextForm.energyLevel === "string") setField("energyLevel", nextForm.energyLevel);
      if (typeof nextForm.reverb === "string") setField("reverb", nextForm.reverb);

      if (pending.lyricsMode) setLyricsMode(pending.lyricsMode);
      if (typeof pending.lyrics === "string") setLyrics(pending.lyrics);
      if (pending.songUiMode) setSongUiMode(pending.songUiMode);
      if (typeof pending.songDescription === "string") setSongDescription(pending.songDescription);
      if (typeof pending.songVocalStyle === "string") {
        const allowed = vocalStyleOptions.some((v) => v.value === pending.songVocalStyle);
        setSongVocalStyle(allowed ? (pending.songVocalStyle as (typeof vocalStyleOptions)[number]["value"]) : "Singer");
      }
      setAutoGeneratePending(true);
    } catch {
      setAutoGeneratePending(false);
    }
  }, [setBpm, setField, setLoopLength, setLyrics, setLyricsMode, setMode, setSongDescription, setSongUiMode, setSongVocalStyle, user]);

  useEffect(() => {
    if (!autoGeneratePending) return;
    if (!user) return;
    if (generating || profileLoading) return;
    if (!form.genre) return;
    setAutoGeneratePending(false);
    void handleGenerate();
  }, [autoGeneratePending, form.genre, generating, handleGenerate, profileLoading, user]);

  return (
    <AppShell
      left={
        <div className="flex h-full flex-col overflow-hidden">
          <div className="border-b border-pk-border px-4 pb-3 pt-4">
            <div className="text-lg font-bold tracking-tight">
              <span className="lowercase text-pk-text">producer</span>
              <span className="lowercase text-[#7c3aed]">hit</span>
            </div>
          </div>
          <div className="border-b border-pk-border p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode("song")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    mode === "song" ? "bg-[#7c3aed] text-white" : "bg-white/5 text-pk-muted hover:text-pk-text"
                  }`}
                >
                  Song
                </button>
                <button
                  type="button"
                  onClick={() => setMode("beat")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    mode === "beat" ? "bg-[#7c3aed] text-white" : "bg-white/5 text-pk-muted hover:text-pk-text"
                  }`}
                >
                  Beat
                </button>
              </div>
              {mode === "song" ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSongUiMode("simple")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      songUiMode === "simple" ? "bg-[#7c3aed] text-white" : "bg-white/5 text-pk-muted hover:text-pk-text"
                    }`}
                  >
                    Simple
                  </button>
                  <button
                    type="button"
                    onClick={() => setSongUiMode("custom")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      songUiMode === "custom" ? "bg-[#7c3aed] text-white" : "bg-white/5 text-pk-muted hover:text-pk-text"
                    }`}
                  >
                    Custom
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((v) => !v)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    advancedOpen ? "bg-white/10 text-pk-text" : "bg-white/5 text-pk-muted hover:text-pk-text"
                  }`}
                >
                  Advanced
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {mode === "beat" ? (
              <>
                <div className="border-b border-pk-border p-4">
                  <div className="text-sm font-semibold">Style & Vibe</div>
                  <div className="mt-4 grid gap-4">
                    <Dropdown
                      label="Genre"
                      value={form.genre}
                      onChange={(v) => setField("genre", v)}
                      options={genreOptions}
                      placeholder="Select…"
                      disabled={generating}
                    />
                    
                    <div>
                      <div className="text-xs text-pk-muted">Mood</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {moodOptions.map((m) => {
                          const active = form.mood === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setField("mood", m)}
                              className={
                                active
                                  ? "rounded-full border border-pk-accent/40 bg-pk-accent/15 px-3 py-1 text-xs font-semibold text-pk-accent"
                                  : "rounded-full border border-pk-border bg-pk-bg px-3 py-1 text-xs text-pk-muted hover:bg-white/5 hover:text-pk-text"
                              }
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {advancedOpen && (
                      <Dropdown
                        label="Influence"
                        value={form.influence}
                        onChange={(v) => setField("influence", v)}
                        options={influenceOptions}
                        disabled={generating}
                      />
                    )}
                  </div>
                </div>

                <div className="border-b border-pk-border p-4">
                  <div className="text-sm font-semibold">The Idea</div>
                  <div className="mt-2 text-xs text-pk-muted">Describe the sound or use chips.</div>
                  
                  <input
                    value={form.prompt}
                    onChange={(e) => setField("prompt", e.target.value)}
                    disabled={generating}
                    className="mt-3 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm outline-none placeholder:text-pk-muted focus:border-pk-accent"
                    placeholder="e.g. dark melodic, smooth 808s"
                  />
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getInspirationChipsForGenre(form.genre).map((chip) => {
                      const on = activeChips.includes(chip);
                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            setActiveChips((prev) => (prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]));
                          }}
                          className={
                            on
                              ? "rounded-full border border-pk-accent/40 bg-pk-accent/15 px-3 py-1 text-[11px] font-semibold text-pk-accent"
                              : "rounded-full border border-pk-border bg-pk-bg px-3 py-1 text-[11px] text-pk-muted hover:bg-white/5 hover:text-pk-text"
                          }
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {advancedOpen && (
                  <div className="border-b border-pk-border p-4">
                    <div className="text-sm font-semibold">Tempo & Key</div>

                    <div className="mt-4 grid gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-pk-muted">BPM</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setBeatTempoMode("auto")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                beatTempoMode === "auto" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              onClick={() => setBeatTempoMode("manual")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                beatTempoMode === "manual" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Man
                            </button>
                          </div>
                        </div>
                        {beatTempoMode === "manual" ? (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="text-[11px] text-pk-muted">Manual BPM</div>
                              <input
                                type="number"
                                min={60}
                                max={200}
                                value={form.bpm}
                                onChange={(e) => setBpm(Math.max(60, Math.min(200, Number(e.target.value))))}
                                disabled={generating}
                                className="w-16 bg-transparent text-right text-sm font-semibold text-pk-text outline-none"
                              />
                            </div>
                            <div className="mt-3 flex gap-2">
                              {bpmPresets.map((p) => (
                                <button
                                  key={p.label}
                                  type="button"
                                  onClick={() => setBpm(p.value)}
                                  className={`flex-1 rounded-pk border py-1.5 text-[11px] transition-colors ${
                                    form.bpm === p.value
                                      ? "border-pk-accent/40 bg-pk-accent/15 text-pk-accent"
                                      : "border-pk-border bg-pk-bg text-pk-muted hover:text-pk-text"
                                  }`}
                                >
                                  {p.value}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">The AI will decide the best BPM for your style.</div>
                        )}
                      </div>

                      <div className="grid gap-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-pk-muted">Musical Key</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setBeatKeyMode("auto")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                beatKeyMode === "auto" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              onClick={() => setBeatKeyMode("manual")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                beatKeyMode === "manual" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Man
                            </button>
                          </div>
                        </div>

                        {beatKeyMode === "manual" ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Dropdown
                                label=""
                                value={form.key}
                                onChange={(v) => setField("key", v)}
                                options={keyOptions.map((k) => ({ value: k, label: k }))}
                                disabled={generating}
                              />
                            </div>
                            <div>
                              <Dropdown
                                label=""
                                value={form.scale}
                                onChange={(v) => setField("scale", v)}
                                options={scaleOptions}
                                disabled={generating}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">The AI will pick the best key/scale.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {advancedOpen && (
                  <div className="border-b border-pk-border p-4 bg-pk-bg/30">
                    <div className="text-sm font-semibold">Advanced</div>
                    <div className="mt-4 grid gap-4">
                      <div>
                        <div className="text-xs text-pk-muted mb-2">Length</div>
                        <div className="grid grid-cols-4 gap-2">
                          {lengths.map((l) => {
                            const active = form.loopLength === l;
                            return (
                              <button
                                key={l}
                                type="button"
                                onClick={() => setLoopLength(l)}
                                className={
                                  active
                                    ? "rounded-pk border border-pk-accent/40 bg-pk-accent/15 py-2 text-[11px] font-semibold text-pk-accent"
                                    : "rounded-pk border border-pk-border bg-pk-bg py-2 text-[11px] text-pk-muted hover:bg-white/5 hover:text-pk-text"
                                }
                              >
                                {l.replace(" bars", "")}b
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <Slider
                        label="Swing"
                        value={form.swing}
                        min={0}
                        max={100}
                        onChange={(v) => setField("swing", v)}
                        rightLabel={`${form.swing}%`}
                      />

                      <Dropdown
                        label="Reverb"
                        value={form.reverb}
                        onChange={(v) => setField("reverb", v)}
                        options={reverbOptions}
                        disabled={generating}
                      />

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-pk-muted">Audio Format</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setAudioFormat("mp3")}
                              disabled={generating}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                effectiveAudioFormat === "mp3" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              MP3
                            </button>
                            <button
                              type="button"
                              onClick={() => setAudioFormat("wav")}
                              disabled={generating || plan === "free"}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                effectiveAudioFormat === "wav" ? "bg-pk-accent text-white" : "text-pk-muted"
                              } ${plan === "free" ? "opacity-50" : ""}`}
                            >
                              WAV
                            </button>
                          </div>
                        </div>
                        {plan === "free" ? (
                          <div className="text-[10px] text-pk-muted italic">WAV is available on Pro/Studio.</div>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">Affects generation + download.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4">
                  <details className="group">
                    <summary className="cursor-pointer select-none text-xs font-semibold text-pk-muted hover:text-pk-text flex items-center gap-1">
                      <Search className="h-3 w-3" />
                      <span>Quick Presets</span>
                    </summary>
                    <div className="mt-3 grid gap-2">
                      {presets.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => {
                            setField("genre", p.genre);
                            setField("influence", p.influence);
                            setBpm(p.bpm);
                            setField("mood", p.mood);
                            setField("energyLevel", p.energyLevel);
                            setLoopLength(p.loopLength);
                            setField("prompt", p.prompt);
                            setField("key", p.key);
                            setField("scale", p.scale);
                          }}
                          className="flex items-center justify-between rounded-pk border border-pk-border bg-pk-bg px-3 py-2 text-left text-[11px] text-pk-text hover:bg-white/5"
                        >
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-pk-muted">{p.bpm} BPM</span>
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              </>
            ) : null}

            {mode === "song" ? (
              <>
                <div className="border-b border-pk-border p-4">
                  <div className="text-sm font-semibold">Style & Vibe</div>
                  <div className="mt-4 grid gap-4">
                    <Dropdown
                      label="Genre"
                      value={form.genre}
                      onChange={(v) => setField("genre", v)}
                      options={genreOptions}
                      placeholder="Select…"
                      disabled={generating}
                    />

                    <Dropdown
                      label="Vocal Language"
                      value={songVocalLanguageMode === "auto" ? "auto" : manualVocalLanguage}
                      onChange={(v) => {
                        if (v === "auto") {
                          setSongVocalLanguageMode("auto");
                        } else {
                          setSongVocalLanguageMode("manual");
                          setManualVocalLanguage(v);
                        }
                      }}
                      options={[{ value: "auto", label: "🌐 Auto" }, ...vocalLanguageOptions]}
                      disabled={generating}
                    />

                    <div>
                      <div className="text-xs text-pk-muted">Vocal Style</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {vocalStyleOptions.map((v) => {
                          const active = songVocalStyle === v.value;
                          return (
                            <button
                              key={v.value}
                              type="button"
                              onClick={() => setSongVocalStyle(v.value)}
                              className={
                                active
                                  ? "rounded-full border border-pk-accent/40 bg-pk-accent/15 px-3 py-1 text-xs font-semibold text-pk-accent"
                                  : "rounded-full border border-pk-border bg-pk-bg px-3 py-1 text-xs text-pk-muted hover:bg-white/5 hover:text-pk-text"
                              }
                              disabled={generating}
                            >
                              {v.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-b border-pk-border p-4">
                  <div className="text-sm font-semibold">The Idea</div>
                  <div className="mt-2 text-xs text-pk-muted">Describe your song idea or use chips.</div>
                  
                  <input
                    value={songDescription}
                    onChange={(e) => setSongDescription(e.target.value)}
                    disabled={generating}
                    className="mt-3 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm outline-none placeholder:text-pk-muted focus:border-pk-accent"
                    placeholder="e.g. emotional hook, radio-ready pop sound"
                  />
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getInspirationChipsForGenre(form.genre).map((chip) => {
                      const on = songDescription.includes(chip);
                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            const current = songDescription.trim();
                            if (on) {
                              setSongDescription(current.split(",").map(s => s.trim()).filter(s => s !== chip).join(", "));
                            } else {
                              setSongDescription(current ? `${current}, ${chip}` : chip);
                            }
                          }}
                          className={
                            on
                              ? "rounded-full border border-pk-accent/40 bg-pk-accent/15 px-3 py-1 text-[11px] font-semibold text-pk-accent"
                              : "rounded-full border border-pk-border bg-pk-bg px-3 py-1 text-[11px] text-pk-muted hover:bg-white/5 hover:text-pk-text"
                          }
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-b border-pk-border p-4">
                  <div className="text-sm font-semibold">The Lyrics</div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLyricsMode("manual")}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                        lyricsMode === "manual" ? "bg-[#7c3aed] text-white" : "bg-white/5 text-pk-muted hover:text-pk-text"
                      }`}
                      disabled={generating}
                    >
                      ✏️ I write
                    </button>
                    <button
                      type="button"
                      onClick={() => setLyricsMode("ai")}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                        lyricsMode === "ai" ? "bg-[#7c3aed] text-white" : "bg-white/5 text-pk-muted hover:text-pk-text"
                      }`}
                      disabled={generating}
                    >
                      ✨ AI writes
                    </button>
                  </div>
                  {lyricsMode === "manual" ? (
                    <textarea
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      disabled={generating}
                      className="mt-3 min-h-[160px] w-full resize-none rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm outline-none placeholder:text-pk-muted focus:border-pk-accent"
                      placeholder={"[Verse]\nWrite your lyrics here...\n\n[Chorus]\nWrite your hook here..."}
                    />
                  ) : (
                    <div className="mt-3 rounded-pk border border-pk-border bg-pk-bg p-4 text-center">
                      <p className="text-[11px] italic text-pk-muted leading-relaxed">
                        ✨ AI will write original lyrics based on your genre and idea — you'll hear them in the generated song.
                      </p>
                    </div>
                  )}
                </div>

                {songIsCustom && (
                  <div className="border-b border-pk-border p-4 bg-pk-bg/30">
                    <div className="text-sm font-semibold">Song Customization</div>
                    <div className="mt-4 grid gap-4">
                      <Dropdown
                        label="Influence"
                        value={form.influence}
                        onChange={(v) => setField("influence", v)}
                        options={influenceOptions}
                        disabled={generating}
                      />
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-pk-muted">Tempo</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setSongTempoMode("auto")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songTempoMode === "auto" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              onClick={() => setSongTempoMode("manual")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songTempoMode === "manual" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Man
                            </button>
                          </div>
                        </div>
                        {songTempoMode === "manual" ? (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="text-[11px] text-pk-muted">BPM</div>
                              <input
                                type="number"
                                min={60}
                                max={200}
                                value={form.bpm}
                                onChange={(e) => setBpm(Math.max(60, Math.min(200, Number(e.target.value))))}
                                disabled={generating}
                                className="w-12 bg-transparent text-right text-[11px] font-semibold text-pk-text outline-none"
                              />
                            </div>
                            <div className="mt-2 flex gap-1.5">
                              {[90, 120, 140].map((v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setBpm(v)}
                                  className={`flex-1 rounded-pk border py-1 text-[10px] transition-colors ${
                                    form.bpm === v 
                                      ? "border-pk-accent/40 bg-pk-accent/15 text-pk-accent" 
                                      : "border-pk-border bg-pk-bg text-pk-muted hover:text-pk-text"
                                  }`}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">The AI picks the best tempo.</div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-pk-muted">Duration</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setSongDurationMode("auto")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songDurationMode === "auto" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              onClick={() => setSongDurationMode("manual")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songDurationMode === "manual" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Man
                            </button>
                          </div>
                        </div>
                        {songDurationMode === "manual" ? (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="text-[11px] text-pk-muted">Seconds</div>
                              <input
                                type="number"
                                min={10}
                                max={songDurationMax}
                                value={songDurationSec}
                                onChange={(e) => setSongDurationSec(Math.max(10, Math.min(songDurationMax, Number(e.target.value) || 30)))}
                                disabled={generating}
                                className="w-12 bg-transparent text-right text-[11px] font-semibold text-pk-text outline-none"
                              />
                            </div>
                            <div className="mt-2 flex gap-1.5">
                              {songDurationPresets.filter((p) => p <= songDurationMax).map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => setSongDurationSec(p)}
                                  className={`flex-1 rounded-pk border py-1 text-[10px] transition-colors ${
                                    songDurationSec === p 
                                      ? "border-pk-accent/40 bg-pk-accent/15 text-pk-accent" 
                                      : "border-pk-border bg-pk-bg text-pk-muted hover:text-pk-text"
                                  }`}
                                >
                                  {p}s
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">The AI picks the duration.</div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-pk-muted">Audio Format</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setAudioFormat("mp3")}
                              disabled={generating}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                effectiveAudioFormat === "mp3" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              MP3
                            </button>
                            <button
                              type="button"
                              onClick={() => setAudioFormat("wav")}
                              disabled={generating || plan === "free"}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                effectiveAudioFormat === "wav" ? "bg-pk-accent text-white" : "text-pk-muted"
                              } ${plan === "free" ? "opacity-50" : ""}`}
                            >
                              WAV
                            </button>
                          </div>
                        </div>
                        {plan === "free" ? (
                          <div className="text-[10px] text-pk-muted italic">WAV is available on Pro/Studio.</div>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">Affects generation + download.</div>
                        )}
                      </div>

                      <div className="bg-pk-bg/50 rounded-pk p-3 border border-pk-border/30">
                        <div className="text-xs text-pk-muted mb-2">Context & Inspiration (Chips)</div>
                        <div className="flex flex-wrap gap-1.5">
                          {getInspirationChipsForGenre(form.genre).map((chip) => {
                            const on = songDescription.includes(chip);
                            return (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => {
                                  const current = songDescription.trim();
                                  if (on) {
                                    setSongDescription(current.split(",").map(s => s.trim()).filter(s => s !== chip).join(", "));
                                  } else {
                                    setSongDescription(current ? `${current}, ${chip}` : chip);
                                  }
                                }}
                                className={
                                  on
                                    ? "rounded-full border border-pk-accent/40 bg-pk-accent/15 px-2 py-0.5 text-[10px] font-semibold text-pk-accent"
                                    : "rounded-full border border-pk-border bg-pk-bg px-2 py-0.5 text-[10px] text-pk-muted hover:bg-white/5 hover:text-pk-text"
                                }
                              >
                                {chip}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-pk-muted">Musical Key</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setSongKeyMode("auto")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songKeyMode === "auto" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              onClick={() => setSongKeyMode("manual")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songKeyMode === "manual" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Man
                            </button>
                          </div>
                        </div>
                        {songKeyMode === "manual" ? (
                          <div className="grid gap-2">
                            <div className="grid grid-cols-6 gap-1">
                              {keyOptions.map((k) => {
                                const active = form.key === k;
                                return (
                                  <button
                                    key={k}
                                    type="button"
                                    onClick={() => setField("key", k)}
                                    className={
                                      active
                                        ? "rounded-pk border border-pk-accent/40 bg-pk-accent/15 py-1 text-[10px] font-semibold text-pk-accent"
                                        : "rounded-pk border border-pk-border bg-pk-bg py-1 text-[10px] text-pk-muted hover:bg-white/5 hover:text-pk-text"
                                    }
                                  >
                                    {k}
                                  </button>
                                );
                              })}
                            </div>
                            <Dropdown
                              label=""
                              value={form.scale}
                              onChange={(v) => setField("scale", v)}
                              options={scaleOptions}
                              disabled={generating}
                            />
                          </div>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">The AI picks key & scale.</div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-pk-muted">Time Signature</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setSongTimeSignatureMode("auto")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songTimeSignatureMode === "auto" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              onClick={() => setSongTimeSignatureMode("manual")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songTimeSignatureMode === "manual" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Man
                            </button>
                          </div>
                        </div>
                        {songTimeSignatureMode === "manual" ? (
                          <div className="grid grid-cols-4 gap-1.5">
                            {timeSignatureOptions.map((sig) => (
                              <button
                                key={sig}
                                type="button"
                                onClick={() => setSongTimeSignature(sig)}
                                className={`rounded-pk border py-1 text-[10px] transition-colors ${
                                  songTimeSignature === sig 
                                    ? "border-pk-accent/40 bg-pk-accent/15 text-pk-accent" 
                                    : "border-pk-border bg-pk-bg text-pk-muted hover:text-pk-text"
                                }`}
                              >
                                {sig}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">The AI picks the signature.</div>
                        )}
                      </div>

                      <Slider
                        label="Reverb"
                        value={form.reverb === "Dry" ? 0 : form.reverb === "Subtle" ? 25 : form.reverb === "Medium" ? 50 : 80}
                        min={0}
                        max={100}
                        onChange={(v) => {
                          const label = v < 15 ? "Dry" : v < 40 ? "Subtle" : v < 70 ? "Medium" : "Heavy";
                          setField("reverb", label);
                        }}
                        rightLabel={form.reverb}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          <div className="border-t border-pk-border p-4 flex-shrink-0">
            <Button
              variant="primary"
              className="w-full"
              disabled={!form.genre || generating || profileLoading || remaining === 0}
              onClick={async () => {
                if (remaining === 0) return;
                if (generating) return;
                if (!user) {
                  window.localStorage.setItem(
                    "producerhit_pending_generation",
                    JSON.stringify({
                      mode,
                      engine,
                      form,
                      lyricsMode,
                      lyrics,
                      songUiMode,
                      songDescription,
                      songVocalStyle,
                    }),
                  );
                  navigate("/auth", { state: { from: "/dashboard" } });
                  return;
                }
                await handleGenerate();
              }}
            >
              <span className={generating ? "inline-flex items-center gap-2 animate-pulse" : "inline-flex items-center gap-2"}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <AudioWaveform className="h-4 w-4" />}
                {generating ? "Generating..." : mode === "song" ? "Generate Song" : "Generate Beat"}
              </span>
            </Button>

            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                {remaining} generation{remaining !== 1 ? "s" : ""} remaining this month
              </span>
              <span className="text-gray-600">{plan} plan</span>
            </div>
            {remaining === 0 ? (
              <div className="mt-2 flex flex-col gap-2 text-xs text-gray-500">
                {plan === "free" ? "You've used all 3 free generations this month" : "No credits remaining — upgrade your plan"}
                <Link to="/pricing" className="text-[#7c3aed] hover:underline">
                  {plan === "free" ? "Upgrade to Pro — $10/mo" : "View pricing"}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-32 pt-6 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold">My Workspace</div>
            <div className="mt-1 text-sm text-pk-muted">
              Showing {Math.min(10, totalMatches)} of {totalMatches}
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-pk-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your creations..."
                className="w-full rounded-pk border border-pk-border bg-pk-panel px-9 py-2 text-sm outline-none placeholder:text-pk-muted focus:border-pk-accent"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSavedOnly(false)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  !savedOnly ? "bg-[#7c3aed] text-white" : "bg-white/5 text-pk-muted hover:text-pk-text"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSavedOnly(true)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  savedOnly ? "bg-[#7c3aed] text-white" : "bg-white/5 text-pk-muted hover:text-pk-text"
                }`}
              >
                Saved
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {generating && (
            <div className="flex items-center gap-4 rounded-pk border border-pk-accent/30 bg-pk-panel p-4">
              <div className="flex items-end gap-[3px]" style={{ height: "40px" }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-[4px] rounded-full bg-pk-accent"
                    style={{
                      height: "100%",
                      animation: "soundwave 1s ease-in-out infinite",
                      animationDelay: `${i * 0.1}s`,
                      transformOrigin: "bottom",
                    }}
                  />
                ))}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-pk-text">{mode === "song" ? "Generating your song..." : "Generating your beat..."}</div>
                <div className="mt-1 text-xs text-pk-muted">Usually 15–25 seconds</div>
              </div>
              <div className="h-1 w-32 overflow-hidden rounded-full bg-pk-border">
                <div className="h-full w-2/5 rounded-full bg-pk-accent" style={{ animation: "indeterminate 1.5s ease-in-out infinite" }} />
              </div>
            </div>
          )}
          {displayedLoops.length === 0 ? (
            <EmptyState
              title="Your creations will appear here"
              description={`Configure your sound and hit ${mode === "song" ? "Generate Song" : "Generate Beat"}.`}
              accent
            />
          ) : (
            displayedLoops.map((l) => (
              <div key={l.id}>
                <LoopCardItem loop={l} onOpenDetails={() => setDetailsId(l.id)} />
              </div>
            ))
          )}
        </div>
      </div>

      {detailsLoop ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-black/50"
            aria-label="Close details"
            onClick={() => setDetailsId(null)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-[420px] overflow-y-auto border-l border-pk-border bg-pk-panel/95 p-5 backdrop-blur">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#7c3aed]/20 to-transparent" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{detailsLoop.name}</div>
                <div className="mt-1 text-xs text-pk-muted">{detailsLoop.genre}</div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setDetailsId(null)} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                <div className="flex items-center gap-1 text-pk-muted">
                  <Gauge className="h-3.5 w-3.5" />
                  BPM
                </div>
                <div className="mt-1 font-semibold text-pk-text">
                  {typeof detailsLoop.details?.bpm === "number" && detailsLoop.details.bpm > 0 ? detailsLoop.details.bpm : "—"}
                </div>
              </div>
              <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                <div className="flex items-center gap-1 text-pk-muted">
                  <Clock className="h-3.5 w-3.5" />
                  Duration
                </div>
                <div className="mt-1 font-semibold text-pk-text">
                  {(() => {
                    const dur = (detailsLoop.details?.duration ?? durationsSecById[detailsLoop.id]) as number | null | undefined;
                    return typeof dur === "number" && isFinite(dur) && dur > 0 ? formatTime(dur) : "—";
                  })()}
                </div>
              </div>
              <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                <div className="flex items-center gap-1 text-pk-muted">
                  <KeyRound className="h-3.5 w-3.5" />
                  Key
                </div>
                <div className="mt-1 font-semibold text-pk-text">{detailsLoop.details?.keyScale || "—"}</div>
              </div>
              <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                <div className="flex items-center gap-1 text-pk-muted">
                  <Sigma className="h-3.5 w-3.5" />
                  Time Sig
                </div>
                <div className="mt-1 font-semibold text-pk-text">{detailsLoop.details?.timeSignature || "—"}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-pk-text">
                <Info className="h-4 w-4 text-pk-muted" />
                Details
              </div>
              <div className="mt-2 rounded-pk border border-pk-border bg-white/5 p-3 text-xs text-pk-text">
                {detailsLoop.details?.caption || detailsLoop.prompt || "—"}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-pk-text">Lyrics</div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!detailsLoop.details?.lyrics?.trim()}
                  onClick={() => {
                    const text = detailsLoop.details?.lyrics?.trim() ?? "";
                    if (!text) return;
                    void (async () => {
                      try {
                        await navigator.clipboard.writeText(text);
                        toast.success("Lyrics copied");
                      } catch {
                        toast.error("Copy failed");
                      }
                    })();
                  }}
                  aria-label="Copy lyrics"
                  title="Copy lyrics"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <pre className="mt-2 whitespace-pre-wrap rounded-pk border border-pk-border bg-white/5 p-3 text-xs text-pk-text">
                {detailsLoop.details?.lyrics?.trim() ? detailsLoop.details.lyrics.trim() : "—"}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
