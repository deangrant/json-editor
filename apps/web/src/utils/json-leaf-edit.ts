import type { JsonValue } from "@json-editor/core/types/json.types.js";

const JSON_LITERALS = new Set(["true", "false", "null"]);

/**
 * Stringifies a leaf value for an editor input.
 * Strings stay unquoted; other JSON values use `JSON.stringify`.
 * @param value Leaf value, or `undefined` for empty.
 * @returns Editable text.
 */
export function stringifyLeafValue(value: JsonValue | undefined): string {
  if (value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}

// Escape hatch: wrap in JSON quotes (`"42"`) to force a string when the
// previous value was a number/boolean; use bare JSON literals (`true`,
// `null`, `{…}`, `[…]`) to coerce away from a previous string.
/**
 * Parses edited leaf text back into a JSON value.
 * @param text Draft text from the editor.
 * @param previous Value before the edit, when known.
 * @returns Parsed JSON value.
 */
export function parseLeafValue(
  text: string,
  previous: JsonValue | undefined,
): JsonValue {
  if (text === "") {
    return "";
  }

  if (typeof previous === "string") {
    return parseFromPreviousString(text);
  }

  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    return text;
  }
}

/**
 * Parses draft text when the previous value was a string.
 * Bare number-like text stays a string; intentional JSON coerces.
 * @param text Draft text.
 * @returns Parsed value.
 */
function parseFromPreviousString(text: string): JsonValue {
  const trimmed = text.trim();
  if (
    !(
      trimmed.startsWith('"') ||
      trimmed.startsWith("{") ||
      trimmed.startsWith("[") ||
      JSON_LITERALS.has(trimmed)
    )
  ) {
    return text;
  }

  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    return text;
  }
}
