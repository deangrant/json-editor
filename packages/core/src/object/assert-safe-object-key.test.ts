import { describe, expect, it } from "vitest";

import { assertSafeObjectKey } from "./assert-safe-object-key.js";

describe("assertSafeObjectKey", () => {
  it("allows ordinary keys", () => {
    expect(() => assertSafeObjectKey("name")).not.toThrow();
    expect(() => assertSafeObjectKey("a-b")).not.toThrow();
  });

  it.each(["__proto__", "constructor", "prototype"] as const)(
    "rejects %s",
    (key) => {
      expect(() => assertSafeObjectKey(key)).toThrow(
        `Unsafe object key "${key}".`,
      );
    },
  );
});
