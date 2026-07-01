import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "producer-tags";

function producerTagMax(plan: string): number {
  if (plan === "plus") return 10;
  if (plan === "studio") return 5;
  if (plan === "pro") return 2;
  return 0;
}

function canUseProducerTag(plan: string): boolean {
  return producerTagMax(plan) > 0;
}

async function callMixApi(form: FormData, mode: string): Promise<Response> {
  const mixUrl = (Deno.env.get("PRODUCER_TAG_MIX_URL") ?? Deno.env.get("VERCEL_URL") ?? "").trim();
  const secret = (Deno.env.get("PRODUCER_TAG_MIX_SECRET") ?? "").trim();
  if (!mixUrl || !secret) throw new Error("mix_not_configured");

  const base = mixUrl.startsWith("http") ? mixUrl : `https://${mixUrl}`;
  const url = `${base.replace(/\/$/, "")}/api/producer-tag-mix`;
  form.append("mode", mode);
  return fetch(url, {
    method: "POST",
    headers: { "x-producer-tag-secret": secret },
    body: form,
  });
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user?.id) return json({ error: "unauthorized" }, 401);

    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      name?: string;
      storagePath?: string;
      durationSec?: number | null;
      settingsJson?: Record<string, unknown>;
      id?: string;
    };
    const action = String(body.action ?? "list");

    const { data: planRow } = await userClient.from("profiles").select("plan").eq("id", user.id).maybeSingle();
    const plan = typeof planRow?.plan === "string" ? planRow.plan : "free";

    if (action === "list") {
      const { data, error } = await userClient
        .from("producer_tags")
        .select("id, name, storage_path, duration_sec, settings_json, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ tags: data ?? [], plan, maxTags: producerTagMax(plan) });
    }

    if (action === "delete") {
      if (!canUseProducerTag(plan)) return json({ error: "plan_required" }, 402);
      const id = String(body.id ?? "").trim();
      if (!id) return json({ error: "missing_id" }, 400);
      const admin = createClient(supabaseUrl, serviceKey);
      const { data: row } = await userClient
        .from("producer_tags")
        .select("storage_path, settings_json")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!row?.storage_path) return json({ error: "not_found" }, 404);

      const settings = row.settings_json && typeof row.settings_json === "object" ? row.settings_json as Record<string, unknown> : {};
      const variants = Array.isArray(settings.variants) ? settings.variants : [];
      const paths = [row.storage_path, ...variants.map((v) => (v && typeof v === "object" && typeof (v as Record<string, unknown>).storagePath === "string" ? (v as Record<string, unknown>).storagePath as string : "")).filter(Boolean)];

      await userClient.from("producer_tags").delete().eq("id", id).eq("user_id", user.id);
      void admin.storage.from(BUCKET).remove(paths);
      return json({ ok: true });
    }

    if (action === "save") {
      if (!canUseProducerTag(plan)) return json({ error: "plan_required", plan }, 402);

      const storagePath = String(body.storagePath ?? "").trim();
      const name = String(body.name ?? "Mon tag").trim().slice(0, 80) || "Mon tag";
      if (!storagePath.startsWith(`${user.id}/`)) return json({ error: "invalid_path" }, 400);

      const maxTags = producerTagMax(plan);
      const { count } = await userClient
        .from("producer_tags")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if ((count ?? 0) >= maxTags) {
        return json({ error: "tag_limit_reached", limit: maxTags, plan }, 402);
      }

      const admin = createClient(supabaseUrl, serviceKey);
      const { data: fileData, error: dlErr } = await admin.storage.from(BUCKET).download(storagePath);
      if (dlErr || !fileData) return json({ error: "file_not_found" }, 404);
      if (fileData.size < 400) return json({ error: "audio_too_short" }, 400);
      if (fileData.size > 5_242_880) return json({ error: "file_too_large" }, 400);

      const durationSec =
        typeof body.durationSec === "number" && Number.isFinite(body.durationSec) ? body.durationSec : null;

      let settingsJson: Record<string, unknown> =
        body.settingsJson && typeof body.settingsJson === "object" ? { ...body.settingsJson } : {
          volumeDb: -3,
          fxPreset: "clean",
          defaultPlacement: "intro",
          fadeMs: 50,
        };

      const tagBytes = new Uint8Array(await fileData.arrayBuffer());
      const variants: Array<{ id: string; label: string; fxPreset: string; storagePath: string }> = [];

      if (plan === "studio" || plan === "plus") {
        try {
          const form = new FormData();
          form.append("tag", new Blob([tagBytes], { type: "audio/mpeg" }), "tag.bin");
          const mixRes = await callMixApi(form, "variants");
          if (mixRes.ok) {
            const payload = (await mixRes.json()) as {
              variants?: Array<{ id: string; label: string; fxPreset: string; base64: string }>;
            };
            for (const v of payload.variants ?? []) {
              if (!v.base64) continue;
              const bin = Uint8Array.from(atob(v.base64), (c) => c.charCodeAt(0));
              const varPath = `${user.id}/variants/${Date.now()}-${v.id}.mp3`;
              await admin.storage.from(BUCKET).upload(varPath, bin, {
                contentType: "audio/mpeg",
                upsert: true,
              });
              variants.push({ id: v.id, label: v.label, fxPreset: v.fxPreset, storagePath: varPath });
            }
          }
        } catch (e) {
          console.warn("producer-tag variants skipped", e);
        }
      }

      if (variants.length) settingsJson = { ...settingsJson, variants };

      const { data: inserted, error: insErr } = await userClient
        .from("producer_tags")
        .insert({
          user_id: user.id,
          name,
          storage_path: storagePath,
          duration_sec: durationSec,
          settings_json: settingsJson,
        })
        .select("id, name, storage_path, duration_sec, settings_json, created_at")
        .single();
      if (insErr) return json({ error: insErr.message }, 500);
      return json({ tag: inserted });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    console.error("producer-tag", e);
    return json({ error: "server_error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}