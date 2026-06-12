/**
 * Channel-aware YouTube metadata + deterministic A/B variants (Shorts SEO 2026).
 */

import { fillTemplate, pickAbVariant } from "./youtubeAbTesting.ts";
import { getChannelProfile, homeUrlForChannel } from "./youtubeChannelProfiles.ts";
import type { TrackKind, ViralMeta } from "./youtubeSocial.ts";

export type YouTubeAbMeta = {
  account: string;
  titleVariant: string;
  descVariant: string;
};

export type YouTubeUploadMetadata = {
  title: string;
  description: string;
  tags: string[];
  ab: YouTubeAbMeta;
};

const AI_DISCLOSURE = "Music created with AI on ProducerHit.";

type TitleVariant = { id: string; template: string };
type DescVariant = { id: string; build: (ctx: DescCtx) => string };

type DescCtx = {
  hookOpen: string;
  sourceQuote: string;
  shareUrl: string;
  homeUrl: string;
  cta: string;
  primaryKeyword: string;
  genre: string;
  name: string;
  meta: string;
  hashtags: string;
  kind: TrackKind;
};

function vars(input: {
  name: string;
  genre: string;
  bpm: number | null;
  key: string;
  ep?: string;
  sourceShort?: string;
}): Record<string, string> {
  const bpmSuffix = input.bpm && input.bpm > 0 ? ` ${input.bpm} BPM` : "";
  return {
    name: input.name.trim().slice(0, 48),
    genre: input.genre.trim(),
    bpm: bpmSuffix,
    key: input.key.trim(),
    ep: input.ep ?? "",
    sourceShort: (input.sourceShort ?? "").trim().slice(0, 40),
  };
}

function standardTitleVariants(accountId: string, kind: TrackKind): TitleVariant[] {
  const id = accountId.trim().toLowerCase();

  if (id === "market") {
    return [
      { id: "A", template: "[FREE] {genre} Type Beat — {name}{bpm} #Shorts" },
      { id: "B", template: "Would you rap on this {genre} beat? #Shorts" },
      { id: "C", template: "{genre} AI Beat | {name}{bpm} #Shorts" },
    ];
  }
  if (id === "lowdey") {
    return [
      { id: "A", template: "Guess this {genre} AI music prompt #Shorts" },
      { id: "B", template: "What prompt made this {genre} song? #Shorts" },
      { id: "C", template: "Can you guess the AI prompt? {genre} #Shorts" },
    ];
  }
  if (id === "producerhitai") {
    return [
      { id: "A", template: "I turned text into a {genre} AI song #Shorts" },
      { id: "B", template: "Comment to song — {genre} AI vocals #Shorts" },
      { id: "C", template: "One sentence → {genre} song (AI) #Shorts" },
    ];
  }
  if (id === "beatmakerunion") {
    return [
      { id: "A", template: "This shouldn't be a {genre} song — {name} #Shorts" },
      { id: "B", template: "Absurd {genre} AI music 😭 #Shorts" },
      { id: "C", template: "Things that shouldn't be songs — {name} #Shorts" },
    ];
  }
  if (kind === "instrumental") {
    return [
      { id: "A", template: "{genre} Instrumental — {name}{bpm} #Shorts" },
      { id: "B", template: "Would you use this {genre} instrumental? #Shorts" },
      { id: "C", template: "{genre} AI Beat (No Tags){bpm} #Shorts" },
    ];
  }
  if (kind === "type_beat") {
    return [
      { id: "A", template: "{genre} AI Beat — {name}{bpm} #Shorts" },
      { id: "B", template: "This {genre} beat goes hard 🔥 #Shorts" },
      { id: "C", template: "Free {genre} beat on ProducerHit{bpm} #Shorts" },
    ];
  }
  if (kind === "song") {
    return [
      { id: "A", template: "{genre} AI Song — {name} #Shorts" },
      { id: "B", template: "This {genre} AI song hits different 🎧 #Shorts" },
      { id: "C", template: "AI made this {genre} song in seconds #Shorts" },
    ];
  }
  return [
    { id: "A", template: "{genre} AI Vibe — {name} #Shorts" },
    { id: "B", template: "This {genre} mood hits different 🎧 #Shorts" },
    { id: "C", template: "AI {genre} loop you need to hear #Shorts" },
  ];
}

