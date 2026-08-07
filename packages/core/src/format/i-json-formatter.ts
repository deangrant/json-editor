import type { JsonValue } from "../types/json.types.js";

/**
 * Formats parsed JSON as text.
 */
export interface IJsonFormatter {
  /**
   * Pretty-prints JSON with indentation.
   * @param value Parsed JSON value.
   * @param spaces Indent width (default 2).
   * @returns Formatted JSON text.
   */
  beautify(value: JsonValue, spaces?: number): string;

  /**
   * Compact JSON with no extra whitespace.
   * @param value Parsed JSON value.
   * @returns Compact JSON text.
   */
  compact(value: JsonValue): string;
}
