import { describe, expect, it } from "vitest";

import {
  deleteAtPath,
  formatPath,
  getAtPath,
  renameKey,
  setAtPath,
} from "./json-path.js";

describe("jsonPath", () => {
  const root = { a: { b: [1, 2, { c: 3 }] } };

  it("gets nested values", () => {
    expect(getAtPath(root, ["a", "b", 2, "c"])).toBe(3);
  });

  it("sets nested values immutably", () => {
    const next = setAtPath(root, ["a", "b", 0], 9);
    expect(getAtPath(next, ["a", "b", 0])).toBe(9);
    expect(getAtPath(root, ["a", "b", 0])).toBe(1);
  });

  it("deletes array items and object keys", () => {
    const withoutItem = deleteAtPath(root, ["a", "b", 1]);
    expect(getAtPath(withoutItem, ["a", "b"])).toEqual([1, { c: 3 }]);

    const withoutKey = deleteAtPath(root, ["a", "b"]);
    expect(getAtPath(withoutKey, ["a"])).toEqual({});
  });

  it("renames object keys", () => {
    const next = renameKey(root, ["a"], "b", "items");
    expect(getAtPath(next, ["a", "items", 0])).toBe(1);
  });

  it("formats paths for display", () => {
    expect(formatPath(["a", "b", 2, "c"])).toBe("$.a.b[2].c");
  });
});
