import { describe, expect, it } from "vitest";
import { isPlayableCommunityRow } from "./communityPlaybackUtils";

describe("isPlayableCommunityRow", () => {
  it("returns true when audio_url is http", () => {
    expect(
      isPlayableCommunityRow({
        audio_url: "https://cdn.example.com/loop.mp3",
        stems_url: null,
      }),
    ).toBe(true);
  });

  it("returns true when stems ace has httpAudioUrl", () => {
    expect(
      isPlayableCommunityRow({
        audio_url: null,
        stems_url: { ace: { httpAudioUrl: "https://cdn.example.com/ace.mp3" } },
      }),
    ).toBe(true);
  });

  it("returns true when ace task id is present", () => {
    expect(
      isPlayableCommunityRow({
        audio_url: null,
        stems_url: { ace: { taskId: "task-abc" } },
      }),
    ).toBe(true);
  });

  it("returns false when no audio and no ace task", () => {
    expect(
      isPlayableCommunityRow({
        audio_url: null,
        stems_url: null,
      }),
    ).toBe(false);
  });
});
