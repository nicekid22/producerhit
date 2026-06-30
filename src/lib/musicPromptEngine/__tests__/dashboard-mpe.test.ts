import { describe, it, expect, vi, beforeEach } from "vitest";

const buildDashboardSection = vi.fn(() => ({
  ideaPromptDiceHint: "hint",
  acePreviewEnable: "Enable preview",
  acePreviewTitle: "ACE preview",
  ideaPromptHint: "hint",
  newTrack: "New track",
}));
const resolveGenerationCaptionContext = vi.fn(() => ({
  bankGenre: undefined,
  lyricsStructure: "",
  captionOverride: "",
}));

vi.mock("@/i18n/dashboardCatalog", () => ({
  buildDashboardSection,
}));
vi.mock("@/lib/promptEnhancer", () => ({
  resolveGenerationCaptionContext,
}));

describe("Dashboard MPE integration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("buildAceStepPrompt should be callable from dashboard like code", async () => {
    const { buildAceStepPrompt } = await import("@/lib/musicPromptEngine/musicPromptEngine");
    const result = await buildAceStepPrompt("hip-hop vacances Las Vegas", {
      duration: 180,
      language: "French",
      debug: true,
    });
    expect(result).toBeTruthy();
    expect(result?.caption).toBeTruthy();
    expect(typeof result?.bpm).toBe("number");
    expect(typeof result?.key).toBe("string");
  });
});
