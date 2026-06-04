import { supabase } from "@/lib/supabaseClient";

export type CreatorType =
  | "beatmaker"
  | "producer"
  | "artist"
  | "singer"
  | "youtuber"
  | "content_creator"
  | "dj"
  | "other";

export type CreatorSocialLinks = {
  ig?: string;
  tt?: string;
  yt?: string;
  x?: string;
  web?: string;
};

export type PublicProfileCard = {
  id: string;
  username: string;
  avatar_id: number;
  creator_type: CreatorType | null;
};

export type PublicProfile = PublicProfileCard & {
  bio: string | null;
  social: CreatorSocialLinks;
  followers_count: number;
  following_count: number;
  public_loops_count: number;
  is_following: boolean;
};

export type UserPublicLoop = {
  id: string;
  name: string;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  created_at: string | null;
  seed?: number | null;
};

export type CreatorProfileDraft = {
  username: string;
  avatar_id: number;
  bio: string;
  creator_type: CreatorType | "";
  social: CreatorSocialLinks;
};

export const AVATAR_PRESETS = [
  { id: 1, glyph: "🎹", gradient: "from-violet-500 to-fuchsia-500" },
  { id: 2, glyph: "🎧", gradient: "from-cyan-400 to-blue-600" },
  { id: 3, glyph: "🎤", gradient: "from-rose-500 to-orange-500" },
  { id: 4, glyph: "🔥", gradient: "from-amber-400 to-red-600" },
  { id: 5, glyph: "✨", gradient: "from-indigo-400 to-violet-600" },
  { id: 6, glyph: "🎸", gradient: "from-emerald-400 to-teal-600" },
  { id: 7, glyph: "🥁", gradient: "from-pink-500 to-purple-700" },
  { id: 8, glyph: "🎬", gradient: "from-sky-400 to-indigo-500" },
  { id: 9, glyph: "💿", gradient: "from-lime-400 to-green-600" },
  { id: 10, glyph: "🌊", gradient: "from-blue-400 to-cyan-300" },
] as const;

export const CREATOR_TYPE_OPTIONS: { value: CreatorType; labelEn: string; labelFr: string }[] = [
  { value: "beatmaker", labelEn: "Beatmaker", labelFr: "Beatmaker" },
  { value: "producer", labelEn: "Producer", labelFr: "Producteur" },
  { value: "artist", labelEn: "Artist", labelFr: "Artiste" },
  { value: "singer", labelEn: "Singer", labelFr: "Chanteur·se" },
  { value: "youtuber", labelEn: "YouTuber", labelFr: "YouTuber" },
  { value: "content_creator", labelEn: "Content creator", labelFr: "Créateur de contenu" },
  { value: "dj", labelEn: "DJ", labelFr: "DJ" },
  { value: "other", labelEn: "Other", labelFr: "Autre" },
];

export function creatorTypeLabel(type: CreatorType | null | undefined, isFr: boolean): string {
  if (!type) return "";
  const hit = CREATOR_TYPE_OPTIONS.find((o) => o.value === type);
  if (!hit) return type;
  return isFr ? hit.labelFr : hit.labelEn;
}

export function avatarPreset(id: number) {
  return AVATAR_PRESETS.find((a) => a.id === id) ?? AVATAR_PRESETS[0];
}

export function profilePath(username: string): string {
  return `/u/${encodeURIComponent(username.trim())}`;
}

export function normalizeSocial(input: CreatorSocialLinks): CreatorSocialLinks {
  const out: CreatorSocialLinks = {};
  const ig = input.ig?.trim();
  const tt = input.tt?.trim();
  const yt = input.yt?.trim();
  const x = input.x?.trim();
  const web = input.web?.trim();
  if (ig) out.ig = ig.replace(/^@/, "").slice(0, 64);
  if (tt) out.tt = tt.replace(/^@/, "").slice(0, 64);
  if (yt) out.yt = yt.slice(0, 120);
  if (x) out.x = x.replace(/^@/, "").slice(0, 64);
  if (web && /^https?:\/\//i.test(web)) out.web = web.slice(0, 200);
  return out;
}

export function validateUsername(username: string, isFr: boolean, required = false): string | null {
  const value = username.trim();
  if (!value) {
    return required ? (isFr ? "Username requis" : "Username required") : null;
  }
  if (value.length < 3 || value.length > 24) {
    return isFr ? "3 à 24 caractères" : "3 to 24 characters";
  }
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    return isFr ? "Lettres, chiffres et _ uniquement" : "Letters, numbers and _ only";
  }
  return null;
}

