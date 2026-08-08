import { describe, expect, it } from "vitest";

import { TransformEngine } from "./transform-engine.js";

describe("TransformEngine", () => {
  const engine = new TransformEngine();
  const root = {
    users: [
      { age: 36, name: "Ada" },
      { age: 45, name: "Grace" },
      { age: 41, name: "Alan" },
    ],
  };

  it("filters, sorts, picks, and limits", () => {
    const result = engine.preview(root, {
      ops: [
        { field: "age", operator: "gte", type: "filter", value: 40 },
        { direction: "asc", field: "name", type: "sort" },
        { fields: ["name"], type: "pick" },
        { count: 2, type: "limit" },
      ],
      rootPath: ["users"],
    });

    expect(result).toEqual({
      ok: true,
      value: [{ name: "Alan" }, { name: "Grace" }],
    });
  });

  it("excludes mixed-type values from ordered filters", () => {
    const result = engine.preview(
      {
        users: [
          { age: 36, name: "Ada" },
          { age: "45", name: "Grace" },
          { age: 41, name: "Alan" },
        ],
      },
      {
        ops: [{ field: "age", operator: "gte", type: "filter", value: 40 }],
        rootPath: ["users"],
      },
    );

    expect(result).toEqual({
      ok: true,
      value: [{ age: 41, name: "Alan" }],
    });
  });

  it("applies map renames back to the document", () => {
    const result = engine.apply(root, {
      ops: [
        {
          renames: [{ from: "name", to: "fullName" }],
          type: "map",
        },
        { count: 1, type: "limit" },
      ],
      rootPath: ["users"],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        users: [{ age: 36, fullName: "Ada" }],
      });
    }
  });
});
