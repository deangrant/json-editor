import type {
  JsonPath,
  JsonValue,
} from "@json-editor/core/types/json.types.js";

/** One visible row in the flattened tree. */
export interface TreeRow {
  /** Nesting depth from the document root. */
  readonly depth: number;
  /** Whether the value can be expanded (object or array). */
  readonly expandable: boolean;
  /** Whether children of this row are currently visible. */
  readonly expanded: boolean;
  /** Property key or array index for this row, if any. */
  readonly key: string | number | undefined;
  /** Path from the document root to this value. */
  readonly path: JsonPath;
  /** JSON value rendered by this row. */
  readonly value: JsonValue;
}

/**
 * Flattens a JSON tree into visible rows based on expansion state.
 * @param root Document root.
 * @param expanded Paths that are expanded (`JSON.stringify` path keys).
 * @returns Visible tree rows.
 */
export function flattenTree(
  root: JsonValue,
  expanded: ReadonlySet<string>,
): TreeRow[] {
  const rows: TreeRow[] = [];

  const visit = (
    value: JsonValue,
    path: JsonPath,
    key: string | number | undefined,
    depth: number,
  ) => {
    const expandable = isExpandable(value);
    const pathKey = pathKeyOf(path);
    const isExpanded =
      expandable && (path.length === 0 || expanded.has(pathKey));

    rows.push({
      depth,
      expandable,
      expanded: isExpanded,
      key,
      path,
      value,
    });

    if (!(expandable && isExpanded)) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((child, index) => {
        visit(child, [...path, index], index, depth + 1);
      });
      return;
    }

    if (value !== null && typeof value === "object") {
      for (const [childKey, child] of Object.entries(value)) {
        visit(child as JsonValue, [...path, childKey], childKey, depth + 1);
      }
    }
  };

  visit(root, [], undefined, 0);
  return rows;
}

/**
 * Serializes a path for use as a set key.
 * Uses `JSON.stringify` so number indices and string keys cannot collide.
 * @param path JSON path.
 * @returns Stable path key.
 */
export function pathKeyOf(path: JsonPath): string {
  return JSON.stringify(path);
}

/**
 * Whether a value can be expanded in the tree.
 * @param value JSON value.
 * @returns True for objects and arrays.
 */
function isExpandable(value: JsonValue): boolean {
  return value !== null && typeof value === "object";
}
