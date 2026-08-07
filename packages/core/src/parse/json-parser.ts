import type { JsonValue, ParseError } from "../types/json.types.js";
import type { IJsonParser, ParseResult } from "./i-json-parser.js";

const POSITION_PATTERN = /position\s+(\d+)/i;

/**
 * Parses JSON with `JSON.parse` and extracts a character position when present.
 */
export class JsonParser implements IJsonParser {
  /**
   * Parses `text` as JSON.
   * @param text Raw JSON text.
   * @returns Success with value, or a structured parse error.
   */
  parse(text: string): ParseResult {
    try {
      const value = JSON.parse(text) as JsonValue;
      return { ok: true, value };
    } catch (cause) {
      return { error: toParseError(cause), ok: false };
    }
  }
}

/**
 * Maps a thrown value to a {@link ParseError}.
 * @param cause Value thrown by `JSON.parse`.
 * @returns Structured parse error.
 */
function toParseError(cause: unknown): ParseError {
  if (!(cause instanceof SyntaxError)) {
    return { message: cause instanceof Error ? cause.message : String(cause) };
  }

  const message = cause.message;
  const match = POSITION_PATTERN.exec(message);
  const position =
    match?.[1] === undefined ? undefined : Number.parseInt(match[1], 10);

  if (position === undefined || Number.isNaN(position)) {
    return { message };
  }

  return { message, position };
}
