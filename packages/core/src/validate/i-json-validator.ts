import type { JsonValue, ValidationIssue } from "../types/json.types.js";

/**
 * Validates a JSON value and returns zero or more issues.
 */
export interface IJsonValidator {
  /**
   * Validates `data`.
   * @param data Parsed JSON value.
   * @returns Validation issues (empty when valid).
   */
  validate(data: JsonValue): ValidationIssue[];
}
