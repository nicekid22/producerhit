// index.ts — Firebase Cloud Functions v2 entry point
// Uses firebase-functions/v2/https for explicit CORS support

import { defineSecret } from "firebase-functions/params";
import { onCall, onRequest } from "firebase-functions/v2/https";

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
import { persistPollinationsCoverHandler } from "./persistPollinationsCover";

// ── Allowed CORS origins for callable functions ────────────────
const ALLOWED_ORIGINS = [
  "https://www.producerhit.com",
  "https://producerhit.com",
  "https://producerhit-ai.web.app",
  "https://producerhit-ai.firebaseapp.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

// ── Export callable functions with CORS enabled ─────────────────
export const createCheckout = onCall(
  {
    secrets: stripeSecrets,
    cors: ALLOWED_ORIGINS,
  },
  createCheckoutHandler,
);

export const confirmCheckout = onCall(
  {
    secrets: stripeSecrets,
    cors: ALLOWED_ORIGINS,
  },
  confirmCheckoutHandler,
);

export const createPortal = onCall(
  {
    secrets: [STRIPE_SECRET_KEY],
    cors: ALLOWED_ORIGINS,
  },
  createPortalHandler,
);

export const stripeWebhook = onRequest(
  {
    secrets: [STRIPE_WEBHOOK_SECRET, ...stripeSecrets],
    cors: ALLOWED_ORIGINS,
  },
  stripeWebhookHandler,
);

export const ensureProfile = onCall(
  {
    cors: ALLOWED_ORIGINS,
  },
  ensureProfileHandler,
);

export const generateLoopAce = onCall(
  {
    secrets: [ACE_API_KEY],
    timeoutSeconds: 300,
    memory: "512MiB",
    maxInstances: 5,
    cors: ALLOWED_ORIGINS,
  },
  generateLoopAceHandler,
);

// ── Pollinations cover generation (replicates the old persist-pollinations-cover Supabase Edge Function)
export const persistPollinationsCover = onCall(
  {
    timeoutSeconds: 60,
    memory: "512MiB",
    maxInstances: 10,
    cors: ALLOWED_ORIGINS,
  },
  persistPollinationsCoverHandler,
);
