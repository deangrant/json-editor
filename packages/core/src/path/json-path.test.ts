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

  it("appends at array length", () => {
    const next = setAtPath(root, ["a", "b", 3], 4);
    expect(getAtPath(next, ["a", "b"])).toEqual([1, 2, { c: 3 }, 4]);
  });

  it("rejects array indices beyond length", () => {
    expect(() => setAtPath(root, ["a", "b", 4], 9)).toThrow("out of range");
  });

  it("rejects negative array indices", () => {
    expect(() => setAtPath(root, ["a", "b", -1], 9)).toThrow("out of range");
  });

  it("rejects non-integer array indices", () => {
    expect(() => setAtPath(root, ["a", "b", 1.5], 9)).toThrow("out of range");
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

  it("throws when renaming onto an existing key", () => {
    expect(() => renameKey({ a: 1, b: 2 }, [], "a", "b")).toThrow(
      'Cannot rename to existing key "b".',
    );
  });

  it("formats paths for display", () => {
    expect(formatPath(["a", "b", 2, "c"])).toBe("$.a.b[2].c");
  });

  it("throws when deleting the document root", () => {
    expect(() => deleteAtPath(root, [])).toThrow(
      "Cannot delete the document root.",
    );
  });

  it("formats special keys and the empty path", () => {
    expect(formatPath([])).toBe("$");
    expect(formatPath(["a-b", ""])).toBe('$["a-b"][""]');
    expect(formatPath(["with space"])).toBe('$["with space"]');
  });

  it("creates missing mid-path object parents when setting", () => {
    const next = setAtPath({}, ["nested", "leaf"], 1);
    expect(next).toEqual({ nested: { leaf: 1 } });
  });
});
