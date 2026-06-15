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
    hintFr: "Mesh animé, cover centrée, waveform cyan",
    hintEn: "Animated mesh, centered cover, cyan wave",
  },
  {
    id: "vhs",
    labelFr: "VHS",
    labelEn: "VHS",
    hintFr: "Écran camcorder 4:3, REC, scanlines",
    hintEn: "4:3 camcorder screen, REC, scanlines",
  },
  {
    id: "particles",
    labelFr: "Particles",
    labelEn: "Particles",
    hintFr: "Particules réactives au bass",
    hintEn: "Bass-reactive floating particles",
  },
  {
    id: "sleeve",
    labelFr: "Pochette",
    labelEn: "Sleeve",
    hintFr: "Cover centrée, fond mood animé, effet CD",
    hintEn: "Centered cover, animated mood bg, CD case",
  },
];

export function getPresetMeta(id: VisualizerPresetId): PresetMeta {
  return VISUALIZER_PRESETS.find((p) => p.id === id) ?? VISUALIZER_PRESETS[0];
}
