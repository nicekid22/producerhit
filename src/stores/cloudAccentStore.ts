import { create } from "zustand";

export type CloudAccent = "transparent" | "green" | "red" | "blue";

const STORAGE_KEY = "producerhit_cloud_accent_v1";

function normalizeAccent(raw: string | null | undefined): CloudAccent | null {
  if (raw === "transparent" || raw === "green" || raw === "red" || raw === "blue") return raw;
  return null;
}

function getInitialAccent(): CloudAccent {
  if (typeof window === "undefined") return "transparent";
  return normalizeAccent(window.localStorage.getItem(STORAGE_KEY)) ?? "transparent";
}

function persistAccent(accent: CloudAccent) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, accent);
}

type CloudAccentState = {
  accent: CloudAccent;
  setAccent: (accent: CloudAccent) => void;
};

export const useCloudAccentStore = create<CloudAccentState>((set) => ({
  accent: getInitialAccent(),
  setAccent: (accent) => {
    persistAccent(accent);
    set({ accent });
  },
}));

export const CLOUD_ACCENT_OPTIONS: Array<{
  id: CloudAccent;
  element: "air" | "earth" | "fire" | "water";
  labelFr: string;
  labelEn: string;
  moodFr: string;
  moodEn: string;
}> = [
  {
    id: "transparent",
    element: "air",
    labelFr: "Air",
    labelEn: "Air",
    moodFr: "Nuage · lavande",
    moodEn: "Cloud · lavender",
  },
  {
    id: "green",
    element: "earth",
    labelFr: "Terre",
    labelEn: "Earth",
    moodFr: "Nature · vert",
    moodEn: "Nature · green",
  },
  {
    id: "red",
    element: "fire",
    labelFr: "Feu",
    labelEn: "Fire",
    moodFr: "Énergie · corail",
    moodEn: "Energy · coral",
  },
  {
    id: "blue",
    element: "water",
    labelFr: "Eau",
    labelEn: "Water",
    moodFr: "Flow · bleu",
    moodEn: "Flow · blue",
  },
];
