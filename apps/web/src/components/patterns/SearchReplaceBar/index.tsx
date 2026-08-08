import { type ChangeEvent, useCallback } from "react";

import { Button } from "../../core/Button/index.js";
import { Input } from "../../core/Input/index.js";
import styles from "./index.module.css";
import type { SearchReplaceBarProps } from "./index.types.js";

/**
 * Search and replace controls for document text.
 * @param props Search/replace props.
 * @returns Search and replace bar.
 */
export function SearchReplaceBar({
  query,
  replaceValue,
  replaceEnabled,
  searchPlaceholder,
  onQueryChange,
  onReplaceChange,
  onReplace,
  onReplaceAll,
}: SearchReplaceBarProps) {
  const handleQueryChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onQueryChange(event.target.value);
    },
    [onQueryChange],
  );

  const handleReplaceChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onReplaceChange(event.target.value);
    },
    [onReplaceChange],
  );

  return (
    <div className={styles.bar}>
      <div className={styles.field}>
        <Input
          label="Search"
          onChange={handleQueryChange}
          placeholder={searchPlaceholder}
          value={query}
        />
      </div>
      <div className={styles.field}>
        <Input
          label="Replace"
          onChange={handleReplaceChange}
          placeholder="Replace with…"
          value={replaceValue}
        />
      </div>
      <div className={styles.actions}>
        <Button disabled={!replaceEnabled} onClick={onReplace} size="sm">
          Replace
        </Button>
        <Button
          disabled={!replaceEnabled}
          onClick={onReplaceAll}
          size="sm"
          variant="secondary"
        >
          Replace all
        </Button>
      </div>
    </div>
  );
}
