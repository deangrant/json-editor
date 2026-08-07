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
  readonly field: string;
  readonly operator: FilterOperator;
  readonly type: "filter";
  readonly value?: JsonValue;
}

/** Sort array items by a field. */
export interface SortOp {
  readonly direction: "asc" | "desc";
  readonly field: string;
  readonly type: "sort";
}

/** Keep only listed fields on each object item. */
export interface PickOp {
  readonly fields: readonly string[];
  readonly type: "pick";
}

/** Rename fields on each object item (`from` → `to`). */
export interface MapOp {
  readonly renames: readonly { readonly from: string; readonly to: string }[];
  readonly type: "map";
}

/** Keep the first N items. */
export interface LimitOp {
  readonly count: number;
  readonly type: "limit";
}

/** One transform operation in the built-in DSL. */
export type TransformOp = FilterOp | SortOp | PickOp | MapOp | LimitOp;

/** A transform program applied at a root path. */
export interface TransformProgram {
  readonly ops: readonly TransformOp[];
  readonly rootPath: JsonPath;
}

/** Result of applying or previewing a transform. */
export type TransformResult =
  | { readonly ok: true; readonly value: JsonValue }
  | { readonly ok: false; readonly message: string };
