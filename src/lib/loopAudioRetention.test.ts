import { describe, expect, it } from "vitest";
import type { Loop } from "@/types/loop";
import { summarizeHostedAudioRetention } from "@/lib/loopAudioRetention";

function makeLoop(overrides: Partial<Loop> & { id: string }): Loop {
  return {
    id: overrides.id,
    name: overrides.name ?? "Test",
    genre: "Trap",
    influence: "Auto",
    key: "C",
    scale: "Minor",
    bpm: 140,
    loopLength: "8 bars",
    swing: 0,
    mood: "Dark",
    energyLevel: "Medium",
    reverb: "Low",
    prompt: "test",
    audioUrl: overrides.audioUrl ?? "https://pmfnzenqemnonpglmjqx.supabase.co/storage/v1/object/public/loop-audio/user/loop.mp3",
    isSaved: false,
    isPublic: false,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    ...overrides,
  };
}

describe("summarizeHostedAudioRetention", () => {
  const now = Date.parse("2026-06-25T12:00:00.000Z");
  const expiredAt = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();
  const freshAt = new Date(now - 60 * 60 * 1000).toISOString();

  it("returns null for Plus plan", () => {
    const loops = [makeLoop({ id: "1", createdAt: expiredAt })];
    expect(summarizeHostedAudioRetention(loops, { plan: "plus" })).toBeNull();
  });

  it("ignores non-hosted audio URLs", () => {
    const loops = [
      makeLoop({
        id: "1",
        createdAt: expiredAt,
        audioUrl: "https://cdn.example.com/track.mp3",
      }),
    ];
    expect(summarizeHostedAudioRetention(loops, { plan: "studio" })).toBeNull();
  });

  it("counts expired hosted tracks on studio plan", () => {
    const loops = [
      makeLoop({ id: "1", createdAt: expiredAt }),
      makeLoop({ id: "2", createdAt: freshAt }),
    ];
    const summary = summarizeHostedAudioRetention(loops, { plan: "studio" }, now);
    expect(summary?.expired).toBe(1);
    expect(summary?.expiring).toBe(0);
  });
});
