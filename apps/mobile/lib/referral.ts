const ORIGIN = "https://www.producerhit.com";

export function buildReferralUrl(referralCode: string): string {
  const url = new URL(ORIGIN);
  url.searchParams.set("ref", referralCode);
  url.searchParams.set("utm_source", "referral");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", "invite");
  return url.toString();
}
