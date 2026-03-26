import { describe, expect, it } from "vitest";
import { safeDecodeURIComponent } from "./safeDecode";

describe("safeDecodeURIComponent", () => {
  it("decodes valid URI components", () => {
    expect(safeDecodeURIComponent("hello%20world")).toBe("hello world");
  });

  it("returns explicit fallback on malformed encoding", () => {
    expect(safeDecodeURIComponent("%E0%A4%A", "")).toBe("");
  });

  it("returns input by default when decode fails", () => {
    expect(safeDecodeURIComponent("%E0%A4%A")).toBe("%E0%A4%A");
  });
});
