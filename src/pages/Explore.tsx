import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Pause } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";
import { useLocaleStore } from "@/stores/localeStore";

type PublicLoopRow = {
  id: string;
  name: string;
  genre: string;
  mood: string;
  bpm: number;
  key: string;
  scale: string;
  prompt: string;
  audio_url: string | null;
  created_at: string;
};

function formatDate(d: string) {
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return d;
  }
}

export default function Explore() {
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PublicLoopRow[]>([]);
  const [genre, setGenre] = useState<string>("All");
  const [sort, setSort] = useState<"new" | "random">("new");

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const genres = useMemo(() => {
    const set = new Set(rows.map((r) => r.genre).filter(Boolean));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const q = supabase
        .from("loops")
        .select("id,name,genre,mood,bpm,key,scale,prompt,audio_url,created_at")
        .eq("is_public", true)
        .limit(60);
      const res = sort === "new" ? q.order("created_at", { ascending: false }) : q.order("created_at", { ascending: false });
      const { data, error } = await res;
      if (cancelled) return;
      if (error) {
        setRows([]);
      } else {
        const mapped = (data as PublicLoopRow[] | null) ?? [];
        setRows(mapped);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sort]);

  const filtered = useMemo(() => {
    const base = genre === "All" ? rows : rows.filter((r) => r.genre === genre);
    if (sort === "random") {
      const copy = base.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }
    return base;
  }, [genre, rows, sort]);

  const togglePlay = (r: PublicLoopRow) => {
    if (!r.audio_url) return;
    if (playingId === r.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const a = new Audio(r.audio_url);
    audioRef.current = a;
    a.onended = () => setPlayingId(null);
    void a.play().then(() => setPlayingId(r.id)).catch(() => setPlayingId(null));
  };

  const stop = () => {
    audioRef.current?.pause();
    setPlayingId(null);
  };

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f7ff] text-[#1a1a2e]">
      <Navbar variant="marketing" />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <header className="max-w-3xl">
          <h1 className="text-balance text-3xl font-bold tracking-tight">{isFr ? "Explorer" : "Explore"}</h1>
          <p className="mt-3 text-balance text-sm text-[#6b7280]">
            {isFr
              ? "Découvre des créations publiques et trouve des idées de prompts."
              : "Discover public creations and find prompt inspiration."}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-3 py-2">
              <span className="text-xs font-semibold text-[#6b7280]">{isFr ? "Genre" : "Genre"}</span>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="bg-transparent text-sm font-semibold outline-none"
              >
                {genres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-3 py-2">
              <span className="text-xs font-semibold text-[#6b7280]">{isFr ? "Tri" : "Sort"}</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "new" | "random")}
                className="bg-transparent text-sm font-semibold outline-none"
              >
                <option value="new">{isFr ? "Nouveaux" : "Newest"}</option>
                <option value="random">{isFr ? "Aléatoire" : "Random"}</option>
              </select>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-[#6d28d9] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5b21b6]"
            >
              {isFr ? "Générer" : "Generate"}
            </Link>
          </div>
        </header>

        <section className="mt-10 grid gap-4 md:grid-cols-2" aria-label="Public creations">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-[#f3f4f6]" />
                  <div className="mt-3 h-3 w-full animate-pulse rounded bg-[#f3f4f6]" />
                  <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-[#f3f4f6]" />
                  <div className="mt-4 h-10 w-28 animate-pulse rounded-full bg-[#f3f4f6]" />
                </div>
              ))
            : filtered.map((r) => (
                <article key={r.id} className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">
                        <Link className="hover:text-[#6d28d9]" to={`/loop/${r.id}`}>
                          {r.name}
                        </Link>
                      </h2>
                      <div className="mt-1 text-xs font-semibold text-[#6b7280]">
                        {r.genre} · {r.bpm > 0 ? `${r.bpm} BPM` : isFr ? "Auto BPM" : "Auto BPM"} · {r.key ? `${r.key} ${r.scale}` : isFr ? "Auto key" : "Auto key"} ·{" "}
                        {formatDate(r.created_at)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePlay(r)}
                      disabled={!r.audio_url}
                      className={[
                        "inline-flex h-11 w-11 items-center justify-center rounded-full border text-sm font-bold",
                        r.audio_url ? "border-[#e5e7eb] bg-white hover:bg-[#f8f7ff]" : "cursor-not-allowed border-[#e5e7eb] bg-white text-[#9ca3af]",
                      ].join(" ")}
                      aria-label={playingId === r.id ? "Pause" : "Play"}
                    >
                      {playingId === r.id ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm text-[#6b7280]">{r.prompt || (isFr ? "—" : "—")}</p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold text-[#6b7280]">{r.mood ? `${isFr ? "Mood" : "Mood"}: ${r.mood}` : ""}</div>
                    <Link className="text-sm font-semibold text-[#6d28d9] hover:underline" to={`/loop/${r.id}`}>
                      {isFr ? "Voir" : "View"}
                    </Link>
                  </div>
                </article>
              ))}
        </section>

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

