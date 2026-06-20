import { describe, expect, it } from "vitest";
import { buildTrackLicenseDocument, resolveLicenseHolder } from "./commercialLicenseDocument";

describe("resolveLicenseHolder", () => {
  it("prefers legal name when set", () => {
    expect(
      resolveLicenseHolder({
        legal_first_name: "Alex",
        legal_last_name: "Martin",
        username: "beatmaker",
      }),
    ).toEqual({ name: "Alex Martin", source: "legal" });
  });

  it("falls back to username without legal name", () => {
    expect(
      resolveLicenseHolder({
        legal_first_name: null,
        legal_last_name: null,
        username: "nightdrive",
      }),
    ).toEqual({ name: "nightdrive", source: "username" });
  });

  it("falls back to email local part", () => {
    expect(
      resolveLicenseHolder(
        { legal_first_name: null, legal_last_name: null, username: "" },
        { email: "producer.hit@gmail.com" },
      ),
    ).toEqual({ name: "producer hit", source: "email" });
  });
});

describe("buildTrackLicenseDocument", () => {
  it("builds a paid-plan certificate without legal name", () => {
    const doc = buildTrackLicenseDocument({
      loopId: "29cf75b7-0a03-4758-b409-165d9fcfca3e",
      trackTitle: "Midnight Drive",
      plan: "pro",
      profile: { legal_first_name: null, legal_last_name: null, username: "vibez" },
      locale: "en",
      exportKind: "beat",
    });

    expect(doc?.holderName).toBe("vibez");
    expect(doc?.holderSource).toBe("username");
    expect(doc?.licenseId).toMatch(/^PH-PRO-/);
  });
});
