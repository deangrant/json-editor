import type { JsonValue, ParseError } from "../types/json.types.js";

/** Result of attempting to parse JSON text. */
export type ParseResult =
  | { readonly ok: true; readonly value: JsonValue }
  | { readonly ok: false; readonly error: ParseError };

/**
 * Parses JSON text into a typed value.
 */
export interface IJsonParser {
  /**
   * Parses `text` as JSON.
   * @param text Raw JSON text.
   * @returns Success with value, or a structured parse error.
   */
  parse(text: string): ParseResult;
}
