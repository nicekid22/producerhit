/**
 * Per-channel YouTube SEO + brand positioning (2026 Shorts best practices).
 * Each channel = one recognizable format for the algorithm + audience.
 */

export type YouTubeChannelId = "vibez" | "market" | "lowdey" | "producerhitai" | "beatmakerunion" | "remix1" | "remix2";

export type ChannelProfile = {
  id: YouTubeChannelId;
  handle: string;
  label: string;
  /** Primary search keyword cluster */
  primaryKeyword: string;
  secondaryKeywords: string[];
  /** Channel page description (unique per channel — YouTube SEO) */
  channelDescription: string;
  /** brandingSettings.channel.keywords (max ~500 chars) */
  channelKeywords: string;
  defaultHashtags: string[];
  homeUtmCampaign: string;
};

const HOME = "https://www.producerhit.com";

export const YOUTUBE_CHANNEL_PROFILES: Record<YouTubeChannelId, ChannelProfile> = {
  vibez: {
    id: "vibez",
    handle: "@ProducerVibez-d6y",
    label: "Producer Vibez",
    primaryKeyword: "AI mood music",
    secondaryKeywords: ["ai vibes", "chill ai music", "emotional ai song", "producerhit"],
    channelDescription: [
      "AI mood music & vibe loops — new drops daily.",
      "",
      "Emotional AI songs, chill beats, and scroll-stopping Shorts made in seconds on ProducerHit.",
      "",
      "🎧 Create your own: " + HOME + "?utm_source=youtube&utm_medium=channel&utm_campaign=vibez",
      "",
      "New Shorts · AI music · #Shorts",
    ].join("\n"),
    channelKeywords:
      "ai music, ai mood music, ai vibes, chill beats, emotional music, ai song, producerhit, music shorts, ai generated music",
    defaultHashtags: ["#Shorts", "#AIMusic", "#Vibes", "#ProducerHit"],
    homeUtmCampaign: "vibez",
  },
  market: {
    id: "market",
    handle: "@producermarket",
    label: "Producer Market",
    primaryKeyword: "AI type beat",
    secondaryKeywords: ["free type beat", "ai beat maker", "trap type beat", "producerhit"],
    channelDescription: [
      "AI type beats & instrumentals for producers — free to listen.",
      "",
      "Trap, drill, R&B, hip-hop beats generated with AI. Would you rap on this?",
      "",
      "🎹 Make beats in 30 seconds: " + HOME + "?utm_source=youtube&utm_medium=channel&utm_campaign=market",
      "",
      "Type beats · AI producer · #Shorts",
    ].join("\n"),
    channelKeywords:
      "type beat, free type beat, ai type beat, ai beat, trap beat, hip hop instrumental, beat maker, producerhit, music production",
    defaultHashtags: ["#Shorts", "#TypeBeat", "#FreeBeat", "#ProducerHit"],
    homeUtmCampaign: "market",
  },
  lowdey: {
    id: "lowdey",
    handle: "@Lowdey",
    label: "Lowdey",
    primaryKeyword: "guess the AI prompt",
    secondaryKeywords: ["ai music challenge", "ai song prompt", "text to song ai", "producerhit"],
    channelDescription: [
      "Guess the AI music prompt — can you figure it out before the reveal?",
      "",
      "Daily Shorts: listen first, guess the ridiculous prompt, then see if you were right.",
      "",
      "🎯 Try your own prompt: " + HOME + "?utm_source=youtube&utm_medium=channel&utm_campaign=lowdey",
      "",
      "AI music game · Guess the prompt · #Shorts",
    ].join("\n"),
    channelKeywords:
      "guess the prompt, ai music, ai song, text to music, ai challenge, music quiz, producerhit, ai generated song, shorts",
    defaultHashtags: ["#Shorts", "#AIMusic", "#GuessThePrompt", "#ProducerHit"],
    homeUtmCampaign: "lowdey",
  },
  producerhitai: {
    id: "producerhitai",
    handle: "@producerhitAI",
    label: "ProducerHit AI",
    primaryKeyword: "comment to song AI",
    secondaryKeywords: ["text to song", "ai cover song", "turn text into music", "producerhit"],
    channelDescription: [
      "I turn comments & texts into AI songs — new episode daily.",
      "",
      "Someone asked for this → AI made a full song. Comment your idea for tomorrow's episode.",
      "",
      "✨ Turn YOUR text into music: " + HOME + "?utm_source=youtube&utm_medium=channel&utm_campaign=producerhitai",
      "",
      "Comment to song · AI vocals · #Shorts",
    ].join("\n"),
    channelKeywords:
      "comment to song, text to song, ai song, ai vocals, turn text into music, ai music generator, producerhit, viral ai song",
    defaultHashtags: ["#Shorts", "#AIMusic", "#TextToSong", "#ProducerHit"],
    homeUtmCampaign: "producerhitai",
  },
  beatmakerunion: {
    id: "beatmakerunion",
    handle: "@BeatmakerUnion",
    label: "Beatmaker Union",
    primaryKeyword: "absurd AI song",
    secondaryKeywords: ["things that shouldn't be songs", "ai music funny", "receipt to song", "producerhit"],
    channelDescription: [
      "Things that should NOT be songs… but AI made them anyway.",
      "",
      "Receipts, texts, terms & conditions → bangers. Daily absurd AI music Shorts.",
      "",
      "🔥 Make something ridiculous: " + HOME + "?utm_source=youtube&utm_medium=channel&utm_campaign=beatmakerunion",
      "",
      "Absurd AI music · WTF songs · #Shorts",
    ].join("\n"),
    channelKeywords:
      "absurd ai song, funny ai music, ai music generator, text to song, viral ai music, producerhit, ai beat, music meme",
    defaultHashtags: ["#Shorts", "#AIMusic", "#Viral", "#ProducerHit"],
    homeUtmCampaign: "beatmakerunion",
  },
  remix1: {
    id: "remix1",
    handle: "@ProducerHitRemix1",
    label: "ProducerHit Remix",
    primaryKeyword: "AI remix",
    secondaryKeywords: ["ai cover", "trending song remix", "genre remix", "producerhit"],
    channelDescription: [
      "Trending songs reimagined as AI remixes — full tracks, new lyrics, new genres.",
      "",
      "Trap, Afrobeats, Drill, R&B… daily AI remix drops inspired by what's trending.",
      "",
      "🎧 Create your remix: " + HOME + "?utm_source=youtube&utm_medium=channel&utm_campaign=remix1",
    ].join("\n"),
    channelKeywords:
      "ai remix, ai cover, trending song remix, music remix, ai music, genre remix, producerhit, full song ai",
    defaultHashtags: ["#AIMusic", "#AIRemix", "#MusicRemix", "#ProducerHit"],
    homeUtmCampaign: "remix1",
  },
  remix2: {
    id: "remix2",
    handle: "@ProducerHitRemix2",
    label: "ProducerHit Remix 2",
    primaryKeyword: "AI cover remix",
    secondaryKeywords: ["viral song remix", "ai music cover", "trend remix", "producerhit"],
    channelDescription: [
      "Viral hits × unexpected genres — AI remixes with full vocals & lyrics.",
      "",
      "Search trending songs, hear them in a completely new style. Made on ProducerHit.",
      "",
      "✨ Try it free: " + HOME + "?utm_source=youtube&utm_medium=channel&utm_campaign=remix2",
    ].join("\n"),
    channelKeywords:
      "ai cover, ai remix, viral song cover, trending music remix, ai song generator, producerhit",
    defaultHashtags: ["#AICover", "#AIRemix", "#Trending", "#ProducerHit"],
    homeUtmCampaign: "remix2",
  },
};

export function getChannelProfile(accountId: string): ChannelProfile {
  const id = accountId.trim().toLowerCase() as YouTubeChannelId;
  return YOUTUBE_CHANNEL_PROFILES[id] ?? YOUTUBE_CHANNEL_PROFILES.vibez;
}

export function homeUrlForChannel(accountId: string): string {
  const p = getChannelProfile(accountId);
  return `${HOME}?utm_source=youtube&utm_medium=social&utm_campaign=${p.homeUtmCampaign}`;
}
