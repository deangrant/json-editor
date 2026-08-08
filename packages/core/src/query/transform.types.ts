import type { JsonPath, JsonValue } from "../types/json.types.js";

/** Comparison operators for filter predicates. */
export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "exists";

/** Keep items where a field matches a predicate. */
export interface FilterOp {
  /** Object field name evaluated on each array item. */
  readonly field: string;
  /** Comparison operator applied to the field value. */
  readonly operator: FilterOperator;
  /** Discriminant for filter operations. */
  readonly type: "filter";
  /** Right-hand operand for operators that need a value. */
  readonly value?: JsonValue;
}

/** Sort array items by a field. */
export interface SortOp {
  /** Ascending or descending sort order. */
  readonly direction: "asc" | "desc";
  /** Object field name used as the sort key. */
  readonly field: string;
  /** Discriminant for sort operations. */
  readonly type: "sort";
}

/** Keep only listed fields on each object item. */
export interface PickOp {
  /** Field names retained on each object item. */
  readonly fields: readonly string[];
  /** Discriminant for pick operations. */
  readonly type: "pick";
}

/** Rename fields on each object item (`from` → `to`). */
export interface MapOp {
  /** Ordered rename pairs applied to each object item. */
  readonly renames: readonly { readonly from: string; readonly to: string }[];
  /** Discriminant for map operations. */
  readonly type: "map";
}

/** Keep the first N items. */
export interface LimitOp {
  /** Maximum number of items to keep; non-positive yields an empty array. */
  readonly count: number;
  /** Discriminant for limit operations. */
  readonly type: "limit";
}

/** One transform operation in the built-in DSL. */
export type TransformOp = FilterOp | SortOp | PickOp | MapOp | LimitOp;

/** A transform program applied at a root path. */
export interface TransformProgram {
  /** Ordered operations applied to the array at `rootPath`. */
  readonly ops: readonly TransformOp[];
  /** Path to the array target within the document. */
  readonly rootPath: JsonPath;
}

/** Result of applying or previewing a transform. */
export type TransformResult =
  | { readonly ok: true; readonly value: JsonValue }
  | { readonly ok: false; readonly message: string };
