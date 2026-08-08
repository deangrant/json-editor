import { describe, expect, it } from "vitest";

import { createBannedFlagValidator } from "./custom-validators.js";

describe("createBannedFlagValidator", () => {
  const validator = createBannedFlagValidator();

  it("flags a direct banned property", () => {
    const issues = validator.validate({ banned: true });
    expect(issues).toEqual([
      {
        message: "Custom rule: `banned` must not be true.",
        path: ["banned"],
        severity: "error",
        source: "custom",
      },
    ]);
  });

  it("flags nested banned properties", () => {
    const issues = validator.validate({ outer: { banned: true } });
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toEqual(["outer", "banned"]);
  });

  it("flags banned properties inside arrays", () => {
    const issues = validator.validate([{ banned: true }, {}]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toEqual([0, "banned"]);
  });

  it("ignores non-true banned values and primitives", () => {
    expect(validator.validate({ banned: false })).toEqual([]);
    expect(validator.validate({ other: true })).toEqual([]);
    expect(validator.validate(null)).toEqual([]);
    expect(validator.validate("banned")).toEqual([]);
    expect(validator.validate(1)).toEqual([]);
  });
});
