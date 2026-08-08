import { describe, expect, it } from "vitest";

import { pathKeyOf } from "./tree-flatten.js";

describe("pathKeyOf", () => {
  it('distinguishes array index 0 from object key "0"', () => {
    expect(pathKeyOf([0])).not.toBe(pathKeyOf(["0"]));
  });

  it("keeps keys with special characters unique", () => {
    expect(pathKeyOf(["a\u0001b"])).not.toBe(pathKeyOf(["a", "b"]));
    expect(pathKeyOf(['a"b'])).not.toBe(pathKeyOf(["a", "b"]));
  });

  it("serializes the empty path stably", () => {
    expect(pathKeyOf([])).toBe("[]");
  });
});
