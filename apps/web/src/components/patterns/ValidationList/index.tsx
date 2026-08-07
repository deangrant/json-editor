import type {
  JsonPath,
  ValidationIssue,
} from "@json-editor/core/types/json.types.js";
import { useCallback } from "react";

import styles from "./index.module.css";
import type { ValidationListProps } from "./index.types.js";

/**
 * Clickable list of validation issues.
 * @param props Validation list props.
 * @returns Issue list.
 */
export function ValidationList({ issues, onSelectPath }: ValidationListProps) {
  if (issues.length === 0) {
    return <p className={styles.empty}>No validation issues.</p>;
  }

  return (
    <ul className={styles.list}>
      {issues.map((issue) => (
        <ValidationIssueItem
          issue={issue}
          key={`${issue.source}:${issue.message}:${issue.path.join(".")}`}
          onSelectPath={onSelectPath}
        />
      ))}
    </ul>
  );
}

/**
 * Single clickable validation issue row.
 * @param props Issue item props.
 * @returns Issue button row.
 */
function ValidationIssueItem({
  issue,
  onSelectPath,
}: {
  issue: ValidationIssue;
  onSelectPath?: ((path: JsonPath) => void) | undefined;
}) {
  const handleClick = useCallback(() => {
    onSelectPath?.(issue.path);
  }, [issue.path, onSelectPath]);

  return (
    <li>
      <button className={styles.item} onClick={handleClick} type="button">
        <span className={styles.source}>{issue.source}</span>
        {issue.message}
      </button>
    </li>
  );
}
