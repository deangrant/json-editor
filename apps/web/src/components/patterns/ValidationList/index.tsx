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
        <li key={`${issue.source}:${issue.message}:${issue.path.join(".")}`}>
          <button
            className={styles.item}
            onClick={() => {
              onSelectPath?.(issue.path);
            }}
            type="button"
          >
            <span className={styles.source}>{issue.source}</span>
            {issue.message}
          </button>
        </li>
      ))}
    </ul>
  );
}
