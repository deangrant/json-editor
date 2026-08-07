import { describe, expect, it } from "vitest";

import { JsonParser } from "./json-parser.js";

describe("JsonParser", () => {
  const parser = new JsonParser();

  it("parses valid JSON", () => {
    const result = parser.parse('{"a":1}');
    expect(result).toEqual({ ok: true, value: { a: 1 } });
  });

  it("returns a structured error for invalid JSON", () => {
    const result = parser.parse("{");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message.length).toBeGreaterThan(0);
    }
  });
});
