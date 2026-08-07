import { describe, expect, it } from "vitest";

import { detectValue, formatTimestamp } from "./value-detect.js";

describe("detectValue", () => {
  it("detects hex colors", () => {
    expect(detectValue("#0af")).toEqual({
      hex: "#00aaff",
      kind: "color",
    });
  });

  it("detects unix timestamps", () => {
    expect(detectValue(1_700_000_000)).toEqual({
      epochMs: 1_700_000_000_000,
      kind: "timestamp",
      unit: "s",
    });
  });

  it("formats timestamps", () => {
    const text = formatTimestamp(0, "en-US");
    expect(text.length).toBeGreaterThan(0);
  });
});
