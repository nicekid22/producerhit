import { buildGrowthUrl } from "@/lib/growthLinks";

/** Invite Discord — définir VITE_DISCORD_INVITE_URL après scripts/discord-setup-server.mjs */
export const DISCORD_INVITE_URL =
  (import.meta.env.VITE_DISCORD_INVITE_URL as string | undefined)?.trim() || "";

export function discordCommunityUrl(campaign = "community"): string {
  const invite = DISCORD_INVITE_URL || "https://discord.com/invite/producerhit";
  const url = new URL(invite.startsWith("http") ? invite : `https://${invite}`);
  url.searchParams.set("utm_source", "producerhit");
  url.searchParams.set("utm_medium", "discord");
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

export function discordChallengeUrl(weekKey: string): string {
  return buildGrowthUrl(`/community?challenge=${encodeURIComponent(weekKey)}`, "discord", { campaign: "weekly_challenge" });
}
