import { describe, expect, it } from "vitest";

import { JsonFormatter } from "./json-formatter.js";

describe("JsonFormatter", () => {
  const formatter = new JsonFormatter();

  it("beautifies with indentation", () => {
    expect(formatter.beautify({ a: 1 }, 2)).toBe('{\n  "a": 1\n}\n');
  });

  it("compacts without whitespace", () => {
    expect(formatter.compact({ a: 1 })).toBe('{"a":1}');
  });
});
