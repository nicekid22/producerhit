// index.ts — Firebase Cloud Functions entry point
// Exports all functions for deployment via `firebase deploy --only functions`

import { defineSecret } from "firebase-functions/params";

// ── Secrets ────────────────────────────────────────────────────
const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");
const STRIPE_PRICE_ID_PRO = defineSecret("STRIPE_PRICE_ID_PRO");
const STRIPE_PRICE_ID_STUDIO = defineSecret("STRIPE_PRICE_ID_STUDIO");
const STRIPE_PRICE_ID_PLUS = defineSecret("STRIPE_PRICE_ID_PLUS");
const STRIPE_PRICE_ID_PRO_ANNUAL = defineSecret("STRIPE_PRICE_ID_PRO_ANNUAL");
const STRIPE_PRICE_ID_STUDIO_ANNUAL = defineSecret("STRIPE_PRICE_ID_STUDIO_ANNUAL");
const STRIPE_PRICE_ID_PLUS_ANNUAL = defineSecret("STRIPE_PRICE_ID_PLUS_ANNUAL");
const STRIPE_PRICE_ID_CREDIT_PACK_50 = defineSecret("STRIPE_PRICE_ID_CREDIT_PACK_50");
const ACE_API_KEY = defineSecret("ACE_API_KEY");

const stripeSecrets = [
  STRIPE_SECRET_KEY,
  STRIPE_PRICE_ID_PRO,
  STRIPE_PRICE_ID_STUDIO,
  STRIPE_PRICE_ID_PLUS,
  STRIPE_PRICE_ID_PRO_ANNUAL,
  STRIPE_PRICE_ID_STUDIO_ANNUAL,
  STRIPE_PRICE_ID_PLUS_ANNUAL,
  STRIPE_PRICE_ID_CREDIT_PACK_50,
];

// ── Import function modules ────────────────────────────────────
import { createCheckoutHandler } from "./createCheckout";
import { confirmCheckoutHandler } from "./confirmCheckout";
import { createPortalHandler } from "./createPortal";
import { stripeWebhookHandler } from "./stripeWebhook";
import { ensureProfileHandler } from "./ensureProfile";
import { generateLoopAceHandler } from "./generateLoopAce";

import * as functions from "firebase-functions";

// ── Export functions with secrets bound ─────────────────────────
export const createCheckout = functions.https.onCall(
  { secrets: stripeSecrets },
  createCheckoutHandler,
);

export const confirmCheckout = functions.https.onCall(
  { secrets: stripeSecrets },
  confirmCheckoutHandler,
);

export const createPortal = functions.https.onCall(
  { secrets: [STRIPE_SECRET_KEY] },
  createPortalHandler,
);

export const stripeWebhook = functions.https.onRequest(
  { secrets: [STRIPE_WEBHOOK_SECRET, ...stripeSecrets] },
  stripeWebhookHandler,
);

export const ensureProfile = functions.https.onCall(
  {},
  ensureProfileHandler,
);

export const generateLoopAce = functions.https.onCall(
  {
    secrets: [ACE_API_KEY],
    timeoutSeconds: 300,     // ACE generation can take up to 3 minutes
    memory: "512MiB",        // More headroom for large ACE responses
    maxInstances: 5,
  },
  generateLoopAceHandler,
);
