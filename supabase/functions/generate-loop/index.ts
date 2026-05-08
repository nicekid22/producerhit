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

const LIMITS = { free: 3, pro: 75, studio: 250 } as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    let authedSupabase: ReturnType<typeof createClient> | null = null;
    let authedUserId: string | null = null;
    let authedPlan: "free" | "pro" | "studio" = "free";

    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const url = Deno.env.get("SUPABASE_URL") ?? "";
      const key = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      if (!url || !key) {
        console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
      } else {
        const supabase = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
        authedSupabase = supabase;
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser(token);

        if (authError) {
          console.error("Auth error:", authError.message);
        } else if (user) {
          authedUserId = user.id;
          const { error: resetErr } = await supabase.rpc("reset_loops_usage_if_needed");
          if (resetErr) console.error("reset_loops_usage_if_needed error:", resetErr.message);
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("plan, loops_used_this_month")
            .eq("id", user.id)
            .single();

          if (profileError) {
            console.error("Profile error:", profileError.message);
          } else {
            const plan = (typeof profile?.plan === "string" ? profile.plan : "free") as string;
            authedPlan = plan === "studio" ? "studio" : plan === "pro" ? "pro" : "free";
            const used = typeof profile?.loops_used_this_month === "number" ? profile.loops_used_this_month : 0;
            const limit = LIMITS[plan as keyof typeof LIMITS] ?? LIMITS.free;

            if (used >= limit) {
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

    if (!authedSupabase || !authedUserId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as {
      prompt?: unknown;
      tags?: unknown;
      instrumental?: unknown;
    };

    const prompt = String(body?.prompt ?? "").trim();
    const tags = Array.isArray(body?.tags) ? (body.tags as unknown[]).filter((t) => typeof t === "string") : [];
    const instrumental = typeof body?.instrumental === "boolean" ? body.instrumental : true;
    console.log("v3 request:", { requestId, prompt: prompt.slice(0, 80), tags });

    if (!prompt) throw new Error("Missing prompt");

    const maxPerMinute = authedPlan === "free" ? 3 : authedPlan === "pro" ? 10 : 20;
    const minIntervalSeconds = authedPlan === "free" ? 8 : 4;
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
          const { error: bumpErr } = await authedSupabase.rpc("bump_loops_usage");
          if (bumpErr) console.error("bump_loops_usage error:", bumpErr.message);
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
          const { error: bumpErr } = await authedSupabase.rpc("bump_loops_usage");
          if (bumpErr) console.error("bump_loops_usage error:", bumpErr.message);
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
