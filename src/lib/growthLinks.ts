const ORIGIN = "https://www.producerhit.com";

/** Origine publique pour liens partagés (referral, social, etc.) — jamais localhost. */
export const PRODUCERHIT_ORIGIN = ORIGIN;

export type GrowthChannel =
  | "organic"
  | "twitter"
  | "tiktok"
  | "instagram"
  | "youtube"
  | "facebook"
  | "reddit"
  | "linkedin"
  | "discord"
  | "whatsapp"
  | "telegram"
  | "email"
  | "referral"
  | "blog";

const CHANNEL_UTM: Record<GrowthChannel, { utm_source: string; utm_medium: string }> = {
  organic: { utm_source: "google", utm_medium: "organic" },
  twitter: { utm_source: "twitter", utm_medium: "social" },
  tiktok: { utm_source: "tiktok", utm_medium: "social" },
  instagram: { utm_source: "instagram", utm_medium: "social" },
  youtube: { utm_source: "youtube", utm_medium: "social" },
  facebook: { utm_source: "facebook", utm_medium: "social" },
  reddit: { utm_source: "reddit", utm_medium: "social" },
  linkedin: { utm_source: "linkedin", utm_medium: "social" },
  discord: { utm_source: "discord", utm_medium: "social" },
  whatsapp: { utm_source: "whatsapp", utm_medium: "social" },
  telegram: { utm_source: "telegram", utm_medium: "social" },
  email: { utm_source: "newsletter", utm_medium: "email" },
  referral: { utm_source: "referral", utm_medium: "referral" },
  blog: { utm_source: "blog", utm_medium: "content" },
};

export function buildGrowthUrl(
  path: string,
  channel: GrowthChannel,
  opts?: { campaign?: string; content?: string; ref?: string },
): string {
  const base = path.startsWith("http") ? path : `${ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
  const url = new URL(base);
  const utm = CHANNEL_UTM[channel];
  url.searchParams.set("utm_source", utm.utm_source);
  url.searchParams.set("utm_medium", utm.utm_medium);
  url.searchParams.set("utm_campaign", opts?.campaign ?? "producerhit");
  if (opts?.content) url.searchParams.set("utm_content", opts.content);
  if (opts?.ref) url.searchParams.set("ref", opts.ref);
  return url.toString();
}

export function buildReferralUrl(referralCode: string): string {
  return buildGrowthUrl("/", "referral", { campaign: "invite", ref: referralCode });
}

export function buildLoopShareUrl(loopId: string, channel: GrowthChannel = "twitter"): string {
  return buildGrowthUrl(`/loop/${loopId}`, channel, { campaign: "public_track", content: loopId.slice(0, 8) });
}

export function buildSignupUrl(channel: GrowthChannel = "organic"): string {
  return buildGrowthUrl("/auth", channel, { campaign: "signup" });
}

export function twitterShareIntent(text: string, url: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

export function facebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function whatsAppShareUrl(text: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
}

export function telegramShareUrl(text: string, url: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function redditSubmitUrl(opts: { subreddit?: string; title: string; url?: string; selftext?: string }): string {
  const u = new URL("https://www.reddit.com/submit");
  if (opts.subreddit) u.searchParams.set("sr", opts.subreddit.replace(/^r\//i, ""));
  u.searchParams.set("title", opts.title);
  if (opts.selftext) u.searchParams.set("selftext", opts.selftext);
  else if (opts.url) u.searchParams.set("url", opts.url);
  return u.toString();
}

export function linkedInShareUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}
