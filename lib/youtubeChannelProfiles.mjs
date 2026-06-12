/** Node mirror of supabase/functions/_shared/youtubeChannelProfiles.ts */

const HOME = "https://www.producerhit.com";

export const YOUTUBE_CHANNEL_PROFILES = {
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
      `🎧 Create your own: ${HOME}?utm_source=youtube&utm_medium=channel&utm_campaign=vibez`,
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
      `🎹 Make beats in 30 seconds: ${HOME}?utm_source=youtube&utm_medium=channel&utm_campaign=market`,
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
      `🎯 Try your own prompt: ${HOME}?utm_source=youtube&utm_medium=channel&utm_campaign=lowdey`,
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
      `✨ Turn YOUR text into music: ${HOME}?utm_source=youtube&utm_medium=channel&utm_campaign=producerhitai`,
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
      `🔥 Make something ridiculous: ${HOME}?utm_source=youtube&utm_medium=channel&utm_campaign=beatmakerunion`,
      "",
      "Absurd AI music · WTF songs · #Shorts",
    ].join("\n"),
    channelKeywords:
      "absurd ai song, funny ai music, ai music generator, text to song, viral ai music, producerhit, ai beat, music meme",
    defaultHashtags: ["#Shorts", "#AIMusic", "#Viral", "#ProducerHit"],
    homeUtmCampaign: "beatmakerunion",
  },
};

export function getChannelProfile(accountId) {
  const id = String(accountId ?? "vibez")
    .trim()
    .toLowerCase();
  return YOUTUBE_CHANNEL_PROFILES[id] ?? YOUTUBE_CHANNEL_PROFILES.vibez;
}

export function homeUrlForChannel(accountId) {
  const p = getChannelProfile(accountId);
  return `${HOME}?utm_source=youtube&utm_medium=social&utm_campaign=${p.homeUtmCampaign}`;
}

export function listChannelProfileIds() {
  return Object.keys(YOUTUBE_CHANNEL_PROFILES);
}