function viralTitleVariants(series: string): TitleVariant[] {
  if (series === "comment_to_song") {
    return [
      { id: "A", template: "I turned a comment into a song{ep} #Shorts" },
      { id: "B", template: "Someone commented this → I made a song{ep} #Shorts" },
      { id: "C", template: "Comment to song AI — wait for it{ep} #Shorts" },
    ];
  }
  if (series === "absurd_to_song") {
    return [
      { id: "A", template: "This shouldn't be a song — {name} #Shorts" },
      { id: "B", template: "I turned {sourceShort} into a song #Shorts" },
      { id: "C", template: "Things that shouldn't be songs{ep} #Shorts" },
    ];
  }
  return [
    { id: "A", template: "Guess the AI music prompt{ep} #Shorts" },
    { id: "B", template: "Can you guess what I typed?{ep} #Shorts" },
    { id: "C", template: "AI music prompt challenge{ep} #Shorts" },
  ];
}

const DESC_VARIANTS: DescVariant[] = [
  {
    id: "A",
    build: (c) =>
      [
        c.hookOpen,
        c.sourceQuote,
        c.meta ? `\n${c.meta}` : "",
        "\n\n🎧 Full track:\n",
        c.shareUrl,
        `\n\n✨ ${c.cta}\n`,
        c.homeUrl,
        `\n\n${c.hashtags}`,
        `\n\n${AI_DISCLOSURE}`,
      ].join(""),
  },
  {
    id: "B",
    build: (c) =>
      [
        `${c.primaryKeyword} — ${c.hookOpen}`,
        c.sourceQuote,
        c.meta ? `\n${c.meta}` : "",
        "\n\nListen free:\n",
        c.shareUrl,
        "\n\nMake your own AI music:\n",
        c.homeUrl,
        `\n\n${c.cta}`,
        `\n\n${c.hashtags}`,
        `\n\n${AI_DISCLOSURE}`,
      ].join(""),
  },
  {
    id: "C",
    build: (c) =>
      [
        c.cta,
        c.hookOpen,
        c.sourceQuote,
        c.meta ? `\n${c.meta}` : "",
        "\n\n🎧 Track:\n",
        c.shareUrl,
        "\n\nTry ProducerHit:\n",
        c.homeUrl,
        `\n\n${c.hashtags}`,
        `\n\n${AI_DISCLOSURE}`,
      ].join(""),
  },
];

function buildStandardHook(kind: TrackKind, genre: string, name: string, accountId?: string): string {
  const id = (accountId ?? "").trim().toLowerCase();
  if (id === "vibez" && kind === "song") {
    return `Someone made this ${genre} AI song on ProducerHit — "${name}".`;
  }
  if (id === "market" && (kind === "type_beat" || kind === "instrumental")) {
    return `Community ${genre} beat — "${name}". Made with AI, sounds like hours in the studio.`;
  }
  if (kind === "song") return `New ${genre} AI song with vocals — "${name}".`;
  if (kind === "instrumental") return `${genre} instrumental — "${name}".`;
  return `Free ${genre} type beat — "${name}".`;
}

function buildViralHook(viral: ViralMeta, profileKeyword: string): string {
  if (viral.hookOpen?.trim()) return viral.hookOpen.trim();
  if (viral.series === "comment_to_song") return "I turned a random comment into a full AI song.";
  if (viral.series === "absurd_to_song") return "This should NOT be a song… but AI made it anyway.";
  return `${profileKeyword} — listen before the reveal.`;
}

