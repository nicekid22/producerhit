/**
 * Fetch public loops from Supabase REST (shared by reddit scripts).
 */
export const FALLBACK_LOOP = {
  id: "6c8948dc-1e97-48c0-8e27-81164b6af32d",
  name: "Terror Plugg",
  genre: "Terror Plugg",
  bpm: 73,
};

export async function fetchPublicLoops(limit = 10, env = process.env) {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("fetchPublicLoops: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants");
    return [];
  }
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/loops?select=id,name,genre,bpm&is_public=eq.true&audio_url=not.is.null&order=created_at.desc&limit=${limit}`;
  try {
    const res = await fetch(endpoint, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      console.warn(`fetchPublicLoops: HTTP ${res.status}`);
      return [];
    }
    return (await res.json()).filter((r) => typeof r.id === "string");
  } catch (e) {
    const hint =
      e?.cause?.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
        ? " (SSL local: relance avec node --use-system-ca ou verifie proxy/antivirus)"
        : "";
    console.warn(`fetchPublicLoops: ${e.message}${hint}`);
    return [];
  }
}
