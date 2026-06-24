import { describe, expect, it } from "vitest";
import { mapLabelGridStatusToLocal } from "@/lib/distributionStatusMap";

describe("mapLabelGridStatusToLocal", () => {
  it("maps live statuses", () => {
    expect(mapLabelGridStatusToLocal("live")).toBe("live");
    expect(mapLabelGridStatusToLocal("published")).toBe("live");
  });

  it("maps review statuses", () => {
    expect(mapLabelGridStatusToLocal("in_review")).toBe("in_review");
    expect(mapLabelGridStatusToLocal("pending")).toBe("in_review");
  });

  it("maps rejected statuses", () => {
    expect(mapLabelGridStatusToLocal("rejected")).toBe("rejected");
    expect(mapLabelGridStatusToLocal("failed")).toBe("rejected");
  });
});
