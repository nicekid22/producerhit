export type PromptBankEntry = {
  id: number;
  theme: string;
  theme_label_en: string;
  theme_label_fr: string;
  lang: "en" | "fr";
  display: string;
  acestep: {
    caption: string;
    lyrics_structure: string;
  };
};

export type PromptBankRoll = {
  id: number;
  theme: string;
  display: string;
  aceCaption: string;
  lyricsStructure: string;
  lang: "en" | "fr";
  genre: string;
};
