import { describe, expect, it } from "vitest";

import { CompositeValidator } from "./composite-validator.js";
import type { IJsonValidator } from "./i-json-validator.js";
import { SchemaValidator } from "./schema-validator.js";

describe("SchemaValidator", () => {
  it("reports schema errors", () => {
    const validator = new SchemaValidator({
      properties: { name: { type: "string" } },
      required: ["name"],
      type: "object",
    });

    const issues = validator.validate({ name: 1 });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.source).toBe("schema");
  });

  it("merges custom validators", () => {
    const custom: IJsonValidator = {
      validate: (data) => {
        if (
          data !== null &&
          typeof data === "object" &&
          !Array.isArray(data) &&
          data.banned === true
        ) {
          return [
            {
              message: "banned flag is set",
              path: ["banned"],
              severity: "error",
              source: "custom",
            },
          ];
        }
        return [];
      },
    };

    const composite = new CompositeValidator([
      new SchemaValidator({ type: "object" }),
      custom,
    ]);

    expect(composite.validate({ banned: true })).toHaveLength(1);
  });
});
