const DISCORD_API = "https://discord.com/api/v10";
const EMBED_COLOR = 0x7c3aed;

export type DiscordChannels = {
  welcome: string;
  rules: string;
  announcements: string;
  general: string;
  challenges: string;
  showcase: string;
  tips: string;
  feedback: string;
  french: string;
  spanish: string;
  portuguese: string;
};

export type DiscordConfig = {
  token: string;
  guildId: string;
  channels: DiscordChannels;
};

export function loadDiscordConfig(): Omit<DiscordConfig, "channels"> & { channels: Partial<DiscordChannels> } | null {
  const token = (Deno.env.get("DISCORD_BOT_TOKEN") ?? "").trim();
  const guildId = (Deno.env.get("DISCORD_GUILD_ID") ?? "").trim();
  const welcome = (Deno.env.get("DISCORD_CHANNEL_WELCOME") ?? "").trim();
  const announcements = (Deno.env.get("DISCORD_CHANNEL_ANNOUNCEMENTS") ?? "").trim();
  const challenges = (Deno.env.get("DISCORD_CHANNEL_CHALLENGES") ?? "").trim();
  const showcase = (Deno.env.get("DISCORD_CHANNEL_SHOWCASE") ?? "").trim();
  const general = (Deno.env.get("DISCORD_CHANNEL_GENERAL") ?? "").trim();
  const tips = (Deno.env.get("DISCORD_CHANNEL_TIPS") ?? "").trim();
  if (!token || !guildId || !challenges) return null;
  return {
    token,
    guildId,
    channels: {
      welcome,
      announcements,
      challenges,
      showcase,
      general,
      tips,
      rules: (Deno.env.get("DISCORD_CHANNEL_RULES") ?? "").trim(),
      feedback: (Deno.env.get("DISCORD_CHANNEL_FEEDBACK") ?? "").trim(),
      french: (Deno.env.get("DISCORD_CHANNEL_FRENCH") ?? "").trim(),
      spanish: (Deno.env.get("DISCORD_CHANNEL_SPANISH") ?? "").trim(),
      portuguese: (Deno.env.get("DISCORD_CHANNEL_PORTUGUESE") ?? "").trim(),
    },
  };
}

type GuildChannel = { id: string; name: string; type: number };

export async function resolveDiscordChannels(
  cfg: Omit<DiscordConfig, "channels"> & { channels: Partial<DiscordChannels> },
): Promise<DiscordConfig | null> {
  const res = await discordRequest(`/guilds/${cfg.guildId}/channels`, { token: cfg.token });
  if (!res.ok || !Array.isArray(res.json)) return null;

  const list = res.json as GuildChannel[];
  const byName = (name: string) => list.find((c) => c.name === name && c.type === 0)?.id ?? "";

  const channels: DiscordChannels = {
    welcome: cfg.channels.welcome || byName("welcome"),
    rules: cfg.channels.rules || byName("rules"),
    announcements: cfg.channels.announcements || byName("announcements"),
    general: cfg.channels.general || byName("general"),
    challenges: cfg.channels.challenges || byName("weekly-challenge"),
    showcase: cfg.channels.showcase || byName("showcase"),
    tips: cfg.channels.tips || byName("producer-tips"),
    feedback: cfg.channels.feedback || byName("feedback"),
    french: cfg.channels.french || byName("french"),
    spanish: cfg.channels.spanish || byName("spanish"),
    portuguese: cfg.channels.portuguese || byName("portuguese"),
  };

  if (!channels.challenges) return null;
  return { token: cfg.token, guildId: cfg.guildId, channels };
}

