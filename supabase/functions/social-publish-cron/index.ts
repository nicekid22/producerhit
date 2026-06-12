import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  fetchLoop,
  publishLoopToPlatforms,
  serviceClient,
  verifySocialCronSecret,
} from "../_shared/socialPublish.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-social-cron-secret",
};

type QueueRow = { id: string; loop_id: string; attempts: number };

async function markQueue(
  db: NonNullable<ReturnType<typeof serviceClient>>,
  queueId: string,
  patch: { status: string; last_error?: string | null; attempts?: number },
) {
  await db.from("social_publish_queue").update(patch).eq("id", queueId);
}

async function processLoopId(db: NonNullable<ReturnType<typeof serviceClient>>, loopId: string, queueRow?: QueueRow) {
  if (queueRow) {
    await markQueue(db, queueRow.id, {
      status: "processing",
      attempts: queueRow.attempts + 1,
      last_error: null,
    });
  }

  const loop = await fetchLoop(db, loopId);
  if (!loop) {
    if (queueRow) {
      await markQueue(db, queueRow.id, { status: "failed", last_error: "loop_not_public_or_missing" });
    }
    return { ok: false, error: "loop_not_public_or_missing", loopId };
  }

  const result = await publishLoopToPlatforms(db, loop);
  const failedOnly = !result.ok;

  if (queueRow) {
    await markQueue(db, queueRow.id, {
      status: failedOnly ? "failed" : "done",
      last_error: failedOnly ? JSON.stringify(result.results).slice(0, 500) : null,
    });
  }

  return { ok: result.ok, loopId, results: result.results };
}

async function processQueue(db: NonNullable<ReturnType<typeof serviceClient>>, limit = 5) {
  const { data: rows, error } = await db
    .from("social_publish_queue")
    .select("id,loop_id,attempts")
    .in("status", ["pending", "failed"])
    .lt("attempts", 5)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  const out = [];
  for (const row of rows ?? []) {
    out.push(await processLoopId(db, row.loop_id, row as QueueRow));
  }
  return { processed: out.length, results: out };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!verifySocialCronSecret(req)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const db = serviceClient();
  if (!db) {
    return new Response(JSON.stringify({ error: "missing_service_role" }), { status: 500, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "process_queue";

    if (action === "process_loop") {
      const loopId = typeof body?.loop_id === "string" ? body.loop_id.trim() : "";
      if (!loopId) {
        return new Response(JSON.stringify({ error: "missing_loop_id" }), { status: 400, headers: corsHeaders });
      }
      const { data: queueRow } = await db
        .from("social_publish_queue")
        .select("id,loop_id,attempts")
        .eq("loop_id", loopId)
        .maybeSingle();
      const result = await processLoopId(db, loopId, queueRow as QueueRow | undefined);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "process_queue") {
      const limit = typeof body?.limit === "number" ? Math.min(20, Math.max(1, body.limit)) : 5;
      const result = await processQueue(db, limit);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown_action", actions: ["process_queue", "process_loop"] }), {
      status: 400,
      headers: corsHeaders,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders });
  }
});
