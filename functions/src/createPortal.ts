// createPortal.ts — Firebase Cloud Function (Node.js)
// Port of supabase/functions/create-portal/index.ts

import * as functions from "firebase-functions";
import { fbGetProfile } from "./firestore";

export async function createPortalHandler(request: { auth?: { uid: string; token?: Record<string, unknown> }; data: Record<string, unknown> }) {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Not authenticated");
  }

  const userId = request.auth.uid;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new functions.https.HttpsError("failed-precondition", "Missing STRIPE_SECRET_KEY");

  const fbProfile = await fbGetProfile(userId);
  const customerId = fbProfile?.stripe_customer_id ?? "";
  if (!customerId) throw new functions.https.HttpsError("failed-precondition", "No Stripe customer");

  const returnUrl = typeof request.data?.returnUrl === "string" ? request.data.returnUrl : "";

  const fetch = (await import("node-fetch")).default;
  const portalRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      customer: customerId,
      return_url: returnUrl,
    }).toString(),
  });

  const portalJson = (await portalRes.json().catch(() => null)) as { url?: unknown } | null;
  const url = typeof portalJson?.url === "string" ? portalJson.url : null;
  if (!url) throw new functions.https.HttpsError("failed-precondition", "Stripe response missing portal URL");

  return { url };
}
