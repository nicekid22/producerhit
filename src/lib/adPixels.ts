import { getAttributionProps } from "@/lib/attribution";

type PixelMap = {
  ga4?: string;
  tiktok?: string;
  meta?: string;
};

/** Events produit → événements standard ads (GA4 / TikTok / Meta). */
const PIXEL_EVENT_MAP: Record<string, PixelMap> = {
  page_view: { ga4: "page_view" },
  signup_started: { ga4: "sign_up", tiktok: "CompleteRegistration", meta: "Lead" },
  signup_completed: { ga4: "sign_up", tiktok: "CompleteRegistration", meta: "CompleteRegistration" },
  generate_success: { ga4: "generate_lead", tiktok: "SubmitForm", meta: "Lead" },
  checkout_start: { ga4: "begin_checkout", tiktok: "InitiateCheckout", meta: "InitiateCheckout" },
  checkout_abandoned: { ga4: "begin_checkout", tiktok: "InitiateCheckout", meta: "InitiateCheckout" },
  checkout_resume_click: { ga4: "begin_checkout", tiktok: "InitiateCheckout", meta: "InitiateCheckout" },
  subscription_activated: { ga4: "purchase", tiktok: "Subscribe", meta: "Subscribe" },
  email_capture: { ga4: "generate_lead", tiktok: "SubmitForm", meta: "Lead" },
  referral_link_shared: { ga4: "share", tiktok: "ClickButton", meta: "Lead" },
  growth_share_click: { ga4: "share", tiktok: "ClickButton", meta: "Lead" },
  landing_generate_click: { ga4: "select_content", tiktok: "ClickButton", meta: "ViewContent" },
};

const SERVER_MIRROR_EVENTS = new Set([
  "signup_completed",
  "generate_success",
  "checkout_start",
  "checkout_abandoned",
  "subscription_activated",
  "email_capture",
]);

type GtagFn = (...args: unknown[]) => void;
type TtqFn = {
  track?: (event: string, props?: Record<string, unknown>) => void;
  identify?: (props: Record<string, unknown>) => void;
  page?: () => void;
};
type FbqFn = (...args: unknown[]) => void;

function win() {
  return typeof window !== "undefined" ? window : null;
}

function eventId(name: string, props?: Record<string, unknown>): string {
  const fromProps = props?.event_id;
  if (typeof fromProps === "string" && fromProps.length > 8) return fromProps;
  return `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function pixelPayload(name: string, props?: Record<string, unknown>) {
  const attribution = getAttributionProps();
  const id = eventId(name, props);
  return {
    event_id: id,
    ...attribution,
    ...props,
  };
}

/** Mirror immédiat vers pixels client-side (GA4, TikTok, Meta). */
export function mirrorEventToAdPixels(name: string, props?: Record<string, unknown>) {
  const map = PIXEL_EVENT_MAP[name];
  if (!map) return null;

  const w = win();
  if (!w) return null;

  const payload = pixelPayload(name, props);

  const gtag = (w as Window & { gtag?: GtagFn }).gtag;
  if (map.ga4 && gtag) {
    gtag("event", map.ga4, payload);
  }

  const ttq = (w as Window & { ttq?: TtqFn }).ttq;
  if (map.tiktok && ttq?.track) {
    ttq.track(map.tiktok, payload);
  }

  const fbq = (w as Window & { fbq?: FbqFn }).fbq;
  if (map.meta && fbq) {
    fbq("track", map.meta, payload, { eventID: payload.event_id });
  }

  return payload.event_id;
}

export function shouldMirrorToServer(name: string): boolean {
  return SERVER_MIRROR_EVENTS.has(name);
}

/** Identifie l'utilisateur connecté pour l'attribution cross-device (hash email côté ads). */
export function identifyUserForAds(args: { email?: string | null; userId?: string | null }) {
  const w = win();
  if (!w) return;

  const externalId = args.userId?.trim();
  const email = args.email?.trim().toLowerCase();
  if (!externalId && !email) return;

  const ttq = (w as Window & { ttq?: TtqFn }).ttq;
  if (ttq?.identify) {
    ttq.identify({
      ...(externalId ? { external_id: externalId } : {}),
      ...(email ? { email } : {}),
    });
  }
}
