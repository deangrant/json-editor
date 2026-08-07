import type { ValidationIssue } from "@json-editor/core/types/json.types.js";

/** Props for ValidationList. */
export interface ValidationListProps {
  readonly issues: readonly ValidationIssue[];
  readonly onSelectPath?: (path: ValidationIssue["path"]) => void;
}
