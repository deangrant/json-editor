import { describe, expect, it } from "vitest";

import { flattenTree, pathKeyOf } from "./tree-flatten.js";

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

describe("flattenTree", () => {
  it("always expands the root when expandable", () => {
    const rows = flattenTree({ a: 1 }, new Set());
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      depth: 0,
      expandable: true,
      expanded: true,
      key: undefined,
      path: [],
    });
    expect(rows[1]).toMatchObject({
      depth: 1,
      expandable: false,
      key: "a",
      path: ["a"],
      value: 1,
    });
  });

  it("includes children only for paths in the expansion set", () => {
    const root = { a: { b: 1 }, c: 2 };
    const collapsedChild = flattenTree(root, new Set());
    expect(collapsedChild.map((row) => row.path)).toEqual([[], ["a"], ["c"]]);

    const expanded = flattenTree(root, new Set([pathKeyOf(["a"])]));
    expect(expanded.map((row) => row.path)).toEqual([
      [],
      ["a"],
      ["a", "b"],
      ["c"],
    ]);
    expect(expanded[2]).toMatchObject({
      depth: 2,
      key: "b",
      value: 1,
    });
  });

  it("marks scalars as non-expandable", () => {
    for (const value of ["x", 1, true, null] as const) {
      const rows = flattenTree(value, new Set());
      expect(rows).toHaveLength(1);
      expect(rows[0]?.expandable).toBe(false);
      expect(rows[0]?.expanded).toBe(false);
    }
  });

  it("hides descendants when a parent is collapsed", () => {
    const root = { items: [{ name: "Ada" }] };
    const rows = flattenTree(root, new Set([pathKeyOf(["items"])]));
    expect(rows.map((row) => row.path)).toEqual([[], ["items"], ["items", 0]]);

    const collapsed = flattenTree(root, new Set());
    expect(collapsed.map((row) => row.path)).toEqual([[], ["items"]]);
  });
});
