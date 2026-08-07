import type { JsonValue, ValidationIssue } from "../types/json.types.js";
import type { IJsonValidator } from "./i-json-validator.js";

/**
 * Runs multiple validators and merges their issues.
 */
export class CompositeValidator implements IJsonValidator {
  private readonly validators: readonly IJsonValidator[];

  /**
   * @param validators Validators to run in order.
   */
  constructor(validators: readonly IJsonValidator[]) {
    this.validators = validators;
  }

  /**
   * Validates `data` with every configured validator.
   * @param data Parsed JSON value.
   * @returns Combined validation issues.
   */
  validate(data: JsonValue): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    for (const validator of this.validators) {
      issues.push(...validator.validate(data));
    }
    return issues;
  }
}
