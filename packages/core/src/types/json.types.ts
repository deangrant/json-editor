/**
 * JSON value types and shared document content shapes used across the core.
 */

/** A path segment into a JSON document (object key or array index). */
export type JsonPathSegment = string | number;

/** Ordered path from the document root to a value. */
export type JsonPath = readonly JsonPathSegment[];

/** Any JSON-compatible value. */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

/** Parse failure details for invalid JSON text. */
export interface ParseError {
  /** Human-readable parse failure description. */
  readonly message: string;
  /** Optional character offset into the source text. */
  readonly position?: number;
}

/** A single validation finding from schema or custom rules. */
export interface ValidationIssue {
  /** Human-readable issue description, often including a path prefix. */
  readonly message: string;
  /** Path to the offending value within the document. */
  readonly path: JsonPath;
  /** Issue severity used for filtering and presentation. */
  readonly severity: "error" | "warning";
  /** Origin label such as `"schema"` or `"custom"`. */
  readonly source: string;
}
