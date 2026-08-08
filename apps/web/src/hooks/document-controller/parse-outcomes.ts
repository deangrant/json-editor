import { JsonParser } from "@json-editor/core/parse/json-parser.js";
import type {
  JsonValue,
  ParseError,
} from "@json-editor/core/types/json.types.js";
import type { WorkerResponse } from "@json-editor/core/worker/protocol.js";

const parser = new JsonParser();

/** Outcome of a document text parse attempt. */
export interface ParseOutcome {
  readonly json: JsonValue | undefined;
  readonly parseError: ParseError | undefined;
}

/**
 * Maps a worker parse response into a document parse outcome.
 * @param response Worker response for a parse job.
 * @returns Parsed value or parse error fields for the reducer.
 */
export function outcomeFromWorkerParseResponse(
  response: WorkerResponse,
): ParseOutcome {
  if (response.ok && response.result.type === "parse") {
    return { json: response.result.value, parseError: undefined };
  }
  if (!response.ok) {
    const { parseError } = response;
    return { json: undefined, parseError };
  }
  return { json: undefined, parseError: undefined };
}

/**
 * Parses text on the main thread when no worker is available.
 * @param text Document text to parse.
 * @returns Parsed value or parse error fields for the reducer.
 */
export function outcomeFromLocalParse(text: string): ParseOutcome {
  const parsed = parser.parse(text);
  if (parsed.ok) {
    return { json: parsed.value, parseError: undefined };
  }
  const { error: parseError } = parsed;
  return { json: undefined, parseError };
}
