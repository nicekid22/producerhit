/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  markAudioRetentionDailyNoticeShown,
  shouldShowAudioRetentionDailyNotice,
} from "@/lib/audioRetentionDailyNotice";
import { CheckoutRecoveryBanner } from "@/components/billing/CheckoutRecoveryBanner";
import { FreeUpgradeStrip } from "@/components/billing/FreeUpgradeStrip";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: (selector: (s: { user: null }) => unknown) => selector({ user: null }),
}));

vi.mock("@/lib/supabaseClient", () => ({
  trackClientEvent: vi.fn(),
}));

vi.mock("@/lib/checkoutRecovery", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/checkoutRecovery")>();
  return {
    ...actual,
    syncCheckoutAbandonNurture: vi.fn(),
  };
});

describe("audioRetentionDailyNotice throttle", () => {
  const userId = "user-123";
  const dateKey = "2026-06-25";

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("allows notice when not shown today", () => {
    expect(shouldShowAudioRetentionDailyNotice(userId, dateKey)).toBe(true);
  });

  it("blocks notice after mark shown for same day", () => {
    markAudioRetentionDailyNoticeShown(userId, dateKey);
    expect(shouldShowAudioRetentionDailyNotice(userId, dateKey)).toBe(false);
  });

  it("allows notice again on a new day", () => {
    markAudioRetentionDailyNoticeShown(userId, dateKey);
    expect(shouldShowAudioRetentionDailyNotice(userId, "2026-06-26")).toBe(true);
  });
});

describe("CheckoutRecoveryBanner planReady", () => {
  beforeEach(() => {
    localStorage.setItem(
      "producerhit_checkout_abandoned_v1",
      JSON.stringify({
        plan: "pro",
        ts: Date.now(),
        location: "test",
      }),
    );
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("does not render when planReady is false", () => {
    const { container } = render(
      <CheckoutRecoveryBanner locale="fr" location="test" planReady={false} currentPlan="studio" />,
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText(/reprendre/i)).toBeNull();
  });

  it("does not render when user already has the abandoned plan", () => {
    localStorage.setItem(
      "producerhit_checkout_abandoned_v1",
      JSON.stringify({ plan: "plus", ts: Date.now(), location: "test" }),
    );
    const { container } = render(
      <CheckoutRecoveryBanner locale="fr" location="test" planReady currentPlan="plus" />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("FreeUpgradeStrip ready", () => {
  it("does not render when ready is false even for free plan", () => {
    const { container } = render(
      <FreeUpgradeStrip locale="fr" location="test" plan="free" ready={false} />,
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText(/Pro/i)).toBeNull();
  });
});
