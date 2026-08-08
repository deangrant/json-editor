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

  it("previews an empty array at the root path", () => {
    const result = engine.preview(
      { users: [] },
      {
        ops: [{ count: 5, type: "limit" }],
        rootPath: ["users"],
      },
    );

    expect(result).toEqual({ ok: true, value: [] });
  });

  it("fails when the root path is missing", () => {
    const result = engine.preview(root, {
      ops: [],
      rootPath: ["missing"],
    });

    expect(result).toEqual({
      message: "Root path does not exist.",
      ok: false,
    });
  });

  it("excludes mixed-type values from gt filters", () => {
    const result = engine.preview(
      {
        users: [
          { age: 36, name: "Ada" },
          { age: "50", name: "Grace" },
          { age: 41, name: "Alan" },
        ],
      },
      {
        ops: [{ field: "age", operator: "gt", type: "filter", value: 40 }],
        rootPath: ["users"],
      },
    );

    expect(result).toEqual({
      ok: true,
      value: [{ age: 41, name: "Alan" }],
    });
  });

  it("maps then picks fields", () => {
    const result = engine.preview(root, {
      ops: [
        {
          renames: [{ from: "name", to: "fullName" }],
          type: "map",
        },
        { fields: ["fullName"], type: "pick" },
        { count: 1, type: "limit" },
      ],
      rootPath: ["users"],
    });

    expect(result).toEqual({
      ok: true,
      value: [{ fullName: "Ada" }],
    });
  });

  it("returns an empty array when limit count is zero or negative", () => {
    const zero = engine.preview(root, {
      ops: [{ count: 0, type: "limit" }],
      rootPath: ["users"],
    });
    const negative = engine.preview(root, {
      ops: [{ count: -3, type: "limit" }],
      rootPath: ["users"],
    });

    expect(zero).toEqual({ ok: true, value: [] });
    expect(negative).toEqual({ ok: true, value: [] });
  });
});
