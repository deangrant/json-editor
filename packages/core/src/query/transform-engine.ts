import { assertSafeObjectKey } from "../object/assert-safe-object-key.js";
import { getAtPath, setAtPath } from "../path/json-path.js";
import type { JsonValue } from "../types/json.types.js";
import type { ITransformEngine } from "./i-transform-engine.js";
import type {
  FilterOp,
  MapOp,
  PickOp,
  SortOp,
  TransformOp,
  TransformProgram,
  TransformResult,
} from "./transform.types.js";

/**
 * Executes the built-in filter/map/sort/pick/limit transform DSL.
 */
export class TransformEngine implements ITransformEngine {
  /**
   * Applies `program` and returns the full updated document.
   * @param root Document root.
   * @param program Transform program.
   * @returns Updated root, or an error message.
   */
  apply(root: JsonValue, program: TransformProgram): TransformResult {
    const preview = this.preview(root, program);
    if (!preview.ok) {
      return preview;
    }

    try {
      return {
        ok: true,
        value: setAtPath(root, program.rootPath, preview.value),
      };
    } catch (cause) {
      return {
        message: cause instanceof Error ? cause.message : String(cause),
        ok: false,
      };
    }
  }

  /**
   * Previews the value at `program.rootPath` after ops.
   * @param root Document root.
   * @param program Transform program.
   * @returns Transformed subtree, or an error message.
   */
  preview(root: JsonValue, program: TransformProgram): TransformResult {
    const target = getAtPath(root, program.rootPath);
    if (target === undefined) {
      return { message: "Root path does not exist.", ok: false };
    }
    if (!Array.isArray(target)) {
      return {
        message: "Transform root must be an array.",
        ok: false,
      };
    }

    try {
      let current: JsonValue[] = structuredClone(target);
      for (const op of program.ops) {
        current = applyOp(current, op);
      }
      return { ok: true, value: current };
    } catch (cause) {
      return {
        message: cause instanceof Error ? cause.message : String(cause),
        ok: false,
      };
    }
  }
}

/**
 * Applies a single transform op to an array.
 * @param items Current array items.
 * @param op Transform operation.
 * @returns Updated array.
 */
function applyOp(items: JsonValue[], op: TransformOp): JsonValue[] {
  switch (op.type) {
    case "filter":
      return items.filter((item) => matchesFilter(item, op));
    case "sort":
      return sortItems(items, op);
    case "pick":
      return items.map((item) => pickFields(item, op));
    case "map":
      return items.map((item) => mapFields(item, op));
    case "limit":
      return items.slice(0, Math.max(0, op.count));
    default: {
      const _exhaustive: never = op;
      return _exhaustive;
    }
  }
}

/**
 * Evaluates a filter predicate against one array item.
 * @param item Array item.
 * @param op Filter operation.
 * @returns Whether the item matches.
 */
function matchesFilter(item: JsonValue, op: FilterOp): boolean {
  if (item === null || typeof item !== "object" || Array.isArray(item)) {
    return false;
  }

  const fieldValue = item[op.field];

  switch (op.operator) {
    case "exists":
      return fieldValue !== undefined;
    case "eq":
      return fieldValue === op.value;
    case "neq":
      return fieldValue !== op.value;
    case "gt": {
      const ordering = compare(fieldValue, op.value);
      return ordering !== undefined && ordering > 0;
    }
    case "gte": {
      const ordering = compare(fieldValue, op.value);
      return ordering !== undefined && ordering >= 0;
    }
    case "lt": {
      const ordering = compare(fieldValue, op.value);
      return ordering !== undefined && ordering < 0;
    }
    case "lte": {
      const ordering = compare(fieldValue, op.value);
      return ordering !== undefined && ordering <= 0;
    }
    case "contains":
      return (
        typeof fieldValue === "string" &&
        typeof op.value === "string" &&
        fieldValue.includes(op.value)
      );
    default: {
      const _exhaustive: never = op.operator;
      return _exhaustive;
    }
  }
}

/**
 * Compares two JSON values for ordering.
 * @param left Left operand.
 * @param right Right operand.
 * @returns Negative, zero, or positive when comparable; otherwise `undefined`.
 */
function compare(
  left: JsonValue | undefined,
  right: JsonValue | undefined,
): number | undefined {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }
  if (typeof left === "string" && typeof right === "string") {
    return left.localeCompare(right);
  }
}

/**
 * Sorts array items by a field.
 * @param items Array items.
 * @param op Sort operation.
 * @returns Sorted copy.
 */
function sortItems(items: JsonValue[], op: SortOp): JsonValue[] {
  const copy = [...items];
  copy.sort((a, b) => {
    const left =
      a !== null && typeof a === "object" && !Array.isArray(a)
        ? a[op.field]
        : undefined;
    const right =
      b !== null && typeof b === "object" && !Array.isArray(b)
        ? b[op.field]
        : undefined;
    const result = compare(left, right) ?? 0;
    return op.direction === "asc" ? result : -result;
  });
  return copy;
}

/**
 * Keeps only listed fields on an object item.
 * @param item Array item.
 * @param op Pick operation.
 * @returns Picked object, or the original item if not an object.
 */
function pickFields(item: JsonValue, op: PickOp): JsonValue {
  if (item === null || typeof item !== "object" || Array.isArray(item)) {
    return item;
  }
  const next: { [key: string]: JsonValue } = {};
  for (const field of op.fields) {
    assertSafeObjectKey(field);
    if (field in item) {
      next[field] = item[field] as JsonValue;
    }
  }
  return next;
}

/**
 * Renames fields on an object item.
 * @param item Array item.
 * @param op Map operation.
 * @returns Remapped object, or the original item if not an object.
 */
function mapFields(item: JsonValue, op: MapOp): JsonValue {
  if (item === null || typeof item !== "object" || Array.isArray(item)) {
    return item;
  }
  const next: { [key: string]: JsonValue } = { ...item };
  for (const { from, to } of op.renames) {
    assertSafeObjectKey(to);
    if (from in next) {
      next[to] = next[from] as JsonValue;
      if (from !== to) {
        delete next[from];
      }
    }
  }
  return next;
}
