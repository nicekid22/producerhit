import type { PresetMeta, VisualizerPresetId } from "@/lib/visualizer/types";

export const VISUALIZER_PRESETS: PresetMeta[] = [
  {
    id: "void",
    labelFr: "Void",
    labelEn: "Void",
    hintFr: "Noir profond, cover organique, scratches",
    hintEn: "Deep black, organic cover, subtle scratches",
  },
  {
    id: "prism",
    labelFr: "Prism",
    labelEn: "Prism",
    hintFr: "Zoom lent, glow, grain — clean TikTok",
    hintEn: "Slow zoom, glow, grain — clean TikTok",
  },
  {
    id: "vhs",
    labelFr: "VHS",
    labelEn: "VHS",
    hintFr: "Scanlines, aberration, nostalgia",
    hintEn: "Scanlines, chromatic drift, nostalgia",
  },
  {
    id: "particles",
    labelFr: "Particles",
    labelEn: "Particles",
    hintFr: "Particules réactives au bass",
    hintEn: "Bass-reactive floating particles",
  },
];

export function getPresetMeta(id: VisualizerPresetId): PresetMeta {
  return VISUALIZER_PRESETS.find((p) => p.id === id) ?? VISUALIZER_PRESETS[0];
}
