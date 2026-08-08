import type { JsonValue } from "../types/json.types.js";
import type { IJsonFormatter } from "./i-json-formatter.js";

/**
 * Formats JSON with `JSON.stringify`.
 */
export class JsonFormatter implements IJsonFormatter {
  /**
   * Pretty-prints JSON with indentation.
   * @param value Parsed JSON value.
   * @param spaces Indent width (default 2).
   * @returns Formatted JSON text.
   */
  beautify(value: JsonValue, spaces = 2): string {
    return `${JSON.stringify(value, null, spaces)}\n`;
  }

  /**
   * Compacts JSON with no extra whitespace.
   * @param value Parsed JSON value.
   * @returns Compact JSON text.
   */
  compact(value: JsonValue): string {
    return JSON.stringify(value);
  }
}
