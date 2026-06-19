import { describe, expect, it } from "vitest";
import { parseBlogListItemLink } from "./blogListItemLink";

describe("parseBlogListItemLink", () => {
  it("parses arrow format", () => {
    expect(parseBlogListItemLink("Guide → /blog/foo")).toEqual({
      label: "Guide",
      href: "/blog/foo",
    });
  });

  it("returns null href for plain text", () => {
    expect(parseBlogListItemLink("No link here")).toEqual({
      label: "No link here",
      href: null,
    });
  });
});
