import { describe, expect, it } from "vitest";
import {
  canDistribute,
  canViewDistributionRoyalties,
  distributionMonthlyQuota,
} from "@producerhit/shared";

describe("distribution entitlements", () => {
  it("blocks free and pro from distribution", () => {
    expect(canDistribute("free")).toBe(false);
    expect(canDistribute("pro")).toBe(false);
    expect(distributionMonthlyQuota("free")).toBe(0);
    expect(distributionMonthlyQuota("pro")).toBe(0);
  });

  it("allows studio and plus with quotas", () => {
    expect(canDistribute("studio")).toBe(true);
    expect(canDistribute("plus")).toBe(true);
    expect(distributionMonthlyQuota("studio")).toBe(2);
    expect(distributionMonthlyQuota("plus")).toBe(5);
  });

  it("royalties export gated to plus", () => {
    expect(canViewDistributionRoyalties("studio")).toBe(false);
    expect(canViewDistributionRoyalties("plus")).toBe(true);
  });
});

describe("suggestLabelGridGenreName", () => {
  it("maps known genres", async () => {
    const { suggestLabelGridGenreName } = await import("@producerhit/shared");
    expect(suggestLabelGridGenreName("Dark Trap")).toBe("Hip Hop");
    expect(suggestLabelGridGenreName("")).toBe("Electronic");
  });
});
