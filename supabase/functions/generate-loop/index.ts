import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-region",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const LIMITS = { free: 10, pro: 75, studio: 250, plus: 1000 } as const;

function normalizeAuthedPlan(plan: string): keyof typeof LIMITS {
  if (plan === "plus" || plan === "studio" || plan === "pro") return plan;
  return "free";
}

/**
 * Verify a Firebase ID token via Google Identity Toolkit REST API.
 * Falls back to null if not a Firebase token or verification fails.
 */
async function verifyFirebaseIdToken(token: string): Promise<{ uid: string; email?: string } | null> {
  const firebaseApiKey = Deno.env.get("FIREBASE_API_KEY");
  if (!firebaseApiKey) return null;
  if (!token.startsWith("eyJ")) return null;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      },
    );
    if (!res.ok) return null;
    const json = await res.json() as { users?: Array<{ localId: string; email?: string }> };
    const fbUser = json.users?.[0];
    if (!fbUser?.localId) return null;
    return { uid: fbUser.localId, email: fbUser.email };
  } catch {
    return null;
  }
}

/**
 * Read a profile from Supabase using the service role key directly via REST API.
 * Used when the user is authenticated via Firebase (Supabase can't decode Firebase JWTs).
 */
async function getProfileWithServiceKey(supabaseUrl: string, serviceRoleKey: string, userId: string) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=plan,loops_used_this_month,referral_bonus,level_bonus,daily_bonus_month,purchased_bonus&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
    },
  );
  if (!res.ok) return null;
  const rows = await res.json() as Array<Record<string, unknown>>;
  return rows[0] ?? null;
}

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function asNumber(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function checkLimit(plan: string, profile: Record<string, unknown> | null): {
  ok: boolean;
  plan: string;
  limit: number;
  used: number;
} {
  const p = typeof plan === "string" ? plan : "free";
  const normalized = normalizeAuthedPlan(p);
  const used = typeof profile?.loops_used_this_month === "number" ? profile.loops_used_this_month : 0;
  const baseLimit = LIMITS[normalized] ?? LIMITS.free;
  const referralBonus = typeof profile?.referral_bonus === "number" ? profile.referral_bonus : 0;
  const levelBonus = typeof profile?.level_bonus === "number" ? profile.level_bonus : 0;
  const dailyBonus = typeof profile?.daily_bonus_month === "number" ? profile.daily_bonus_month : 0;
  const purchasedBonus = typeof profile?.purchased_bonus === "number" ? profile.purchased_bonus : 0;
  const limit = baseLimit + Math.max(0, referralBonus) + Math.max(0, levelBonus) + Math.max(0, dailyBonus) + Math.max(0, purchasedBonus);
  return {
    ok: used < limit,
    plan: p,
    limit,
    used,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    let useIdempotentUsage = false;
    let authedSupabase: ReturnType<typeof createClient> | null = null;
    let authedUserId: string | null = null;
    let authedPlan: "free" | "pro" | "studio" | "plus" = "free";

    const body = (await req.json().catch(() => ({}))) as {
      prompt?: unknown;
      tags?: unknown;
      instrumental?: unknown;
      generationKey?: unknown;
      generation_key?: unknown;
    };
    const generationKey =
      typeof body?.generationKey === "string"
        ? body.generationKey.trim()
        : typeof body?.generation_key === "string"
          ? body.generation_key.trim()
          : "";

    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const url = Deno.env.get("SUPABASE_URL") ?? "";
      const key = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
      const firebaseApiKey = (Deno.env.get("FIREBASE_API_KEY") ?? "").trim();

      if (!url || !key) {
        console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
      } else {
        const supabase = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
        authedSupabase = supabase;

        // Try Supabase auth first
        let supabaseUserId: string | null = null;
        const { data: supabaseUser, error: sbError } = await supabase.auth.getUser(token);
        if (!sbError && supabaseUser?.user?.id) {
          supabaseUserId = supabaseUser.user.id;
        }

        // Fallback: verify Firebase ID token (for Firebase Auth users)
        let fbUid: string | null = null;
        if (!supabaseUserId && firebaseApiKey && token.startsWith("eyJ")) {
          const fbResult = await verifyFirebaseIdToken(token);
          if (fbResult) fbUid = fbResult.uid;
        }

        const effectiveUserId = supabaseUserId ?? fbUid;
        const isFirebaseUser = Boolean(fbUid);

        if (effectiveUserId) {
          authedUserId = effectiveUserId;

          // For Firebase users, use service key client to bypass RLS
          if (isFirebaseUser && serviceKey) {
            authedSupabase = createClient(url, serviceKey, { auth: { persistSession: false } });
          }

          // Profile + usage check
          if (generationKey) {
            // Try idempotent check first (Supabase users only — Firebase auth.uid() returns null)
            if (!isFirebaseUser) {
              const { error: resetErr } = await supabase.rpc("reset_loops_usage_if_needed");
              if (resetErr) console.error("reset_loops_usage_if_needed error:", resetErr.message);

              const { data: existing, error: existingErr } = await supabase
                .from("generation_usage_keys")
                .select("key")
                .eq("key", generationKey)
                .maybeSingle();
              if (existingErr) console.error("generation_usage_keys lookup error:", existingErr.message);
              const alreadyCounted = Boolean((existing as { key?: unknown } | null)?.key);

              // Check usage via RPC for Supabase users
              const { data: reserveData, error: reserveError } = await supabase.rpc("check_loops_usage_idempotent", {
                p_key: generationKey,
              });
              if (reserveError) {
                console.error("check_loops_usage_idempotent error:", reserveError.message);
              } else {
                type UsageReserveRow = { ok?: unknown; plan?: unknown; used?: unknown; limit?: unknown };
                const row: UsageReserveRow | null = Array.isArray(reserveData)
                  ? ((reserveData[0] as UsageReserveRow | undefined) ?? null)
                  : ((reserveData as UsageReserveRow | null) ?? null);
                const ok = Boolean(row?.ok);
                const plan = (typeof row?.plan === "string" ? row.plan : "free") as string;
                const used = typeof row?.used === "number" ? row.used : 0;
                const limit = typeof row?.limit === "number" ? row.limit : LIMITS.free;
                authedPlan = normalizeAuthedPlan(plan);
                if (!ok) {
                  return new Response(
                    JSON.stringify({
                      error: `Monthly limit reached (${limit} beats for ${plan} plan). Upgrade to generate more.`,
                      limitReached: true,
                      plan,
                      limit,
                    }),
                    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
                  );
                }
                useIdempotentUsage = true;
              }
            } else {
              // Firebase user: skip RPC (auth.uid() is null), read profile directly
              // Reset usage if needed via service key
              await authedSupabase.rpc("reset_loops_usage_if_needed").catch(() => {});

              const profile = await getProfileWithServiceKey(url, serviceKey, fbUid);
              const { ok, plan, limit } = checkLimit(profile?.plan ?? "free", profile);
              authedPlan = normalizeAuthedPlan(plan);

              // Check if already counted via generation_key
              const { data: existing, error: existingErr } = await authedSupabase
                .from("generation_usage_keys")
                .select("key")
                .eq("key", generationKey)
                .maybeSingle();
              if (existingErr) console.error("generation_usage_keys lookup error:", existingErr.message);
              const alreadyCounted = Boolean((existing as { key?: unknown } | null)?.key);

              if (!alreadyCounted && !ok) {
                return new Response(
                  JSON.stringify({
                    error: `Monthly limit reached (${limit} beats for ${plan} plan). Upgrade to generate more.`,
                    limitReached: true,
                    plan,
                    limit,
                  }),
                  { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
                );
              }
            }
          } else {
            // No generationKey — direct profile read
            if (!isFirebaseUser) {
              const { error: resetErr } = await supabase.rpc("reset_loops_usage_if_needed");
              if (resetErr) console.error("reset_loops_usage_if_needed error:", resetErr.message);
              const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("plan, loops_used_this_month, referral_bonus, level_bonus, daily_bonus_month, purchased_bonus")
                .eq("id", effectiveUserId)
                .single();

              if (profileError) {
                console.error("Profile error:", profileError.message);
              } else {
                const { ok, plan, limit } = checkLimit(profile?.plan ?? "free", profile);
                authedPlan = normalizeAuthedPlan(plan);
                if (!ok) {
                  return new Response(
                    JSON.stringify({
                      error: `Monthly limit reached (${limit} beats for ${plan} plan). Upgrade to generate more.`,
                      limitReached: true,
                      plan,
                      limit,
                    }),
                    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
                  );
                }
              }
            } else {
              // Firebase user: read profile via service key REST API
              const profile = await getProfileWithServiceKey(url, serviceKey, fbUid);
              const { ok, plan, limit } = checkLimit(profile?.plan ?? "free", profile);
              authedPlan = normalizeAuthedPlan(plan);
              if (!ok) {
                return new Response(
                  JSON.stringify({
                    error: `Monthly limit reached (${limit} beats for ${plan} plan). Upgrade to generate more.`,
                    limitReached: true,
                    plan,
                    limit,
                  }),
                  { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
                );
              }
            }
          }
        }
      }
    }

    if (!authedSupabase || !authedUserId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = String(body?.prompt ?? "").trim();
    const tags = Array.isArray(body?.tags) ? (body.tags as unknown[]).filter((t) => typeof t === "string") : [];
    const instrumental = typeof body?.instrumental === "boolean" ? body.instrumental : true;
    console.log("v3 request:", { requestId, prompt: prompt.slice(0, 80), tags });

    if (!prompt) throw new Error("Missing prompt");

    const maxPerMinute = authedPlan === "plus" ? 30 : authedPlan === "studio" ? 20 : authedPlan === "pro" ? 10 : 3;
    const minIntervalSeconds = authedPlan === "plus" ? 2 : authedPlan === "free" ? 8 : 4;
    const { data: rateRows, error: rateErr } = await authedSupabase.rpc("check_and_bump_generation_rate_limit", {
      p_window_seconds: 60,
      p_max_in_window: maxPerMinute,
      p_min_interval_seconds: minIntervalSeconds,
    });
    if (!rateErr) {
      const row = Array.isArray(rateRows) ? rateRows[0] : null;
      const ok = Boolean((row as { ok?: unknown } | null)?.ok);
      const retryAfter = typeof (row as { retry_after_seconds?: unknown } | null)?.retry_after_seconds === "number"
        ? ((row as { retry_after_seconds: number }).retry_after_seconds as number)
        : 0;
      if (!ok) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait and try again.", retryAfterSeconds: retryAfter }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(retryAfter || 5) },
        });
      }
    }

    if (generationKey && !useIdempotentUsage) {
      // For Firebase users who skipped the idempotent check (no generationKey path)
      // or for cases where generationKey exists but idempotent usage wasn't set,
      // also do the idempotent reserve now (this is a duplicate check for non-Firebase
      // users who already went through the RPC path — but idempotent is safe to call twice)
      const { data: reserveData, error: reserveError } = await authedSupabase.rpc("check_loops_usage_idempotent", {
        p_key: generationKey,
      });
      if (reserveError) {
        console.error("check_loops_usage_idempotent error:", reserveError.message);
      } else {
        type UsageReserveRow = { ok?: unknown; plan?: unknown; used?: unknown; limit?: unknown };
        const row: UsageReserveRow | null = Array.isArray(reserveData)
          ? ((reserveData[0] as UsageReserveRow | undefined) ?? null)
          : ((reserveData as UsageReserveRow | null) ?? null);
        const ok = Boolean(row?.ok);
        const plan = (typeof row?.plan === "string" ? row.plan : "free") as string;
        const used = typeof row?.used === "number" ? row.used : 0;
        const limit = typeof row?.limit === "number" ? row.limit : LIMITS.free;
        authedPlan = normalizeAuthedPlan(plan);
        if (!ok) {
          return new Response(
            JSON.stringify({
              error: `Monthly limit reached (${limit} beats for ${plan} plan). Upgrade to generate more.`,
              limitReached: true,
              plan,
              limit,
              used,
            }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        useIdempotentUsage = true;
      }
    }

    const apiKey = Deno.env.get("SONAUTO_API_KEY");
    if (!apiKey) throw new Error("SONAUTO_API_KEY not set");

    const createBody: Record<string, unknown> = {
      prompt,
      tags,
      instrumental,
      output_format: "mp3",
      output_bit_rate: 320,
      enable_streaming: true,
      stream_format: "mp3",
    };

    const controller = new AbortController();
    const requestTimeoutMs = 60_000;
    const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

    const createRes = await fetch("https://api.sonauto.ai/v1/generations/v3", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(createBody),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("Sonauto error:", createRes.status, errText);
      throw new Error(`Sonauto ${createRes.status}: ${errText}`);
    }

    const createJson = (await createRes.json().catch(() => null)) as { task_id?: unknown } | null;
    const taskId = typeof createJson?.task_id === "string" ? createJson.task_id : null;
    if (!taskId) throw new Error("No task_id returned");

    const pollStart = Date.now();
    const pollTimeoutMs = 60_000;
    while (Date.now() - pollStart < pollTimeoutMs) {
      await sleep(1000);
      const statusRes = await fetch(`https://api.sonauto.ai/v1/generations/status/${taskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!statusRes.ok) {
        const t = await statusRes.text();
        throw new Error(`Sonauto status failed (${statusRes.status}): ${t}`);
      }
      const statusJson = (await statusRes.json().catch(() => null)) as unknown;
      const status =
        typeof statusJson === "string"
          ? statusJson
          : typeof statusJson === "object" && statusJson && typeof (statusJson as { status?: unknown }).status === "string"
            ? ((statusJson as { status: string }).status as string)
            : "";

      if (status === "GENERATING_STREAMING_READY") {
        const audioUrl = `https://api-stream.sonauto.ai/stream/${taskId}`;
        if (authedSupabase && authedUserId) {
          if (useIdempotentUsage && generationKey) {
            const { error: bumpErr } = await authedSupabase.rpc("bump_loops_usage_idempotent", { p_key: generationKey });
            if (bumpErr) console.error("bump_loops_usage_idempotent error:", bumpErr.message);
          } else {
            const { error: bumpErr } = await authedSupabase.rpc("bump_loops_usage");
            if (bumpErr) console.error("bump_loops_usage error:", bumpErr.message);
          }
        }
        return new Response(JSON.stringify({ audioUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (status === "SUCCESS") {
        const doneRes = await fetch(`https://api.sonauto.ai/v1/generations/${taskId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const doneJson = (await doneRes.json().catch(() => null)) as { song_paths?: unknown } | null;
        const songPaths = doneJson?.song_paths;
        const audioUrl = Array.isArray(songPaths) && typeof songPaths[0] === "string" ? songPaths[0] : null;
        if (!audioUrl) throw new Error("No audio URL returned");
        if (authedSupabase && authedUserId) {
          if (useIdempotentUsage && generationKey) {
            const { error: bumpErr } = await authedSupabase.rpc("bump_loops_usage_idempotent", { p_key: generationKey });
            if (bumpErr) console.error("bump_loops_usage_idempotent error:", bumpErr.message);
          } else {
            const { error: bumpErr } = await authedSupabase.rpc("bump_loops_usage");
            if (bumpErr) console.error("bump_loops_usage error:", bumpErr.message);
          }
        }
        return new Response(JSON.stringify({ audioUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (status === "FAILURE") {
        const doneRes = await fetch(`https://api.sonauto.ai/v1/generations/${taskId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const doneJson = (await doneRes.json().catch(() => null)) as { error_message?: unknown } | null;
        const msg = typeof doneJson?.error_message === "string" ? doneJson.error_message : "Generation failed";
        throw new Error(msg);
      }
    }

    throw new Error("No streaming-ready audio received within timeout");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Edge Function error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});