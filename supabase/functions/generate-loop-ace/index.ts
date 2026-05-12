import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-region",
};

const LIMITS = { free: 3, pro: 75, studio: 250 } as const;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function asNumber(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function clampNumber(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function computeRequestedDurationSec(input: {
  instrumental: boolean;
  durationRaw: number | null;
  bpm: number | null;
  bars: number | null;
}) {
  const bpm = input.bpm && input.bpm > 0 ? input.bpm : 0;
  const bars = input.bars && input.bars > 0 ? input.bars : 0;
  if (!input.instrumental) {
    const base = input.durationRaw ?? 90;
    return clampNumber(base, 10, 120);
  }
  if (input.durationRaw != null) return clampNumber(input.durationRaw, 10, 60);
  if (bpm > 0 && bars > 0) {
    const barBased = Math.round((bars * 4 * 60) / bpm);
    return clampNumber(barBased, 10, 45);
  }
  return 40;
}

function toAbsoluteUrl(baseUrl: string, maybePath: string) {
  const t = maybePath.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("/")) return `${baseUrl}${t}`;
  return `${baseUrl}/${t}`;
}

async function readTextSafe(res: Response) {
  return await res.text().catch(() => "");
}

function redactAiToken(body: Record<string, unknown>) {
  if (!("ai_token" in body)) return body;
  return { ...body, ai_token: "[redacted]" };
}

function normalizeAceBaseUrl(baseUrlRaw: string) {
  const trimmed = baseUrlRaw.trim().replace(/\/$/, "");
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    if (host === "acemusic.ai") return "https://api.acemusic.ai";
    if (host === "acem-api.acemusic.ai") return "https://api.acemusic.ai";
    if (path.includes("/api/acem")) return "https://api.acemusic.ai";
  } catch {
    // ignore
  }
  return trimmed;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    let authedSupabase: ReturnType<typeof createClient> | null = null;
    let authedUserId: string | null = null;
    let authedPlan: "free" | "pro" | "studio" = "free";

    const body = (await req.json().catch(() => ({}))) as {
      action?: unknown;
      caption?: unknown;
      sampleQuery?: unknown;
      sample_query?: unknown;
      description?: unknown;
      desc?: unknown;
      bpm?: unknown;
      keyScale?: unknown;
      duration?: unknown;
      loopLengthBars?: unknown;
      seed?: unknown;
      lyrics?: unknown;
      instrumental?: unknown;
      vocalLanguage?: unknown;
      timeSignature?: unknown;
      useFormat?: unknown;
      thinking?: unknown;
      sampleMode?: unknown;
      audioFormat?: unknown;
      audio_format?: unknown;
    };

    const action = String(body?.action ?? "generate");

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
        } else if (user && action !== "format") {
          authedUserId = user.id;
          if (action !== "bump_usage") {
            // Check limits only for generation, not for bump_usage or formatting
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
    }

    if (action !== "format" && !authedSupabase) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (action !== "format" && !authedUserId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "bump_usage") {
      const { error: bumpErr } = await authedSupabase.rpc("bump_loops_usage");
      if (bumpErr) throw new Error(`bump_loops_usage failed: ${bumpErr.message}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const caption = asString(body?.caption);
    const sampleQuery =
      asString(body?.sampleQuery) || asString(body?.sample_query) || asString(body?.description) || asString(body?.desc);
    const lyrics = asString(body?.lyrics);
    const bpm = asNumber(body?.bpm);
    const keyScale = asString(body?.keyScale);
    const duration = asNumber(body?.duration);
    const loopLengthBars = asNumber(body?.loopLengthBars);
    const timeSignature = asString(body?.timeSignature);
    const useFormat = Boolean(body?.useFormat);
    const thinking = typeof body?.thinking === "boolean" ? Boolean(body.thinking) : null;
    const sampleMode = action === "format" ? false : (typeof body?.sampleMode === "boolean" ? Boolean(body.sampleMode) : false);
    const instrumental = body?.instrumental !== false;
    const seed = asNumber(body?.seed);
    const audioFormatRaw = (asString(body?.audioFormat) || asString(body?.audio_format)).trim().toLowerCase();
    const requestedAudioFormat =
      audioFormatRaw === "wav" || audioFormatRaw === "wav32" || audioFormatRaw === "flac" || audioFormatRaw === "mp3" || audioFormatRaw === "aac" || audioFormatRaw === "opus"
        ? audioFormatRaw
        : "mp3";
    const audioFormat = authedPlan === "free" ? "mp3" : requestedAudioFormat;

    console.log("ACE-Step request:", {
      requestId,
      action,
      caption: caption.slice(0, 80),
      sampleQuery: sampleQuery.slice(0, 80),
      bpm,
      keyScale,
      instrumental,
      sampleMode,
      useFormat,
      thinking,
      audioFormat,
      seed,
    });

    if (!caption && !(sampleMode && sampleQuery)) throw new Error("Missing caption (or sampleQuery for sample_mode)");

    const aceApiKey = Deno.env.get("ACE_STEP_API_KEY") ?? "";
    if (!aceApiKey) throw new Error("ACE_STEP_API_KEY not set");

    const baseUrlRaw = Deno.env.get("ACE_STEP_BASE_URL") ?? "https://api.acemusic.ai";
    const baseUrl = normalizeAceBaseUrl(baseUrlRaw);

    if (action === "format") {
      return new Response(
        JSON.stringify({
          caption: caption,
          lyrics: lyrics || "",
          bpm: bpm || null,
          keyScale: keyScale || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const effectiveLyrics = instrumental ? "" : (lyrics ? lyrics.trim() : "");
    const requestedDuration = computeRequestedDurationSec({
      instrumental,
      durationRaw: duration && duration > 0 ? duration : null,
      bpm,
      bars: loopLengthBars,
    });

    const controller = new AbortController();
    const requestTimeoutMs = 150_000;
    const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

    let audioUrl = "";
    let meta: Record<string, unknown> | null = null;

    try {
      const startedAt = Date.now();
      const keyValue = keyScale.trim().length > 0 ? keyScale.trim() : "";
      const paramObj: Record<string, unknown> = {
        duration: requestedDuration,
      };
      if (bpm && bpm > 0) paramObj.bpm = bpm;
      if (timeSignature.trim().length > 0) paramObj.time_signature = timeSignature.trim();
      if (keyValue) paramObj.key = keyValue;
      if (audioFormat) paramObj.audio_format = audioFormat;
      if (seed && seed > 0) paramObj.seed = seed;

      const createUrl = `${baseUrl}/release_task`;
      const releaseForm = new FormData();
      releaseForm.append("env", "production");
      releaseForm.append("ai_token", aceApiKey);
      releaseForm.append("prompt", caption);
      releaseForm.append("lyrics", effectiveLyrics);
      releaseForm.append("model_name", "acestep-v15-xl-turbo");
      releaseForm.append("app", "studio-web");
      releaseForm.append("param_obj", JSON.stringify(paramObj));
      console.log("ACE release_task request", {
        requestId,
        method: "POST",
        url: createUrl,
        headers: {
          Accept: "application/json",
        },
        body: redactAiToken({
          env: "production",
          ai_token: aceApiKey,
          prompt: caption,
          lyrics: effectiveLyrics,
          model_name: "acestep-v15-xl-turbo",
          app: "studio-web",
          param_obj: paramObj,
        }),
      });

      const createRes = await fetch(createUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: releaseForm,
        signal: controller.signal,
      });
      const createText = await readTextSafe(createRes);
      console.log("ACE release_task response", { requestId, status: createRes.status, ok: createRes.ok, body: createText });
      if (!createRes.ok) {
        if (createRes.status === 404) {
          throw new Error(
            "ACEMusic /release_task returned 404. The API host now exposes generation via /v1/chat/completions (direct browser call recommended to avoid Supabase egress).",
          );
        }
        throw new Error(`ACE API release_task failed (${createRes.status}): ${createText}`);
      }
      const createJson = JSON.parse(createText) as unknown;

      const taskId = asString(
        (createJson as { data?: unknown } | null)?.data && typeof (createJson as { data?: unknown }).data === "object"
          ? ((createJson as { data: { task_id?: unknown } }).data.task_id as unknown)
          : "",
      );
      if (!taskId) throw new Error("ACE API did not return a task_id");

      console.log("ACE task created", { requestId, taskId, plan: authedPlan, duration: requestedDuration });

      while (Date.now() - startedAt < requestTimeoutMs - 5_000) {
        const pollUrl = `${baseUrl}/query_result`;
        const pollParams = new URLSearchParams();
        pollParams.append("ai_token", aceApiKey);
        pollParams.append("task_id_list", JSON.stringify([taskId]));
        pollParams.append("app", "studio-web");
        console.log("ACE query_result request", {
          requestId,
          method: "POST",
          url: pollUrl,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: redactAiToken({ ai_token: aceApiKey, task_id_list: [taskId], app: "studio-web" }),
        });

        const pollRes = await fetch(pollUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: pollParams,
          signal: controller.signal,
        });
        const pollText = await readTextSafe(pollRes);
        console.log("ACE query_result response", { requestId, status: pollRes.status, ok: pollRes.ok, body: pollText });
        if (!pollRes.ok) {
          throw new Error(`ACE API query_result failed (${pollRes.status}): ${pollText}`);
        }
        const pollJson = JSON.parse(pollText) as unknown;
        const item = Array.isArray((pollJson as { data?: unknown } | null)?.data) ? (pollJson as { data: unknown[] }).data[0] : null;
        const statusNum = item && typeof (item as { status?: unknown }).status === "number" ? ((item as { status: number }).status as number) : 0;
        if (statusNum === 1) {
          const resultStr = asString((item as { result?: unknown } | null)?.result);
          if (!resultStr) throw new Error("ACE task succeeded but result is empty");
          const results = JSON.parse(resultStr) as unknown;
          const first = Array.isArray(results) ? results[0] : null;
          const firstObj = first && typeof first === "object" && first !== null ? (first as Record<string, unknown>) : null;
          const file = first && typeof (first as { file?: unknown }).file === "string" ? ((first as { file: string }).file as string) : "";
          audioUrl = toAbsoluteUrl(baseUrl, file);
          if (!audioUrl) throw new Error("ACE task returned no audio file");
          const metasObj =
            firstObj && typeof firstObj.metas === "object" && firstObj.metas !== null ? (firstObj.metas as Record<string, unknown>) : null;
          const usedSeed =
            metasObj && typeof metasObj.seed === "number"
              ? (metasObj.seed as number)
              : metasObj && typeof metasObj.random_seed === "number"
                ? (metasObj.random_seed as number)
                : null;
          const durationFromMetas = metasObj && typeof metasObj.duration === "number" ? (metasObj.duration as number) : null;
          const bpmFromMetas = metasObj && typeof metasObj.bpm === "number" ? (metasObj.bpm as number) : null;
          const keyScaleFromMetas =
            metasObj && typeof metasObj.keyscale === "string"
              ? (metasObj.keyscale as string)
              : metasObj && typeof metasObj.key_scale === "string"
                ? (metasObj.key_scale as string)
                : null;
          const timeSignatureFromMetas =
            metasObj && typeof metasObj.timesignature === "string"
              ? (metasObj.timesignature as string)
              : metasObj && typeof metasObj.time_signature === "string"
                ? (metasObj.time_signature as string)
                : null;
          meta = {
            taskId,
            prompt: caption,
            lyrics: effectiveLyrics,
            bpm: bpmFromMetas ?? bpm ?? null,
            duration: durationFromMetas ?? requestedDuration ?? null,
            keyScale: keyScaleFromMetas ?? (keyValue || null),
            timeSignature: timeSignatureFromMetas ?? (timeSignature.trim().length > 0 ? timeSignature.trim() : null),
            audioFormat,
            seed: usedSeed,
          };
          console.log("ACE task succeeded", { requestId, taskId, elapsedMs: Date.now() - startedAt });
          break;
        }
        if (statusNum === 2) throw new Error("ACE task failed");

        await sleep(2000);
      }

      if (!audioUrl) throw new Error("ACE generation timed out");
    } finally {
      clearTimeout(timer);
    }

    if (authedSupabase && authedUserId && action !== "format") {
      const { error: bumpErr } = await authedSupabase.rpc("bump_loops_usage");
      if (bumpErr) console.error("bump_loops_usage error:", bumpErr.message);
    }

    return new Response(JSON.stringify({ audioUrl, meta }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("ACE-Step Edge Function error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
