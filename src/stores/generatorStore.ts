import { create } from "zustand";
import type { GeneratorForm, LoopLength } from "@/types/loop";

const defaultForm: GeneratorForm = {
  genre: "",
  influence: "No Influence",
  key: "C",
  scale: "Minor",
  bpm: 140,
  loopLength: "4 bars",
  swing: 0,
  energyLevel: "Chill",
  mood: "Smooth",
  reverb: "Subtle",
  prompt: "",
};

type GeneratorState = {
  form: GeneratorForm;
  setField: <K extends keyof GeneratorForm>(k: K, v: GeneratorForm[K]) => void;
  setBpm: (bpm: number) => void;
  setLoopLength: (l: LoopLength) => void;
};

export const useGeneratorStore = create<GeneratorState>((set) => ({
  form: defaultForm,
  setField: (k, v) => set((s) => ({ form: { ...s.form, [k]: v } })),
  setBpm: (bpm) => set((s) => ({ form: { ...s.form, bpm } })),
  setLoopLength: (l) => set((s) => ({ form: { ...s.form, loopLength: l } })),
}));

