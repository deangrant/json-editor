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

  it("throws when Ajv cannot compile the schema", () => {
    expect(
      () =>
        new SchemaValidator({
          type: "not-a-valid-json-schema-type",
        }),
    ).toThrow();
  });

  it("fails closed for invalid data against a valid schema", () => {
    const validator = new SchemaValidator({ type: "string" });
    const issues = validator.validate({ not: "a string" });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every((issue) => issue.severity === "error")).toBe(true);
  });

  it("merges schema and custom issues in one validate call", () => {
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
      new SchemaValidator({
        properties: { name: { type: "string" } },
        required: ["name"],
        type: "object",
      }),
      custom,
    ]);

    const issues = composite.validate({ banned: true, name: 1 });
    expect(issues.some((issue) => issue.source === "schema")).toBe(true);
    expect(issues.some((issue) => issue.source === "custom")).toBe(true);
    expect(issues.length).toBeGreaterThanOrEqual(2);
  });
});
