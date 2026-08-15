import { assertSafeObjectKey } from "../object/assert-safe-object-key.js";
import type {
  JsonPath,
  JsonPathSegment,
  JsonValue,
} from "../types/json.types.js";

const IDENTIFIER_SEGMENT = /^[A-Za-z_$][\w$]*$/;

/**
 * Reads the value at `path` within `root`.
 * @param root Document root.
 * @param path Path from the root.
 * @returns The value, or `undefined` if the path does not exist.
 */
export function getAtPath(
  root: JsonValue,
  path: JsonPath,
): JsonValue | undefined {
  let current: JsonValue | undefined = root;

  for (const segment of path) {
    if (current === undefined || current === null) {
      return;
    }

    if (typeof segment === "number") {
      if (!Array.isArray(current)) {
        return;
      }
      current = current[segment];
      continue;
    }

    if (typeof current !== "object" || Array.isArray(current)) {
      return;
    }

    current = current[segment];
  }

  return current;
}

/**
 * Returns a deep clone of `root` with `value` written at `path`.
 * Missing object parents are created; array parents must already exist.
 * Array indices must be integers in `0..length` (inclusive for append).
 * @param root Document root.
 * @param path Path from the root.
 * @param value Value to write.
 * @returns Updated document root.
 * @throws If an array index is negative, non-integer, or greater than length.
 */
export function setAtPath(
  root: JsonValue,
  path: JsonPath,
  value: JsonValue,
): JsonValue {
  if (path.length === 0) {
    return value;
  }

  return setAtPathMutable(structuredClone(root), path, value);
}

/**
 * Returns a deep clone of `root` with the value at `path` removed.
 * @param root Document root.
 * @param path Path from the root.
 * @returns Updated document root.
 */
export function deleteAtPath(root: JsonValue, path: JsonPath): JsonValue {
  if (path.length === 0) {
    throw new Error("Cannot delete the document root.");
  }

  const clone = structuredClone(root);
  const parentPath = path.slice(0, -1);
  const key = path.at(-1);
  if (key === undefined) {
    throw new Error("Path is empty.");
  }

  const parent = parentPath.length === 0 ? clone : getAtPath(clone, parentPath);
  if (parent === undefined || parent === null) {
    return clone;
  }

  if (typeof key === "number") {
    if (!Array.isArray(parent)) {
      return clone;
    }
    parent.splice(key, 1);
    return clone;
  }

  if (typeof parent !== "object" || Array.isArray(parent)) {
    return clone;
  }

  delete parent[key];
  return clone;
}

/**
 * Renames an object key at `parentPath` from `fromKey` to `toKey`.
 * @param root Document root.
 * @param parentPath Path to the parent object.
 * @param fromKey Existing key.
 * @param toKey New key.
 * @returns Updated document root.
 * @throws If `toKey` already exists on the parent object.
 */
export function renameKey(
  root: JsonValue,
  parentPath: JsonPath,
  fromKey: string,
  toKey: string,
): JsonValue {
  if (fromKey === toKey) {
    return root;
  }

  assertSafeObjectKey(toKey);

  const clone = structuredClone(root);
  const parent = parentPath.length === 0 ? clone : getAtPath(clone, parentPath);

  if (
    parent === undefined ||
    parent === null ||
    typeof parent !== "object" ||
    Array.isArray(parent)
  ) {
    return clone;
  }

  if (!(fromKey in parent)) {
    return clone;
  }

  if (toKey in parent) {
    throw new Error(`Cannot rename to existing key "${toKey}".`);
  }

  const value = parent[fromKey];
  delete parent[fromKey];
  parent[toKey] = value as JsonValue;
  return clone;
}

/**
 * Formats a path as a dotted/bracket string for display.
 * @param path JSON path.
 * @returns Human-readable path string.
 */
export function formatPath(path: JsonPath): string {
  if (path.length === 0) {
    return "$";
  }

  return path.reduce<string>((acc, segment) => {
    if (typeof segment === "number") {
      return `${acc}[${segment}]`;
    }
    if (IDENTIFIER_SEGMENT.test(segment)) {
      return acc === "$" ? `$.${segment}` : `${acc}.${segment}`;
    }
    return `${acc}[${JSON.stringify(segment)}]`;
  }, "$");
}

/**
 * Writes `value` into a mutable tree at `path`.
 * @param root Mutable document root.
 * @param path Path from the root.
 * @param value Value to write.
 * @returns The mutated root.
 */
function setAtPathMutable(
  root: JsonValue,
  path: JsonPath,
  value: JsonValue,
): JsonValue {
  let current: JsonValue = root;

  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index] as JsonPathSegment;
    const nextSegment = path[index + 1] as JsonPathSegment;
    current = descendForWrite(current, segment, nextSegment);
  }

  writeLeaf(current, path.at(-1), value);
  return root;
}

/**
 * Ensures and returns the child container at `segment`.
 * @param current Current node.
 * @param segment Path segment.
 * @param nextSegment Following segment (controls array vs object creation).
 * @returns Child node.
 */
function descendForWrite(
  current: JsonValue,
  segment: JsonPathSegment,
  nextSegment: JsonPathSegment,
): JsonValue {
  const emptyChild: JsonValue = typeof nextSegment === "number" ? [] : {};

  if (typeof segment === "number") {
    if (!Array.isArray(current)) {
      throw new Error(`Expected array at segment ${String(segment)}.`);
    }
    assertWritableArrayIndex(segment, current.length);
    const child = current[segment] ?? emptyChild;
    current[segment] = child;
    return child;
  }

  if (
    current === null ||
    typeof current !== "object" ||
    Array.isArray(current)
  ) {
    throw new Error(`Expected object at segment ${segment}.`);
  }

  const child = current[segment] ?? emptyChild;
  assertSafeObjectKey(segment);
  current[segment] = child;
  return child;
}

/**
 * Writes a leaf value onto the current node.
 * @param current Parent node.
 * @param last Final path segment.
 * @param value Value to write.
 */
function writeLeaf(
  current: JsonValue,
  last: JsonPathSegment | undefined,
  value: JsonValue,
): void {
  if (last === undefined) {
    return;
  }

  if (typeof last === "number") {
    if (!Array.isArray(current)) {
      throw new Error("Expected array at write target.");
    }
    assertWritableArrayIndex(last, current.length);
    current[last] = value;
    return;
  }

  if (
    current === null ||
    typeof current !== "object" ||
    Array.isArray(current)
  ) {
    throw new Error("Expected object at write target.");
  }

  assertSafeObjectKey(last);
  current[last] = value;
}

/**
 * Ensures an array index is a non-negative integer within `0..length`.
 * @param index Candidate array index.
 * @param length Current array length.
 */
function assertWritableArrayIndex(index: number, length: number): void {
  if (!Number.isInteger(index) || index < 0 || index > length) {
    throw new Error(
      `Array index ${String(index)} is out of range for length ${String(length)}.`,
    );
  }
}