function buildTags(input: {
  accountId: string;
  genre: string;
  kind: TrackKind;
  viralSeries?: string;
}): string[] {
  const profile = getChannelProfile(input.accountId);
  const genreSlug = input.genre.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  const base = [
    "shorts",
    profile.primaryKeyword.toLowerCase(),
    ...profile.secondaryKeywords.slice(0, 2),
    "producerhit",
    genreSlug,
  ];
  if (input.viralSeries === "guess_prompt") base.push("guess the prompt", "ai challenge");
  if (input.viralSeries === "comment_to_song") base.push("comment to song", "text to song");
  if (input.viralSeries === "absurd_to_song") base.push("viral ai music", "funny ai song");
  if (input.kind === "type_beat") base.push("type beat", "free type beat");
  if (input.kind === "song") base.push("ai song", "ai vocals");
  return [...new Set(base.filter(Boolean))].slice(0, 8);
}

function buildHashtagLine(accountId: string, genre: string): string {
  const profile = getChannelProfile(accountId);
  const slug = genre.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  const genreTag = slug ? `#${slug.slice(0, 20)}` : "#AIMusic";
  return [...new Set([...profile.defaultHashtags, genreTag])].slice(0, 5).join(" ");
}

export function buildYouTubeUploadMetadata(input: {
  loopId: string;
  name: string;
  genre: string;
  bpm: number | null;
  key: string;
  kind: TrackKind;
  shareUrl: string;
  accountId: string;
  viralMeta?: ViralMeta | null;
}): YouTubeUploadMetadata {
  const accountId = input.accountId.trim().toLowerCase();
  const profile = getChannelProfile(accountId);
  const homeUrl = homeUrlForChannel(accountId);
  const v = vars({
    name: input.name,
    genre: input.genre,
    bpm: input.bpm,
    key: input.key,
    ep: input.viralMeta?.episodeNum ? ` Ep.${input.viralMeta.episodeNum}` : "",
    sourceShort: input.viralMeta?.sourceText ?? input.name,
  });
  const meta = [input.bpm ? `${input.bpm} BPM` : null, input.key || null].filter(Boolean).join(" · ");

  const titlePool = input.viralMeta
    ? viralTitleVariants(input.viralMeta.series)
    : standardTitleVariants(accountId, input.kind);
  const titleVar = pickAbVariant(input.loopId, `title:${accountId}`, titlePool);
  const title = fillTemplate(titleVar.template, v).slice(0, 100);

  const sourceQuote = input.viralMeta?.sourceText?.trim()
    ? `\n\n"${input.viralMeta.sourceText.trim().slice(0, 280)}"`
    : input.name
      ? `\n\n"${input.name.trim().slice(0, 80)}"`
      : "";

  const defaultCta = input.viralMeta
    ? (input.viralMeta.hookCta?.trim() ??
      (input.viralMeta.series === "guess_prompt"
        ? "Drop your guess in the comments 👇"
        : input.viralMeta.series === "comment_to_song"
          ? "Comment your idea for the next episode"
          : input.viralMeta.series === "absurd_to_song"
            ? "What should we turn into a song next?"
            : "Create your own beats & songs with AI"))
    : accountId === "vibez"
      ? "This didn't exist this morning — imagine what you could drop tonight"
      : accountId === "market"
        ? "Your folder is missing this beat. Fix that in 30 seconds."
        : "Create your own beats & songs with AI";

  const descCtx: DescCtx = {
    hookOpen: input.viralMeta
      ? buildViralHook(input.viralMeta, profile.primaryKeyword)
      : buildStandardHook(input.kind, input.genre, input.name, accountId),
    sourceQuote,
    shareUrl: input.shareUrl,
    homeUrl,
    cta: defaultCta,
    primaryKeyword: profile.primaryKeyword,
    genre: input.genre,
    name: input.name,
    meta,
    hashtags: buildHashtagLine(accountId, input.genre),
    kind: input.kind,
  };

  const descVar = pickAbVariant(input.loopId, `desc:${accountId}`, DESC_VARIANTS);
  const description = descVar.build(descCtx).slice(0, 4900);

  const tags = buildTags({
    accountId,
    genre: input.genre,
    kind: input.kind,
    viralSeries: input.viralMeta?.series,
  });

  return {
    title,
    description,
    tags,
    ab: { account: accountId, titleVariant: titleVar.id, descVariant: descVar.id },
  };
}
