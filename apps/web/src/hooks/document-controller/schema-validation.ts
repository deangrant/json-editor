import { JsonParser } from "@json-editor/core/parse/json-parser.js";
import type {
  JsonValue,
  ValidationIssue,
} from "@json-editor/core/types/json.types.js";
import type { WorkerResponse } from "@json-editor/core/worker/protocol.js";

import type { WorkerClient } from "../../services/worker-client.js";

const parser = new JsonParser();

/** Maximum schema text size accepted for validation jobs. */
const MAX_SCHEMA_TEXT_BYTES = 256 * 1024;

/** Result of collecting schema issues for a document value. */
export type SchemaIssueCollection =
  | { readonly kind: "invalidSchema"; readonly issues: ValidationIssue[] }
  | { readonly kind: "issues"; readonly issues: ValidationIssue[] };

/**
 * Builds a validation issue for schema text that is not JSON.
 * @param message Parser error message.
 * @returns Schema-sourced validation issue.
 */
function schemaJsonErrorIssue(message: string): ValidationIssue {
  return {
    message: `Schema is not valid JSON: ${message}`,
    path: [],
    severity: "error",
    source: "schema",
  };
}

/**
 * Maps a worker validate response to schema issues.
 * @param response Worker response for a validate job.
 * @returns Schema validation issues, or a failure issue.
 */
function schemaIssuesFromWorkerResponse(
  response: WorkerResponse,
): ValidationIssue[] {
  if (response.ok && response.result.type === "validate") {
    return response.result.issues;
  }
  if (!response.ok) {
    return [
      {
        message: `Schema validation failed: ${response.error}`,
        path: [],
        severity: "error",
        source: "schema",
      },
    ];
  }
  return [];
}

/**
 * Parses schema text and optionally validates `json` via the worker.
 * @param json Document value to validate.
 * @param schemaText Trimmed schema JSON text.
 * @param worker Optional worker client.
 * @returns Invalid-schema terminal issues, or collected schema issues.
 */
export async function collectSchemaIssues(
  json: JsonValue,
  schemaText: string,
  worker: WorkerClient | undefined,
): Promise<SchemaIssueCollection> {
  if (schemaText.length === 0) {
    return { issues: [], kind: "issues" };
  }

  const schemaBytes = new TextEncoder().encode(schemaText).byteLength;
  if (schemaBytes > MAX_SCHEMA_TEXT_BYTES) {
    return {
      issues: [
        {
          message: "Schema is too large to validate (max 256 KiB).",
          path: [],
          severity: "error",
          source: "schema",
        },
      ],
      kind: "invalidSchema",
    };
  }

  const schemaParsed = parser.parse(schemaText);
  if (!schemaParsed.ok) {
    return {
      issues: [schemaJsonErrorIssue(schemaParsed.error.message)],
      kind: "invalidSchema",
    };
  }

  if (!worker) {
    return { issues: [], kind: "issues" };
  }

  const response = await worker.run({
    schema: schemaParsed.value as object,
    type: "validate",
    value: json,
  });
  return {
    issues: schemaIssuesFromWorkerResponse(response),
    kind: "issues",
  };
}
