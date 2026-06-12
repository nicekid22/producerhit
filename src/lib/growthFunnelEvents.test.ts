/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const trackClientEvent = vi.fn();

vi.mock("@/lib/supabaseClient", () => ({
  trackClientEvent: (...args: unknown[]) => trackClientEvent(...args),
}));

describe("growthFunnelEvents", () => {
  beforeEach(() => {
    trackClientEvent.mockClear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("trackFunnelOnce n'envoie qu'une fois par session", async () => {
    const { trackFunnelOnce } = await import("@/lib/growthFunnelEvents");
    trackFunnelOnce("landing_view", { locale: "fr" });
    trackFunnelOnce("landing_view", { locale: "en" });
    expect(trackClientEvent).toHaveBeenCalledTimes(1);
    expect(trackClientEvent).toHaveBeenCalledWith("landing_view", { locale: "fr" });
  });

  it("trackDashboardReady et trackFirstAudioPlay sont distincts", async () => {
    const { trackDashboardReady, trackFirstAudioPlay } = await import("@/lib/growthFunnelEvents");
    trackDashboardReady({ load_ms: 1200 });
    trackFirstAudioPlay({ loop_id: "abc" });
    expect(trackClientEvent).toHaveBeenCalledTimes(2);
  });
});
