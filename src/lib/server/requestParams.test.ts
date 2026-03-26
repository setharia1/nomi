import { describe, expect, it } from "vitest";
import {
  MAX_OPERATION_NAME_LENGTH,
  parseOperationNameParam,
  safeDecodeURIComponent,
} from "@/lib/server/requestParams";

describe("safeDecodeURIComponent", () => {
  it("returns decoded value for valid escaped input", () => {
    expect(safeDecodeURIComponent("ops%2Fjob-123")).toBe("ops/job-123");
  });

  it("returns fallback for malformed escapes", () => {
    expect(safeDecodeURIComponent("%E0%A4%A", "")).toBe("");
  });
});

describe("parseOperationNameParam", () => {
  it("accepts valid operation names", () => {
    expect(parseOperationNameParam("operations%2Fabc-123")).toBe("operations/abc-123");
  });

  it("rejects null and blank names", () => {
    expect(parseOperationNameParam(null)).toBeNull();
    expect(parseOperationNameParam("   ")).toBeNull();
  });

  it("rejects malformed percent-encoding", () => {
    expect(parseOperationNameParam("%E0%A4%A")).toBeNull();
  });

  it("rejects names with disallowed characters", () => {
    expect(parseOperationNameParam("operations/abc?x=1")).toBeNull();
    expect(parseOperationNameParam("../../../etc/passwd")).toBeNull();
  });

  it("rejects names longer than limit", () => {
    const long = `ops/${"a".repeat(MAX_OPERATION_NAME_LENGTH + 1)}`;
    expect(parseOperationNameParam(encodeURIComponent(long))).toBeNull();
  });
});
