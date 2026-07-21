import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  createArtist,
  createRelease,
  createTrack,
  distributeRelease,
  getLabelGridConfig,
  resolveGenreIdByName,
  uploadReleaseCover,
  uploadTrackFile,
  validateRelease,
} from "../_shared/labelgridClient.ts";
import {
  audioFileType,
  logDistributionEvent,
  prepareLoopAssets,
  readStorageAsset,
  seedOutletRows,
  serviceClient,
} from "../_shared/distributionAssets.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SubmitBody = {
  loopId?: string;
  title?: string;
  artistName?: string;
  featuring?: string[];
  genreLabelgridId?: string;
  genreName?: string;
  languageCode?: string;
  explicit?: boolean;
  releaseDate?: string;
  acceptTerms?: boolean;
};

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function hasLegalName(profile: { legal_first_name?: string | null; legal_last_name?: string | null }): boolean {
  const first = profile.legal_first_name?.trim() ?? "";
  const last = profile.legal_last_name?.trim() ?? "";
  return first.length >= 2 && last.length >= 2;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const firebaseApiKey = Deno.env.get("FIREBASE_API_KEY") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "").trim() : "";

    let userId: string | null = null;
    if (firebaseApiKey && token.startsWith("eyJ")) {
      try {
        const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts/lookup?key=${firebaseApiKey}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token }),
        });
        if (res.ok) {
          const j = (await res.json()) as { users?: Array<{ localId?: string }> };
          userId = j.users?.[0]?.localId ?? null;
        }
      } catch { /* fall through */ }
    }
    if (!userId && supabaseUrl && anonKey) {
      const sc = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: authData, error: authError } = await sc.auth.getUser();
      if (!authError && authData.user) userId = authData.user.id;
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: "not_authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as SubmitBody;
    const loopId = asString(body.loopId);
    const title = asString(body.title);
    const artistName = asString(body.artistName);
    if (!loopId || !title || !artistName) {
      return new Response(JSON.stringify({ error: "missing_fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = serviceClient();

    // Read profile from Firestore
    const { getFirebaseDb } = await import("../_shared/generationJobUtils.ts");
    // fbGetProfile already imported via generationJobUtils or we inline it here
    const { fbGetProfile } = await import("../_shared/firestoreServer.ts");
    const fbProfile = await fbGetProfile(userId!);
    const profile = {
      plan: fbProfile?.plan ?? "free",
      legal_first_name: fbProfile?.legal_first_name ?? null,
      legal_last_name: fbProfile?.legal_last_name ?? null,
      username: fbProfile?.username ?? null,
    };
    if (!profile) {
      return new Response(JSON.stringify({ error: "profile_not_found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const plan = profile.plan ?? "free";
    if (plan !== "studio" && plan !== "plus") {
      return new Response(JSON.stringify({ error: "plan_not_eligible", plan }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!hasLegalName(profile)) {
      return new Response(JSON.stringify({ error: "legal_name_required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.acceptTerms) {
      await admin.from("distribution_profiles").upsert({
        user_id: userId,
        terms_accepted_at: new Date().toISOString(),
        default_artist_name: artistName,
      }, { onConflict: "user_id" });
    } else {
      const { data: distProfile } = await admin
        .from("distribution_profiles")
        .select("terms_accepted_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (!distProfile?.terms_accepted_at) {
        return new Response(JSON.stringify({ error: "terms_not_accepted" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: loop, error: loopErr } = await admin
      .from("loops")
      .select("id, user_id, name, genre, audio_url, cover_url, stems_url")
      .eq("id", loopId)
      .eq("user_id", userId)
      .single();
    if (loopErr || !loop) {
      return new Response(JSON.stringify({ error: "loop_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: activeRelease } = await admin
      .from("distribution_releases")
      .select("id, status")
      .eq("loop_id", loopId)
      .in("status", ["preparing", "submitted", "in_review", "live"])
      .maybeSingle();
    if (activeRelease) {
      return new Response(JSON.stringify({ error: "release_already_active", releaseId: activeRelease.id }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const featuring = Array.isArray(body.featuring)
      ? body.featuring.map((f) => asString(f)).filter(Boolean)
      : [];
    const languageCode = asString(body.languageCode) || "en";
    const explicit = Boolean(body.explicit);
    const releaseDate = asString(body.releaseDate) || null;
    const genreName = asString(body.genreName) || loop.genre || "Electronic";

    const { data: releaseRow, error: insertErr } = await admin
      .from("distribution_releases")
      .insert({
        user_id: userId,
        loop_id: loopId,
        release_type: "single",
        title,
        artist_name: artistName,
        featuring,
        genre_name: genreName,
        genre_labelgrid_id: asString(body.genreLabelgridId) || null,
        language_code: languageCode,
        explicit,
        release_date: releaseDate,
        status: "preparing",
      })
      .select("id")
      .single();
    if (insertErr || !releaseRow) {
      return new Response(JSON.stringify({ error: insertErr?.message ?? "insert_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const releaseId = releaseRow.id as string;

    const { data: quotaResult, error: quotaErr } = await userClient.rpc(
      "check_and_consume_distribution_quota",
      { p_release_id: releaseId },
    );
    if (quotaErr) {
      await admin.from("distribution_releases").delete().eq("id", releaseId);
      return new Response(JSON.stringify({ error: quotaErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const quota = Array.isArray(quotaResult) ? quotaResult[0] : quotaResult;
    if (!quota?.ok) {
      await admin.from("distribution_releases").delete().eq("id", releaseId);
      return new Response(JSON.stringify({
        error: quota?.error_code ?? "quota_exceeded",
        used: quota?.used,
        quota: quota?.quota,
        plan: quota?.plan,
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const assets = await prepareLoopAssets(admin, loop, releaseId, userId);
      await admin.from("distribution_releases").update({
        audio_storage_path: assets.audioPath,
        cover_storage_path: assets.coverPath,
      }).eq("id", releaseId);

      const lg = getLabelGridConfig();

      let { data: distProfile } = await admin
        .from("distribution_profiles")
        .select("labelgrid_artist_id, default_artist_name")
        .eq("user_id", userId)
        .maybeSingle();

      let artistId = distProfile?.labelgrid_artist_id;
      if (!artistId) {
        const artist = await createArtist(artistName, lg);
        artistId = String(artist.id);
        await admin.from("distribution_profiles").upsert({
          user_id: userId,
          labelgrid_artist_id: artistId,
          default_artist_name: artistName,
        }, { onConflict: "user_id" });
      }

      const track = await createTrack({ title, artistId }, lg);
      const trackId = track.id;

      const audioBytes = await readStorageAsset(admin, assets.audioPath);
      const audioUrl = loop.audio_url ?? "";
      const { mime: audioMime } = audioFileType(assets.audioMime, audioUrl);
      await uploadTrackFile(trackId, "audio", audioBytes, audioMime, lg);

      let genreId = asString(body.genreLabelgridId);
      if (!genreId) {
        genreId = (await resolveGenreIdByName(genreName, lg)) ?? "";
      }

      const lgRelease = await createRelease({
        title,
        artistId,
        trackIds: [trackId],
        releaseDate: releaseDate ?? undefined,
        genreId: genreId || undefined,
        languageCode,
        explicit,
        releaseType: "single",
      }, lg);

      const lgReleaseId = lgRelease.id;
      const coverBytes = await readStorageAsset(admin, assets.coverPath);
      await uploadReleaseCover(lgReleaseId, coverBytes, assets.coverMime, lg);

      const validation = await validateRelease(lgReleaseId, lg);
      const validationOk = validation && typeof validation === "object" &&
        !("errors" in validation && Array.isArray((validation as { errors: unknown[] }).errors) &&
          (validation as { errors: unknown[] }).errors.length > 0);

      if (!validationOk) {
        await admin.from("distribution_releases").update({
          status: "failed",
          status_detail: validation as Record<string, unknown>,
          labelgrid_release_id: String(lgReleaseId),
          labelgrid_track_id: String(trackId),
        }).eq("id", releaseId);
        await logDistributionEvent(admin, releaseId, userId, "validation_failed", validation as Record<string, unknown>);
        return new Response(JSON.stringify({
          error: "validation_failed",
          releaseId,
          details: validation,
        }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const distro = await distributeRelease(lgReleaseId, undefined, lg);
      await seedOutletRows(admin, releaseId);

      const isrc = typeof track.isrc === "string" ? track.isrc : null;
      const upc = typeof lgRelease.upc === "string" ? lgRelease.upc : null;

      await admin.from("distribution_releases").update({
        status: "submitted",
        labelgrid_release_id: String(lgReleaseId),
        labelgrid_track_id: String(trackId),
        isrc,
        upc,
        submitted_at: new Date().toISOString(),
        status_detail: { validation, distro },
      }).eq("id", releaseId);

      await logDistributionEvent(admin, releaseId, userId, "submitted", {
        labelgrid_release_id: String(lgReleaseId),
        labelgrid_track_id: String(trackId),
      });

      return new Response(JSON.stringify({
        ok: true,
        releaseId,
        status: "submitted",
        labelgridReleaseId: String(lgReleaseId),
        isrc,
        upc,
        quota: { used: quota.used, limit: quota.quota },
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (pipelineErr) {
      const message = pipelineErr instanceof Error ? pipelineErr.message : "pipeline_failed";
      await admin.from("distribution_releases").update({
        status: "failed",
        status_detail: { error: message },
      }).eq("id", releaseId);
      await logDistributionEvent(admin, releaseId, userId, "pipeline_failed", { error: message });
      return new Response(JSON.stringify({ error: message, releaseId }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal_error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
