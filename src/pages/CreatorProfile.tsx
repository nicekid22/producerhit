import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ExternalLink, Loader2, Users } from "lucide-react";
import toast from "react-hot-toast";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/Button";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import {
  creatorProfileErrorMessage,
  creatorTypeLabel,
  fetchPublicProfile,
  fetchUserPublicLoops,
  socialUrl,
  toggleProfileFollow,
  type PublicProfile,
  type UserPublicLoop,
} from "@/lib/creatorProfile";
import { COVER_SURFACE_CLASS, cn } from "@/lib/utils";
import { resolveLoopDisplayCoverUrl } from "@/lib/coverArt";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import type { Loop } from "@/types/loop";

function toLoop(row: UserPublicLoop): Loop {
  return {
    id: row.id,
    name: row.name,
    genre: row.genre ?? "",
    influence: "No Influence",
    key: "",
    scale: "",
    bpm: row.bpm ?? 0,
    loopLength: "8 bars",
    swing: 0,
    mood: row.mood ?? "",
    energyLevel: "",
    reverb: "",
    prompt: "",
    audioUrl: null,
    details: null,
    stemsUrl: null,
    isSaved: false,
    isPublic: true,
    createdAt: row.created_at ?? new Date().toISOString(),
    seed: row.seed ?? null,
  };
}

export default function CreatorProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loops, setLoops] = useState<UserPublicLoop[]>([]);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!username?.trim()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void (async () => {
      const p = await fetchPublicProfile(username);
      if (cancelled) return;
      setProfile(p);
      if (p) {
        const tracks = await fetchUserPublicLoops(p.id, 24);
        if (!cancelled) setLoops(tracks);
      } else {
        setLoops([]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  const socialEntries = useMemo(() => {
    if (!profile) return [];
    const labels: Record<string, string> = {
      ig: "Instagram",
      tt: "TikTok",
      yt: "YouTube",
      x: "X",
      web: isFr ? "Site web" : "Website",
    };
    return (Object.entries(profile.social) as [keyof typeof profile.social, string][])
      .filter(([, v]) => typeof v === "string" && v.trim())
      .map(([key, value]) => ({
        key,
        label: labels[key] ?? key,
        href: socialUrl(key, value),
      }));
  }, [isFr, profile]);

  const onFollow = () => {
    if (!profile) return;
    if (!user) {
      navigate("/auth", { state: { from: `/u/${profile.username}` } });
      return;
    }
    if (followBusy) return;
    setFollowBusy(true);
    void (async () => {
      const result = await toggleProfileFollow(profile.id);
      if (!result.ok) {
        toast.error(creatorProfileErrorMessage("error" in result ? result.error : "follow_failed", isFr));
        setFollowBusy(false);
        return;
      }
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              is_following: result.following,
              followers_count: result.followers_count,
            }
          : prev,
      );
      toast.success(
        result.following
          ? isFr
            ? "Abonnement activé"
            : "Following"
          : isFr
            ? "Abonnement retiré"
            : "Unfollowed",
      );
      setFollowBusy(false);
    })();
  };

  if (!username?.trim()) return <Navigate to="/community" replace />;

  return (
    <MarketingPageShell className="text-pk-text">
      <Navbar variant="marketing" />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="text-sm text-pk-muted">
          <Link className="font-semibold text-pk-accent hover:underline" to="/community">
            {isFr ? "Communauté" : "Community"}
          </Link>
          <span className="px-2">/</span>
          <span>@{username}</span>
        </div>

        {loading ? (
          <div className="mt-16 flex justify-center">
            <PkIconLoader icon="community" size="md" label={isFr ? "Chargement du profil…" : "Loading profile…"} />
          </div>
        ) : !profile ? (
          <div className="mt-12 rounded-2xl border border-pk-border bg-pk-panel/70 p-8 text-center">
            <div className="text-lg font-semibold">{isFr ? "Profil introuvable" : "Profile not found"}</div>
            <p className="mt-2 text-sm text-pk-muted">
              {isFr
                ? "Ce username n’existe pas ou n’a pas encore été configuré."
                : "This username does not exist or has not been set up yet."}
            </p>
            <div className="mt-5">
              <Link to="/community">
                <Button variant="primary">{isFr ? "Explorer la communauté" : "Explore community"}</Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <section className="mt-8 rounded-3xl border border-pk-border bg-pk-panel/70 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <ProfileAvatar avatarId={profile.avatar_id} username={profile.username} size="lg" />
                  <div className="min-w-0">
                    <h1 className="truncate text-2xl font-bold">@{profile.username}</h1>
                    {profile.creator_type ? (
                      <div className="mt-2 inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
                        {creatorTypeLabel(profile.creator_type, isFr)}
                      </div>
                    ) : null}
                    {profile.bio ? <p className="mt-3 max-w-xl text-sm leading-relaxed text-pk-muted">{profile.bio}</p> : null}
                    <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-pk-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {profile.followers_count} {isFr ? "abonnés" : "followers"}
                      </span>
                      <span>
                        {profile.public_loops_count} {isFr ? "tracks publiques" : "public tracks"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {user?.id !== profile.id ? (
                    <Button variant={profile.is_following ? "secondary" : "primary"} disabled={followBusy} onClick={onFollow}>
                      {followBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : profile.is_following ? (
                        isFr ? "Abonné" : "Following"
                      ) : (
                        isFr ? "S’abonner" : "Follow"
                      )}
                    </Button>
                  ) : (
                    <Link to="/settings">
                      <Button variant="secondary">{isFr ? "Modifier mon profil" : "Edit profile"}</Button>
                    </Link>
                  )}
                </div>
              </div>

              {socialEntries.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {socialEntries.map((entry) => (
                    <a
                      key={entry.key}
                      href={entry.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-pk-border bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/80 hover:border-pk-accent/40"
                    >
                      {entry.label}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{isFr ? "Tracks publiques" : "Public tracks"}</h2>
                <span className="text-xs text-pk-muted">{loops.length}</span>
              </div>

              {loops.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-pk-border p-8 text-center text-sm text-pk-muted">
                  {isFr ? "Aucune track publique pour l’instant." : "No public tracks yet."}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {loops.map((track) => {
                    const loop = toLoop(track);
                    const url = resolveLoopDisplayCoverUrl(loop);
                    return (
                      <Link
                        key={track.id}
                        to={`/loop/${track.id}`}
                        className="group overflow-hidden rounded-2xl border border-pk-border bg-pk-panel/50 transition hover:border-pk-accent/40"
                      >
                        <div className={cn("relative h-32 overflow-hidden", COVER_SURFACE_CLASS)}>
                          <img
                            src={url}
                            alt=""
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                            onLoad={(e) => {
                              e.currentTarget.style.opacity = "1";
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3">
                            <div className="truncate text-sm font-semibold text-white">{track.name}</div>
                            <div className="mt-1 text-[11px] text-white/70">
                              {[track.genre, track.mood, track.bpm ? `${track.bpm} BPM` : null]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </MarketingPageShell>
  );
}
