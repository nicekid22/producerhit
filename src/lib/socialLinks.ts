export type SocialPlatform = "instagram" | "tiktok";

export type SocialProfile = {
  platform: SocialPlatform;
  handle: string;
  href: string;
  labelEn: string;
  labelFr: string;
};

export const PRODUCERHIT_SOCIALS: SocialProfile[] = [
  {
    platform: "instagram",
    handle: "@producerhit_com",
    href: "https://www.instagram.com/producerhit_com/",
    labelEn: "Instagram",
    labelFr: "Instagram",
  },
  {
    platform: "tiktok",
    handle: "@producerhit.com",
    href: "https://www.tiktok.com/@producerhit.com",
    labelEn: "TikTok",
    labelFr: "TikTok",
  },
];

export function getSocialProfile(platform: SocialPlatform): SocialProfile {
  return PRODUCERHIT_SOCIALS.find((s) => s.platform === platform)!;
}
