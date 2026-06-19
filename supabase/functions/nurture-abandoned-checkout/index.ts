import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE = "https://www.producerhit.com";

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function planCheckoutUrl(plan: string): string {
  const p = plan === "studio" || plan === "plus" ? plan : "pro";
  return `${SITE}/pricing?plan=${p}&checkout=1`;
}

function emailHtml(locale: string, plan: string): { subject: string; html: string } {
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const url = planCheckoutUrl(plan);
  if (locale === "fr") {
    return {
      subject: `Ton checkout ProducerHit ${planLabel} t'attend (+ bonus lancement)`,
      html: `<p>Salut — tu as commencé le checkout <strong>${planLabel}</strong> hier sans finaliser.</p>
<p>Reprends en 1 clic (Stripe sécurisé) :</p>
<p><a href="${url}">${url}</a></p>
<p>Tarif lancement Pro à 8&nbsp;$ / mois · annuel −20&nbsp;% · annulable à tout moment.</p>
<p>— ProducerHit</p>`,
    };
  }
  return {
    subject: `Your ProducerHit ${planLabel} checkout is waiting (+ launch bonus)`,
    html: `<p>Hey — you started checkout for <strong>${planLabel}</strong> but didn't finish.</p>
<p>Resume in one click (secure Stripe):</p>
<p><a href="${url}">${url}</a></p>
<p>Launch pricing: Pro $8/mo · save 20% on annual · cancel anytime.</p>
<p>— ProducerHit</p>`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok");
  }

  const cronSecret = Deno.env.get("CRON_SECRET") ?? Deno.env.get("NURTURE_CRON_SECRET") ?? "";
  const provided = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!cronSecret || provided !== cronSecret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? "";
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "missing env" }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: leads, error } = await supabase
    .from("marketing_leads")
    .select("id, email, locale, props, subscribed_at")
    .eq("source", "checkout_abandon")
    .lte("subscribed_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .gte("subscribed_at", new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString())
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let sent = 0;
  let skipped = 0;

  for (const lead of leads ?? []) {
    const props = (lead.props ?? {}) as Record<string, unknown>;
    if (asString(props.nurture_sent) === "true") {
      skipped += 1;
      continue;
    }

    const plan = asString(props.abandoned_plan) || "pro";
    const locale = asString(lead.locale) || "en";
    const { subject, html } = emailHtml(locale, plan);

    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: Deno.env.get("RESEND_FROM") ?? "ProducerHit <hello@producerhit.com>",
          to: [lead.email],
          subject,
          html,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error("resend failed", lead.email, body);
        continue;
      }
    } else {
      console.log("[nurture-abandoned-checkout] dry-run", lead.email, subject);
    }

    await supabase
      .from("marketing_leads")
      .update({
        props: { ...props, nurture_sent: "true", nurture_sent_at: new Date().toISOString() },
      })
      .eq("id", lead.id);

    sent += 1;
  }

  return new Response(JSON.stringify({ ok: true, sent, skipped, resend: !!resendKey }), {
    headers: { "Content-Type": "application/json" },
  });
});