export function creatorProfileErrorMessage(code: string, isFr: boolean): string {
  const lower = code.toLowerCase();
  if (
    lower.includes("username_taken") ||
    lower.includes("duplicate key") ||
    lower.includes("unique constraint") ||
    lower.includes("23505")
  ) {
    return isFr ? "Ce username est déjà pris" : "Username already taken";
  }
  if (lower.includes("profile_not_found")) {
    return isFr ? "Profil introuvable — reconnecte-toi." : "Profile not found — sign in again.";
  }
  switch (code) {
    case "username_taken":
      return isFr ? "Ce username est déjà pris" : "Username already taken";
    case "username_length":
      return isFr ? "Username : 3 à 24 caractères" : "Username: 3 to 24 characters";
    case "username_format":
      return isFr ? "Format invalide (a-z, 0-9, _)" : "Invalid format (a-z, 0-9, _)";
    case "not_authenticated":
      return isFr ? "Connecte-toi pour continuer" : "Sign in to continue";
    default:
      if (import.meta.env.DEV && code && code !== "save_failed") {
        return isFr ? `Impossible de sauvegarder : ${code}` : `Could not save: ${code}`;
      }
      return isFr ? "Impossible de sauvegarder" : "Could not save";
  }
}

function parseSocial(raw: unknown): CreatorSocialLinks {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const out: CreatorSocialLinks = {};
  if (typeof obj.ig === "string" && obj.ig.trim()) out.ig = obj.ig.trim();
  if (typeof obj.tt === "string" && obj.tt.trim()) out.tt = obj.tt.trim();
  if (typeof obj.yt === "string" && obj.yt.trim()) out.yt = obj.yt.trim();
  if (typeof obj.x === "string" && obj.x.trim()) out.x = obj.x.trim();
  if (typeof obj.web === "string" && obj.web.trim()) out.web = obj.web.trim();
  return out;
}

function parseProfileCard(row: Record<string, unknown>): PublicProfileCard | null {
  const id = typeof row.id === "string" ? row.id : "";
  const username = typeof row.username === "string" ? row.username.trim() : "";
  if (!id || !username) return null;
  const avatar_id = typeof row.avatar_id === "number" ? row.avatar_id : 1;
  const creator_type =
    typeof row.creator_type === "string" ? (row.creator_type as CreatorType) : null;
  return { id, username, avatar_id, creator_type };
}

export async function fetchPublicProfileCards(userIds: string[]): Promise<Map<string, PublicProfileCard>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const map = new Map<string, PublicProfileCard>();
  if (!unique.length) return map;

  const { data, error } = await supabase.rpc("get_public_profile_cards", { p_user_ids: unique });
  if (error || !Array.isArray(data)) return map;

  for (const row of data) {
    if (!row || typeof row !== "object") continue;
    const card = parseProfileCard(row as Record<string, unknown>);
    if (card) map.set(card.id, card);
  }
  return map;
}

export async function fetchPublicProfile(username: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase.rpc("get_public_profile", { p_username: username.trim() });
  if (error || !data || typeof data !== "object") return null;
  const payload = data as { ok?: boolean; profile?: Record<string, unknown> };
  if (!payload.ok || !payload.profile) return null;
  const card = parseProfileCard(payload.profile);
  if (!card) return null;
  return {
    ...card,
    bio: typeof payload.profile.bio === "string" ? payload.profile.bio : null,
    social: parseSocial(payload.profile.social),
    followers_count:
      typeof payload.profile.followers_count === "number" ? payload.profile.followers_count : 0,
    following_count:
      typeof payload.profile.following_count === "number" ? payload.profile.following_count : 0,
    public_loops_count:
      typeof payload.profile.public_loops_count === "number" ? payload.profile.public_loops_count : 0,
    is_following: payload.profile.is_following === true,
  };
}

export async function fetchUserPublicLoops(userId: string, limit = 24): Promise<UserPublicLoop[]> {
  const { data, error } = await supabase.rpc("list_user_public_loops", {
    p_user_id: userId,
    p_limit: limit,
  });
  if (error || !Array.isArray(data)) return [];
  return data
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const id = typeof r.id === "string" ? r.id : "";
      if (!id) return null;
      return {
        id,
        name: typeof r.name === "string" ? r.name : "Untitled",
        genre: typeof r.genre === "string" ? r.genre : null,
        mood: typeof r.mood === "string" ? r.mood : null,
        bpm: typeof r.bpm === "number" ? r.bpm : null,
        created_at: typeof r.created_at === "string" ? r.created_at : null,
        seed: typeof r.seed === "number" ? r.seed : null,
      } satisfies UserPublicLoop;
    })
    .filter(Boolean) as UserPublicLoop[];
}