export async function discordRequest(path: string, opts: RequestInit & { token: string }) {
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bot ${opts.token}`,
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { ok: res.ok, status: res.status, json, text };
}

export async function sendDiscordEmbed(
  cfg: DiscordConfig,
  channelId: string,
  embed: Record<string, unknown>,
  content?: string,
) {
  if (!channelId) return { ok: false, status: 0, json: null, text: "missing_channel" };
  return discordRequest(`/channels/${channelId}/messages`, {
    method: "POST",
    token: cfg.token,
    body: JSON.stringify({
      ...(content ? { content } : {}),
      embeds: [{ color: EMBED_COLOR, ...embed }],
    }),
  });
}

export async function pinDiscordMessage(cfg: DiscordConfig, channelId: string, messageId: string) {
  return discordRequest(`/channels/${channelId}/pins/${messageId}`, {
    method: "PUT",
    token: cfg.token,
  });
}

export function isoWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function weekBounds(d = new Date()): { startsAt: Date; endsAt: Date } {
  const now = new Date(d);
  const day = now.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const startsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + mondayOffset, 9, 0, 0));
  const endsAt = new Date(Date.UTC(startsAt.getUTCFullYear(), startsAt.getUTCMonth(), startsAt.getUTCDate() + 6, 23, 59, 59));
  return { startsAt, endsAt };
}

export function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

const CHALLENGE_THEMES: Array<{ genre: string; themeFr: string; themeEn: string; bpm: string }> = [
  { genre: "trap", themeFr: "Trap sombre — 808 lourds, mood cinématique", themeEn: "Dark trap — heavy 808s, cinematic mood", bpm: "130–150" },
  { genre: "drill", themeFr: "Drill UK — slides mélodiques, drums secs", themeEn: "UK drill — sliding melodies, dry drums", bpm: "140–150" },
  { genre: "rnb", themeFr: "R&B moderne — chords chaleureux, groove lent", themeEn: "Modern R&B — warm chords, slow groove", bpm: "70–95" },
  { genre: "afrobeats", themeFr: "Afrobeats — percussions syncopées, vibe été", themeEn: "Afrobeats — syncopated percussion, summer vibe", bpm: "95–115" },
  { genre: "phonk", themeFr: "Phonk — cowbell, distorsion, drift energy", themeEn: "Phonk — cowbell, distortion, drift energy", bpm: "130–160" },
  { genre: "ambient", themeFr: "Ambient ciné — textures, pas de drums dominants", themeEn: "Cinematic ambient — textures, no dominant drums", bpm: "60–90" },
  { genre: "house", themeFr: "House deep — bassline groovy, pads nocturnes", themeEn: "Deep house — groovy bassline, night pads", bpm: "120–128" },
  { genre: "pop", themeFr: "Pop radio — hook accrocheur, production clean", themeEn: "Radio pop — catchy hook, clean production", bpm: "100–130" },
  { genre: "boom-bap", themeFr: "Boom bap — samples jazz, drums MPC", themeEn: "Boom bap — jazz samples, MPC drums", bpm: "85–100" },
  { genre: "hyperpop", themeFr: "Hyperpop — glitch, voix pitchées, chaos fun", themeEn: "Hyperpop — glitch, pitched vocals, fun chaos", bpm: "140–180" },
  { genre: "latin", themeFr: "Latin trap — reggaeton flow, dembow light", themeEn: "Latin trap — reggaeton flow, light dembow", bpm: "90–105" },
  { genre: "synthwave", themeFr: "Synthwave — arpégios rétro, night drive", themeEn: "Synthwave — retro arps, night drive", bpm: "85–110" },
];

export function pickChallengeTheme(weekKey: string, recentGenres: string[] = []) {
  const blocked = new Set(recentGenres.map((g) => g.toLowerCase()));
  const pool = CHALLENGE_THEMES.filter((t) => !blocked.has(t.genre));
  const list = pool.length ? pool : CHALLENGE_THEMES;
  let hash = 0;
  for (let i = 0; i < weekKey.length; i++) hash = (hash * 31 + weekKey.charCodeAt(i)) >>> 0;
  return list[hash % list.length]!;
}

export const PRODUCERHIT_SITE = "https://www.producerhit.com";

export const DAILY_PULSE_PROMPTS = [
  "What genre are you cooking today? Drop your **public loop link** or say hi 👋",
  "Quick poll: **trap, R&B, or drill** this week? Reply + share a track from [ProducerHit](" + PRODUCERHIT_SITE + ")",
  "Show us your last beat — paste a **public ProducerHit link** in this thread 🎧",
  "Who's posting on TikTok this week? Share your hook + genre below",
  "New producers: ask anything about genres, BPM, or exports — community helps 🌍",
  "Friday energy — drop your **best public loop** for feedback (link only, no files)",
  "Weekend session: what BPM are you locked on? **130? 140? 85?**",
];

export const DAILY_PRODUCER_TIPS = [
  "Tip: pick **one genre + one mood** before generating — tighter prompts = better hooks.",
  "Tip: export **9:16 video** from ProducerHit for TikTok/Reels — captions are in the share kit.",
  "Tip: make a track **public** to enter the weekly challenge (+ bonus credits for top 3).",
  "Tip: hit the free limit? [Pro plans](" + PRODUCERHIT_SITE + "/pricing) remove watermark & add gens for daily posting.",
  "Tip: remix a public loop from [/community](" + PRODUCERHIT_SITE + "/community) — fastest way to learn what works.",
  "Tip: **BPM consistency** — pick a range (e.g. 140–150 drill) and generate 3 variants, keep the best.",
  "Tip: use `/challenge` anytime to see this week's theme + deadline.",
];

export function verifyDiscordCronSecret(req: Request): boolean {
  const expected = (Deno.env.get("DISCORD_CRON_SECRET") ?? "").trim();
  if (!expected) return false;
  return req.headers.get("x-discord-cron-secret") === expected;
}

export async function verifyDiscordInteractionSignature(
  body: string,
  signatureHex: string,
  timestamp: string,
  publicKeyHex: string,
): Promise<boolean> {
  if (!signatureHex || !timestamp || !publicKeyHex) return false;
  try {
    const mod = await import("https://esm.sh/tweetnacl@v1.0.3?dts");
    const nacl = (mod as { default?: typeof import("tweetnacl") }).default ?? mod;
    const message = new TextEncoder().encode(timestamp + body);
    const signature = hexToBytes(signatureHex);
    const publicKey = hexToBytes(publicKeyHex);
    return nacl.sign.detached.verify(message, signature, publicKey);
  } catch (e) {
    console.error("discord signature verify error", e);
    return false;
  }
}

function hexToBytes(hex: string) {
  const clean = hex.trim();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function pickDailyItem<T>(items: T[], dayKey: string): T {
  let hash = 0;
  for (let i = 0; i < dayKey.length; i++) hash = (hash * 31 + dayKey.charCodeAt(i)) >>> 0;
  return items[hash % items.length]!;
}

export type PublicLoopRow = {
  id: string;
  name: string | null;
  genre: string | null;
  bpm: number | null;
  cover_url: string | null;
  user_id: string | null;
  created_at: string | null;
};

export function loopEmbed(loop: PublicLoopRow, extra?: string): Record<string, unknown> {
  const loopUrl = `${PRODUCERHIT_SITE}/loop/${loop.id}`;
  const meta = [loop.genre, loop.bpm ? `${loop.bpm} BPM` : null].filter(Boolean).join(" · ");
  const embed: Record<string, unknown> = {
    title: `🎵 ${loop.name ?? "Untitled"}`,
    description:
      (meta ? `**${meta}**\n` : "") +
      `[Listen on ProducerHit](${loopUrl})` +
      (extra ? `\n${extra}` : "") +
      `\n[Create free](${PRODUCERHIT_SITE}) · [Go Pro](${PRODUCERHIT_SITE}/pricing)`,
  };
  if (loop.cover_url) embed.thumbnail = { url: loop.cover_url };
  return embed;
}
