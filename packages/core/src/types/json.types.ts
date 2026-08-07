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

/**
 * Editor content as either parsed JSON or raw text.
 * Exactly one of `json` or `text` is the source of truth at a time.
 */
export type DocumentContent =
  | { readonly json: JsonValue; readonly text?: undefined }
  | { readonly text: string; readonly json?: undefined };

/** Parse failure details for invalid JSON text. */
export interface ParseError {
  readonly message: string;
  readonly position?: number;
}

/** A single validation finding from schema or custom rules. */
export interface ValidationIssue {
  readonly message: string;
  readonly path: JsonPath;
  readonly severity: "error" | "warning";
  readonly source: string;
}
