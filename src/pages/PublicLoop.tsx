import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Pause, Play, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";
import { useLocaleStore } from "@/stores/localeStore";

type LoopRow = {
  id: string;
  name: string;
  genre: string;
  influence: string;
  key: string;
  scale: string;
  bpm: number;
  mood: string;
  energy_level: string;
  reverb: string;
  prompt: string;
  audio_url: string | null;
  is_public: boolean;
  created_at: string;
  seed: number | null;
};

export default function PublicLoop() {
  const { id } = useParams();
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<LoopRow | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const shareUrl = useMemo(() => (id ? `https://www.producerhit.com/loop/${id}` : "https://www.producerhit.com/explore"), [id]);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    setLoading(true);
    void (async () => {
      const { data, error } = await supabase
        .from("loops")
        .select("id,name,genre,influence,key,scale,bpm,mood,energy_level,reverb,prompt,audio_url,is_public,created_at,seed")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setRow(null);
      } else {
        setRow((data as LoopRow | null) ?? null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const canView = row?.is_public === true;
  if (!id) return <Navigate to="/explore" replace />;
  if (!loading && (!row || !canView)) return <Navigate to="/explore" replace />;

  const togglePlay = () => {
    if (!row?.audio_url) return;
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    audioRef.current?.pause();
    const a = new Audio(row.audio_url);
    audioRef.current = a;
    a.onended = () => setPlaying(false);
    void a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(isFr ? "Lien copié" : "Link copied");
    } catch {
      toast.error(isFr ? "Impossible de copier" : "Could not copy");
    }
  };

  const remix = () => {
    const seed = typeof row?.seed === "number" ? row.seed : null;
    const prompt = row?.prompt ?? "";
    const next = seed !== null ? seed + Math.floor(Math.random() * 100) : undefined;
    const qs = new URLSearchParams();
    if (prompt) qs.set("prompt", prompt);
    if (typeof next === "number") qs.set("seed", String(next));
    window.location.href = `/dashboard?${qs.toString()}`;
  };

  return (
    <div className="min-h-screen bg-[#f8f7ff] text-[#1a1a2e]">
      <Navbar variant="marketing" />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="text-sm text-[#6b7280]">
          <Link className="font-semibold text-[#6d28d9] hover:underline" to="/explore">
            {isFr ? "Explorer" : "Explore"}
          </Link>
          <span className="px-2">/</span>
          <span>{row?.name ?? (isFr ? "Chargement…" : "Loading…")}</span>
        </div>

        <div className="mt-8 rounded-2xl border border-[#e5e7eb] bg-white p-6">
          {loading || !row ? (
            <div>
              <div className="h-5 w-2/3 animate-pulse rounded bg-[#f3f4f6]" />
              <div className="mt-4 h-3 w-full animate-pulse rounded bg-[#f3f4f6]" />
              <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-[#f3f4f6]" />
              <div className="mt-6 h-11 w-36 animate-pulse rounded-full bg-[#f3f4f6]" />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-balance text-2xl font-bold tracking-tight">{row.name}</h1>
                  <div className="mt-2 text-xs font-semibold text-[#6b7280]">
                    {row.genre} · {row.bpm > 0 ? `${row.bpm} BPM` : isFr ? "Auto BPM" : "Auto BPM"} ·{" "}
                    {row.key ? `${row.key} ${row.scale}` : isFr ? "Auto key" : "Auto key"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={togglePlay}
                  disabled={!row.audio_url}
                  className={[
                    "inline-flex h-11 w-11 items-center justify-center rounded-full border",
                    row.audio_url ? "border-[#e5e7eb] bg-white hover:bg-[#f8f7ff]" : "cursor-not-allowed border-[#e5e7eb] bg-white text-[#9ca3af]",
                  ].join(" ")}
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold text-[#6b7280]">{isFr ? "Prompt" : "Prompt"}</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-[#1a1a2e]">{row.prompt || "—"}</div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={remix}
                  className="inline-flex items-center justify-center rounded-full bg-[#6d28d9] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5b21b6]"
                >
                  {isFr ? "Remix (similaire)" : "Remix (similar)"}
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-5 py-2 text-sm font-semibold hover:bg-[#f8f7ff]"
                >
                  <Share2 className="h-4 w-4" />
                  {isFr ? "Copier le lien" : "Copy link"}
                </button>
              </div>
            </>
          )}
        </div>

        <footer className="mt-14 border-t border-[#e5e7eb] pt-8 text-sm text-[#6b7280]">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/blog" className="hover:text-[#1a1a2e]">
              {isFr ? "Blog" : "Blog"}
            </Link>
            <Link to="/legal#privacy" className="hover:text-[#1a1a2e]">
              {isFr ? "Confidentialité" : "Privacy"}
            </Link>
            <Link to="/legal#terms" className="hover:text-[#1a1a2e]">
              {isFr ? "Conditions" : "Terms"}
            </Link>
            <Link to="/legal#contact" className="hover:text-[#1a1a2e]">
              {isFr ? "Support" : "Support"}
            </Link>
            <a className="hover:text-[#1a1a2e]" href="mailto:info.producermarket@gmail.com">
              info.producermarket@gmail.com
            </a>
          </div>
          <div className="mt-4">© 2026 ProducerHit</div>
        </footer>
      </main>
    </div>
  );
}

