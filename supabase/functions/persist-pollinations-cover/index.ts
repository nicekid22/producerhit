import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "loop-covers";
const MAX_IMAGE_BYTES = 2_200_000;

type AdminClient = ReturnType<typeof createClient>;

function parseStemsUrl(stemsUrl: unknown): Record<string, unknown> | null {
  if (!stemsUrl || typeof stemsUrl !== "object") return null;
  return stemsUrl as Record<string, unknown>;
}

function safePrompt(input: unknown): string {
  const p = typeof input === "string" ? input.trim() : "";
  return p.replace(/\s+/g, " ").slice(0, 240);
}

function normalizeSeed(seed: unknown): number {
  const n = typeof seed === "number" ? seed : Number(seed);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function promptStorageVariant(prompt: string, seed: number): string {
  let h = 2166136261;
  for (let i = 0; i < prompt.length; i++) {
    h ^= prompt.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const digest = (h >>> 0).toString(36);
  return `${seed}-${digest}`.slice(0, 40);
}

function mergeCoverIntoStems(stemsUrl: unknown, coverUrl: string, coverPrompt: string): Record<string, unknown> | null {
  const parsed = parseStemsUrl(stemsUrl);
  const next: Record<string, unknown> = parsed && typeof parsed === "object" ? { ...(parsed as Record<string, unknown>) } : {};
  const aceRaw = next.ace;
  const ace: Record<string, unknown> = aceRaw && typeof aceRaw === "object" ? { ...(aceRaw as Record<string, unknown>) } : {};

  ace.coverUrl = coverUrl.trim();
  ace.coverKind = "image";
  ace.coverSource = "pollinations";
  ace.coverPrompt = coverPrompt.trim().slice(0, 240);
  ace.coverRevision =
    typeof ace.coverRevision === "number" && Number.isFinite(ace.coverRevision) ? (ace.coverRevision as number) + 1 : 1;

  next.ace = ace;
  return next;
}

async function downloadPollinationsJpeg(
  prompt: string,
  seed: number,
  width = 1400,
  height = 1400,
): Promise<Uint8Array | null> {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${encodeURIComponent(
    String(seed),
  )}&nologo=true&model=flux&enhance=true`;

  const res = await fetch(url, {
    headers: { Accept: "image/*" },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) return null;
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (!bytes.byteLength || bytes.byteLength > MAX_IMAGE_BYTES) return null;
  return bytes;
}

async function uploadCoverAndUpdateLoop(
  admin: AdminClient,
  userId: string,
  loopId: string,
  stemsUrl: unknown,
  coverPrompt: string,
  bytes: Uint8Array,
  fileVariant?: string,
): Promise<{ coverUrl: string } | { error: string; status: number }> {
  const variant =
    typeof fileVariant === "string" && fileVariant.trim()
      ? fileVariant.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48)
      : "";
  const storagePath = variant ? `${userId}/covers/${loopId}-${variant}.jpg` : `${userId}/covers/${loopId}.jpg`;

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, bytes, {
    contentType: "image/jpeg",
    upsert: true,
    cacheControl: "300",
  });
  if (uploadError) return { error: "storage_upload_failed", status: 500 };

  const { data: publicUrl } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
  const coverUrl = publicUrl?.publicUrl?.trim();
  if (!coverUrl) return { error: "public_url_failed", status: 500 };

  const nextStems = mergeCoverIntoStems(stemsUrl, coverUrl, coverPrompt);
  if (!nextStems) return { error: "stems_merge_failed", status: 500 };

  const { error: updateErr } = await admin
    .from("loops")
    .update({ stems_url: nextStems, cover_url: coverUrl })
    .eq("id", loopId)
    .eq("user_id", userId);

  if (updateErr) return { error: updateErr.message, status: 500 };
  return { coverUrl };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authed = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const {
      data: { user },
      error: authError,
    } = await authed.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as {
      loopId?: unknown;
      prompt?: unknown;
      seed?: unknown;
      idempotencyKey?: unknown;
      purpose?: unknown;
    };

    const loopId = typeof body.loopId === "string" ? body.loopId.trim() : "";
    const prompt = safePrompt(body.prompt);
    const seed = normalizeSeed(body.seed);
    const idempotencyRaw = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
    const purpose = body.purpose === "card" ? "card" : "distribution";

    if (!loopId || !prompt) {
      return new Response(JSON.stringify({ error: "loopId and prompt required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: loopRow, error: loopErr } = await admin
      .from("loops")
      .select("id, stems_url, cover_url")
      .eq("id", loopId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (loopErr || !loopRow) {
      return new Response(JSON.stringify({ error: "loop_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const existingCover = typeof loopRow.cover_url === "string" ? loopRow.cover_url.trim() : "";
    if (purpose === "card" && existingCover.includes("/loop-covers/")) {
      return new Response(
        JSON.stringify({ coverUrl: existingCover, coverKind: "image", source: "pollinations", skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (purpose === "distribution") {
      if (idempotencyRaw.length < 8 || idempotencyRaw.length > 120) {
        return new Response(JSON.stringify({ error: "idempotency_key_required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const usageKey = `cover-ai:${user.id}:${idempotencyRaw}`;
      const { data: checkRows, error: checkErr } = await authed.rpc("check_loops_usage_idempotent", {
        p_key: usageKey,
      });
      if (checkErr) throw new Error(checkErr.message);
      const check = Array.isArray(checkRows) ? checkRows[0] : checkRows;
      if (!check?.ok) {
        return new Response(JSON.stringify({ error: "no_credits", used: check?.used, limit: check?.limit }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const cardSize = purpose === "card" ? 768 : 1400;
    const bytes = await downloadPollinationsJpeg(prompt, seed, cardSize, cardSize);
    if (!bytes) {
      return new Response(JSON.stringify({ error: "pollinations_failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const variant = promptStorageVariant(prompt, seed);
    const saved = await uploadCoverAndUpdateLoop(admin, user.id, loopId, loopRow.stems_url, prompt, bytes, variant);
    if ("error" in saved) {
      return new Response(JSON.stringify({ error: saved.error }), {
        status: saved.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: bumpErr } =
      purpose === "distribution"
        ? await authed.rpc("bump_loops_usage_idempotent", { p_key: `cover-ai:${user.id}:${idempotencyRaw}` })
        : { error: null };
    if (bumpErr) console.warn("persist-pollinations-cover: bump failed", bumpErr.message);

    return new Response(JSON.stringify({ coverUrl: saved.coverUrl, coverKind: "image", source: "pollinations" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("persist-pollinations-cover:", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

