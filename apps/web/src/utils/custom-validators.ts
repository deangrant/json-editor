import type {
  JsonValue,
  ValidationIssue,
} from "@json-editor/core/types/json.types.js";
import type { IJsonValidator } from "@json-editor/core/validate/i-json-validator.js";

/**
 * Creates a sample custom validator that flags `banned: true`.
 * @returns Custom validator instance.
 */
export function createBannedFlagValidator(): IJsonValidator {
  return {
    validate(data: JsonValue): ValidationIssue[] {
      return collectBanned(data, []);
    },
  };
}

/**
 * Walks a JSON tree and collects banned-flag issues.
 * @param value Current value.
 * @param path Path to the current value.
 * @returns Issues found under this subtree.
 */
function collectBanned(
  value: JsonValue,
  path: (string | number)[],
): ValidationIssue[] {
  if (value === null || typeof value !== "object") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectBanned(item, [...path, index]),
    );
  }

  const issues: ValidationIssue[] = [];
  if (value.banned === true) {
    issues.push({
      message: "Custom rule: `banned` must not be true.",
      path: [...path, "banned"],
      severity: "error",
      source: "custom",
    });
  }

  for (const [key, child] of Object.entries(value)) {
    issues.push(...collectBanned(child as JsonValue, [...path, key]));
  }
  return issues;
}
