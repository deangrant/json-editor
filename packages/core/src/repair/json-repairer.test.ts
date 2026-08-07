import { describe, expect, it } from "vitest";

import { JsonParser } from "../parse/json-parser.js";
import { JsonRepairer } from "./json-repairer.js";

describe("JsonRepairer", () => {
  const repairer = new JsonRepairer();
  const parser = new JsonParser();

  it("repairs trailing commas", () => {
    const result = repairer.repair('{"a":1,}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(parser.parse(result.text)).toEqual({
        ok: true,
        value: { a: 1 },
      });
    }
  });
});