const PROFILE_VALIDATION_ERRORS = new Set([
  "username_taken",
  "username_length",
  "username_format",
  "not_authenticated",
  "profile_not_found",
]);

async function saveCreatorProfileDirect(
  payload: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "not_authenticated" };

  const usernameValue = payload.username ?? null;
  const { data: updated, error: usernameError } = await supabase
    .from("profiles")
    .update({ username: usernameValue })
    .eq("id", user.id)
    .select("username")
    .maybeSingle();
  if (usernameError) {
    if (usernameError.code === "23505") return { ok: false, error: "username_taken" };
    return { ok: false, error: usernameError.message };
  }
  if (!updated && usernameValue) return { ok: false, error: "profile_not_found" };

  const extended: Record<string, unknown> = {};
  if (payload.avatar_id != null) extended.avatar_id = payload.avatar_id;
  if (payload.bio !== undefined) extended.bio = payload.bio;
  if (payload.creator_type !== undefined) extended.creator_type = payload.creator_type;
  if (payload.social !== undefined) extended.social = payload.social;

  if (Object.keys(extended).length === 0) return { ok: true };

  const { error: extendedError } = await supabase.from("profiles").update(extended).eq("id", user.id);
  if (!extendedError) return { ok: true };
  if (/column/i.test(extendedError.message)) return { ok: true };
  if (extendedError.code === "23505") return { ok: false, error: "username_taken" };
  return { ok: false, error: extendedError.message };
}

export async function saveCreatorProfile(draft: CreatorProfileDraft): Promise<{ ok: true } | { ok: false; error: string }> {
  await supabase.rpc("repair_missing_profile").then(() => undefined, () => undefined);
  await supabase.rpc("ensure_profile").then(() => undefined, () => undefined);

  const payload = {
    username: draft.username.trim() || null,
    avatar_id: draft.avatar_id,
    bio: draft.bio.trim() || null,
    creator_type: draft.creator_type || null,
    social: normalizeSocial(draft.social),
  };

  const { data, error } = await supabase.rpc("update_creator_profile", { p_payload: payload });
  if (error) {
    if (PROFILE_VALIDATION_ERRORS.has(error.message)) {
      return { ok: false, error: error.message };
    }
    return saveCreatorProfileDirect(payload);
  }

  const result = data as { ok?: boolean; error?: string } | null;
  if (!result?.ok) {
    const code = result?.error ?? "save_failed";
    if (PROFILE_VALIDATION_ERRORS.has(code)) {
      return { ok: false, error: code };
    }
    return saveCreatorProfileDirect(payload);
  }
  return { ok: true };
}

export async function savePublicUsername(username: string): Promise<{ ok: true } | { ok: false; error: string }> {
  return saveCreatorProfile({
    username,
    avatar_id: 1,
    bio: "",
    creator_type: "",
    social: {},
  });
}

export async function toggleProfileFollow(
  followingId: string,
): Promise<{ ok: true; following: boolean; followers_count: number } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc("toggle_profile_follow", { p_following_id: followingId });
  if (error) return { ok: false, error: error.message };
  const payload = data as {
    ok?: boolean;
    following?: boolean;
    followers_count?: number;
    error?: string;
  } | null;
  if (!payload?.ok) return { ok: false, error: payload?.error ?? "follow_failed" };
  return {
    ok: true,
    following: payload.following === true,
    followers_count: typeof payload.followers_count === "number" ? payload.followers_count : 0,
  };
}

export function socialUrl(key: keyof CreatorSocialLinks, value: string): string {
  const v = value.trim();
  if (key === "web") return v;
  if (key === "ig") return `https://instagram.com/${v.replace(/^@/, "")}`;
  if (key === "tt") return `https://tiktok.com/@${v.replace(/^@/, "")}`;
  if (key === "yt") return v.startsWith("http") ? v : `https://youtube.com/@${v.replace(/^@/, "")}`;
  if (key === "x") return `https://x.com/${v.replace(/^@/, "")}`;
  return v;
}
