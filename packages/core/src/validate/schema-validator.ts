import Ajv, { type ErrorObject, type ValidateFunction } from "ajv";

import { formatPath } from "../path/json-path.js";
import type {
  JsonPath,
  JsonValue,
  ValidationIssue,
} from "../types/json.types.js";
import type { IJsonValidator } from "./i-json-validator.js";

const NUMERIC_SEGMENT = /^\d+$/;

/**
 * Validates JSON against a JSON Schema (draft-07) using Ajv.
 */
export class SchemaValidator implements IJsonValidator {
  private readonly validateFn: ValidateFunction;
  private readonly source: string;

  /**
   * @param schema JSON Schema object.
   * @param source Label stored on emitted issues (default `"schema"`).
   */
  constructor(schema: object, source = "schema") {
    this.source = source;
    const ajv = new Ajv({ allErrors: true, strict: false });
    this.validateFn = ajv.compile(schema);
  }

  /**
   * Validates `data` against the compiled schema.
   * @param data Parsed JSON value.
   * @returns Schema validation issues.
   */
  validate(data: JsonValue): ValidationIssue[] {
    const valid = this.validateFn(data);
    if (valid || !this.validateFn.errors) {
      return [];
    }

    return this.validateFn.errors.map((error) => toIssue(error, this.source));
  }
}

/**
 * Maps an Ajv error to a {@link ValidationIssue}.
 * @param error Ajv error object.
 * @param source Issue source label.
 * @returns Normalized validation issue.
 */
function toIssue(error: ErrorObject, source: string): ValidationIssue {
  const path = instancePathToJsonPath(error.instancePath);
  const message = error.message ?? "Schema validation failed.";
  const location = formatPath(path);

  return {
    message: `${location}: ${message}`,
    path,
    severity: "error",
    source,
  };
}

/**
 * Converts an Ajv instance path (`/a/0/b`) to a {@link JsonPath}.
 * @param instancePath Ajv instance path string.
 * @returns JSON path segments.
 */
function instancePathToJsonPath(instancePath: string): JsonPath {
  if (!instancePath || instancePath === "") {
    return [];
  }

  return instancePath
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      const decoded = segment.replace(/~1/g, "/").replace(/~0/g, "~");
      if (NUMERIC_SEGMENT.test(decoded)) {
        return Number.parseInt(decoded, 10);
      }
      return decoded;
    });
}
